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
  recipients: "all_parents" | "class" | "teachers" | "custom";
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
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const body = (await request.json()) as BroadcastBody;
    const { message, recipients, classId, phoneNumbers } = body;

    if (!message?.trim()) {
      return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });
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
      }).select("surname firstName otherName phone").lean();

      for (const p of parents) {
        const parent = p as unknown as { surname: string; firstName: string; otherName: string; phone?: string };
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
      }).select("surname firstName otherName phone").lean();

      for (const t of teachers) {
        const teacher = t as unknown as { surname: string; firstName: string; otherName: string; phone?: string };
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
      }).select("parents").populate("parents", "surname firstName otherName phone").lean();

      const seen = new Set<string>();
      for (const student of students) {
        const s = student as unknown as {
          parents?: Array<{ _id: { toString(): string }; surname: string; firstName: string; otherName: string; phone?: string }>;
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

    } else if (recipients === "custom" && phoneNumbers?.length) {
      for (const raw of phoneNumbers) {
        const phones = extractPhones(raw);
        for (const phone of phones) {
          recipientList.push({ name: "Parent", phone });
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
      const result = await sendWhatsAppMessage(recipient.phone, recipient.name, message);
      if (result.success) {
        successCount++;
        results.push({ phone: recipient.phone, name: recipient.name, status: "sent" });
      } else {
        failCount++;
        results.push({ phone: recipient.phone, name: recipient.name, status: "failed", error: result.error });
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
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// import { NextRequest, NextResponse } from "next/server";
// import { getSession } from "@/lib/session";
// import { connectDB } from "@/lib/db";
// import "@/lib/registerModels";
// import UserModel from "@/models/User";
// import { UserRole } from "@/types/enums";
// import type { ApiResponse } from "@/types";

// const WHATSAPP_API_URL = `https://graph.facebook.com/v25.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
// const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
// const TEMPLATE_NAME = "school_notification";

// interface BroadcastBody {
//   message: string;
//   recipients: "all" | "class" | "custom";
//   classId?: string;
//   phoneNumbers?: string[];
// }

// interface WhatsAppResult {
//   phone: string;
//   name: string;
//   status: "sent" | "failed";
//   error?: string;
// }

// async function sendWhatsAppMessage(
//   phone: string,
//   recipientName: string,
//   message: string,
// ): Promise<{ success: boolean; error?: string }> {
//   try {
//     const res = await fetch(WHATSAPP_API_URL, {
//       method: "POST",
//       headers: {
//         "Authorization": `Bearer ${ACCESS_TOKEN}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         messaging_product: "whatsapp",
//         to: phone,
//         type: "template",
//         template: {
//           name: TEMPLATE_NAME,
//           language: { code: "en_US" },
//           components: [
//             {
//               type: "body",
//               parameters: [
//                 { type: "text", text: recipientName },
//                 { type: "text", text: message },
//               ],
//             },
//           ],
//         },
//       }),
//     });

//     const json = await res.json() as { error?: { message: string } };
//     if (!res.ok) {
//       return { success: false, error: json.error?.message ?? "Unknown error" };
//     }
//     return { success: true };
//   } catch (err) {
//     return { success: false, error: err instanceof Error ? err.message : "Network error" };
//   }
// }

// export async function POST(
//   request: NextRequest,
// ): Promise<NextResponse<ApiResponse<object>>> {
//   const session = await getSession();
//   if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
//     return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//   }

//   try {
//     await connectDB();

//     const body = (await request.json()) as BroadcastBody;
//     const { message, recipients, classId, phoneNumbers } = body;

//     if (!message?.trim()) {
//       return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });
//     }

//     // ── Build recipient list ────────────────────────────────────────────────
//     let parents: Array<{ surname: string; firstName: string; phone?: string }> = [];

//     if (recipients === "all") {
//       parents = await UserModel.find({
//         roles: UserRole.PARENT,
//         status: "active",
//         phone: { $exists: true, $ne: "" },
//       }).select("surname firstName phone").lean() as typeof parents;

//     } else if (recipients === "class" && classId) {
//       // Get students in this class, then get their parents
//       const students = await UserModel.find({
//         roles: UserRole.STUDENT,
//         currentClass: classId,
//         studentStatus: "active",
//       }).select("parents").populate("parents", "surname firstName phone").lean();

//       const parentMap = new Map<string, { surname: string; firstName: string; phone?: string }>();
//       for (const student of students) {
//         const s = student as unknown as { parents?: Array<{ _id: { toString(): string }; surname: string; firstName: string; phone?: string }> };
//         for (const p of s.parents ?? []) {
//           if (p.phone) parentMap.set(p._id.toString(), p);
//         }
//       }
//       parents = Array.from(parentMap.values());

//     } else if (recipients === "custom" && phoneNumbers?.length) {
//       // Manual phone numbers — treat name as "Parent"
//       parents = phoneNumbers.map((phone) => ({
//         surname: "Parent",
//         firstName: "",
//         phone,
//       }));
//     }

//     if (parents.length === 0) {
//       return NextResponse.json({ success: false, error: "No recipients with phone numbers found" }, { status: 400 });
//     }

//     // ── Send messages ───────────────────────────────────────────────────────
//     const results: WhatsAppResult[] = [];
//     let successCount = 0;
//     let failCount = 0;

//     for (const parent of parents) {
//       if (!parent.phone) continue;

//       // Normalize phone — remove leading 0, add 234 for Nigeria
//       let phone = parent.phone.replace(/\s+/g, "").replace(/^0/, "234");
//       if (!phone.startsWith("234") && !phone.startsWith("+")) {
//         phone = `234${phone}`;
//       }
//       phone = phone.replace(/^\+/, "");

//       const name = `${parent.surname} ${parent.firstName}`.trim();
//       const result = await sendWhatsAppMessage(phone, name, message);

//       if (result.success) {
//         successCount++;
//         results.push({ phone, name, status: "sent" });
//       } else {
//         failCount++;
//         results.push({ phone, name, status: "failed", error: result.error });
//       }

//       // Small delay to avoid rate limiting
//       await new Promise((r) => setTimeout(r, 200));
//     }

//     return NextResponse.json({
//       success: true,
//       data: { successCount, failCount, total: parents.length, results },
//       message: `Message sent to ${successCount} of ${parents.length} recipients`,
//     });

//   } catch (error) {
//     console.error("WhatsApp broadcast error:", error);
//     return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
//   }
// }