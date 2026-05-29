import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import UserModel from "@/models/User";
import { UserRole } from "@/types/enums";
import { extractPhones, sendWhatsAppMessage } from "@/lib/whatsapp";
import type { ApiResponse } from "@/types";

interface BroadcastBody {
  message: string;
  recipients: "all_parents" | "class" | "class_students" | "teachers" | "custom";
  classId?: string;
  phoneNumbers?: string[];
}

interface WhatsAppResult {
  phone: string;
  name: string;
  status: "sent" | "failed";
  error?: string;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<object>>> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectDB();

    const body = (await request.json()) as BroadcastBody;
    const { message, recipients, classId, phoneNumbers } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 },
      );
    }

    // ── Build recipient list ────────────────────────────────────────────────
    interface Recipient {
      name: string;
      phone: string;
    }

    const recipientList: Recipient[] = [];

    if (recipients === "all_parents") {
      const parents = await UserModel.find({
        roles: UserRole.PARENT,
        status: "active",
        phone: { $exists: true, $ne: "" },
      })
        .select("surname firstName otherName phone")
        .lean();

      for (const p of parents) {
        const parent = p as unknown as {
          surname: string;
          firstName: string;
          otherName: string;
          phone?: string;
        };
        if (!parent.phone) continue;
        const name = `${parent.surname} ${parent.firstName}`.trim();
        const phones = extractPhones(parent.phone);
        for (const phone of phones) {
          recipientList.push({ name, phone });
        }
      }
    } else if (recipients === "teachers") {
      const teachers = await UserModel.find({
        roles: UserRole.TEACHER,
        status: "active",
        phone: { $exists: true, $ne: "" },
      })
        .select("surname firstName otherName phone")
        .lean();

      for (const t of teachers) {
        const teacher = t as unknown as {
          surname: string;
          firstName: string;
          otherName: string;
          phone?: string;
        };
        if (!teacher.phone) continue;
        const name = `${teacher.surname} ${teacher.firstName}`.trim();
        const phones = extractPhones(teacher.phone);
        for (const phone of phones) {
          recipientList.push({ name, phone });
        }
      }
    } else if (recipients === "class" && classId) {
      const students = await UserModel.find({
        roles: UserRole.STUDENT,
        currentClass: classId,
        studentStatus: "active",
      })
        .select("parents")
        .populate("parents", "surname firstName otherName phone")
        .lean();

      const seen = new Set<string>();
      for (const student of students) {
        const s = student as unknown as {
          parents?: Array<{
            _id: { toString(): string };
            surname: string;
            firstName: string;
            otherName: string;
            phone?: string;
          }>;
        };
        for (const p of s.parents ?? []) {
          if (!p.phone || seen.has(p._id.toString())) continue;
          seen.add(p._id.toString());
          const name = `${p.surname} ${p.firstName}`.trim();
          const phones = extractPhones(p.phone);
          for (const phone of phones) {
            recipientList.push({ name, phone });
          }
        }
      }
    } else if (recipients === "class_students" && classId) {
      const students = await UserModel.find({
        roles: UserRole.STUDENT,
        currentClass: classId,
        studentStatus: "active",
        phone: { $exists: true, $ne: "" },
      })
        .select("surname firstName phone")
        .lean();

      for (const s of students) {
        const student = s as unknown as {
          surname: string;
          firstName: string;
          phone?: string;
        };
        if (!student.phone) continue;
        const name = `${student.surname} ${student.firstName}`.trim();
        const phones = extractPhones(student.phone);
        for (const phone of phones) recipientList.push({ name, phone });
      }
    } else if (recipients === "custom" && phoneNumbers?.length) {
      for (const raw of phoneNumbers) {
        // Support optional "Name::phone" format
        const [namePart, phonePart] = raw.includes("::")
          ? raw.split("::").map((s) => s.trim())
          : ["Valued Contact", raw.trim()];

        const phones = extractPhones(phonePart);
        for (const phone of phones) {
          recipientList.push({ name: namePart, phone });
        }
      }
    }

    if (recipientList.length === 0) {
      return NextResponse.json(
        { success: false, error: "No recipients with phone numbers found" },
        { status: 400 },
      );
    }

    // ── Send messages ───────────────────────────────────────────────────────
    const results: WhatsAppResult[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const recipient of recipientList) {
      const result = await sendWhatsAppMessage(
        recipient.phone,
        recipient.name,
        message,
      );
      if (result.success) {
        successCount++;
        results.push({
          phone: recipient.phone,
          name: recipient.name,
          status: "sent",
        });
      } else {
        failCount++;
        results.push({
          phone: recipient.phone,
          name: recipient.name,
          status: "failed",
          error: result.error,
        });
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    return NextResponse.json({
      success: true,
      data: { successCount, failCount, total: recipientList.length, results },
      message: `Message sent to ${successCount} of ${recipientList.length} recipients`,
    });
  } catch (error) {
    console.error("WhatsApp broadcast error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
