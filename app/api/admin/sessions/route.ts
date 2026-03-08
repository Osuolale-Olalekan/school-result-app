import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { SessionModel, TermModel } from "@/models/Session";
import { AuditAction, SessionStatus, TermName, TermStatus, UserRole } from "@/types/enums";
import { createAuditLog } from "@/lib/audit";
import type { ApiResponse } from "@/types";

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) return null;
  return session;
}

/** Validates session name: exactly YYYY/YYYY, second year = first + 1 */
function validateSessionName(name: string): string | null {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "Session name is required";
  if (!/^\d{4}\/\d{4}$/.test(trimmed)) return "Session name must be in the format YYYY/YYYY (e.g. 2025/2026)";

  const [startStr, endStr] = trimmed.split("/");
  const startYear = parseInt(startStr!);
  const endYear = parseInt(endStr!);

  if (startYear < 1900 || startYear > 2100) return "Start year is out of range";
  if (endYear !== startYear + 1) return `End year must be exactly ${startYear + 1} (one year after ${startYear})`;

  return null;
}

export async function GET(): Promise<NextResponse<ApiResponse<object[]>>> {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const sessions = await SessionModel.find()
      .populate("terms")
      .sort({ startYear: -1 })
      .lean();
    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error("[GET /api/admin/sessions]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<object>>> {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();

    const body = await request.json() as {
      name: string;
      startYear: number;
      endYear: number;
      terms: Array<{
        name: TermName;
        startDate?: string;
        endDate?: string;
        resumptionDate?: string;
        schoolDaysOpen?: number;
      }>;
    };

    // ── 1. Validate session name format ──────────────────────────────────────
    const nameError = validateSessionName(body.name);
    if (nameError) {
      return NextResponse.json({ success: false, error: nameError }, { status: 400 });
    }

    // ── 2. Validate first term has at least startDate and endDate ────────────
    const firstTerm = body.terms?.[0];
    if (!firstTerm?.startDate?.trim()) {
      return NextResponse.json(
        { success: false, error: "First term start date is required" },
        { status: 400 },
      );
    }
    if (!firstTerm?.endDate?.trim()) {
      return NextResponse.json(
        { success: false, error: "First term end date is required" },
        { status: 400 },
      );
    }

    // ── 3. Check for duplicate session name ──────────────────────────────────
    const existingSession = await SessionModel.findOne({
      name: body.name.trim(),
    });
    if (existingSession) {
      return NextResponse.json(
        { success: false, error: "A session with this name already exists" },
        { status: 409 },
      );
    }

    // ── 4. All validation passed — create session ────────────────────────────
    const newSession = await SessionModel.create({
      name: body.name.trim(),
      startYear: body.startYear,
      endYear: body.endYear,
      status: SessionStatus.UPCOMING,
    });

    // ── 5. Create terms — skip second/third if dates are missing ─────────────
    const termNames = [TermName.FIRST, TermName.SECOND, TermName.THIRD];
    const termIds: unknown[] = [];

    try {
      for (let i = 0; i < 3; i++) {
        const termData = body.terms[i];
        const hasRequiredDates = termData?.startDate?.trim() && termData?.endDate?.trim();

        // Second and third terms are skipped if dates are not provided
        if (i > 0 && !hasRequiredDates) continue;

        const term = await TermModel.create({
          name: termData?.name ?? termNames[i],
          status: TermStatus.UPCOMING,
          startDate: termData!.startDate,
          endDate: termData!.endDate,
          resumptionDate: termData?.resumptionDate?.trim() || undefined,
          schoolDaysOpen: termData?.schoolDaysOpen ?? 0,
          session: newSession._id,
        });
        termIds.push(term._id);
      }
    } catch (termError) {
      // If term creation fails after session was created, roll back the session
      await SessionModel.findByIdAndDelete(newSession._id);
      console.error("[POST /api/admin/sessions] term creation failed, rolled back session:", termError);
      return NextResponse.json(
        { success: false, error: "Failed to create terms. Session was not saved." },
        { status: 500 },
      );
    }

    newSession.terms = termIds as typeof newSession.terms;
    await newSession.save();

    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.surname} ${session.user.firstName} ${session.user.otherName}`,
      actorRole: UserRole.ADMIN,
      action: AuditAction.CREATE,
      entity: "Session",
      entityId: newSession._id.toString(),
      description: `Created academic session: ${body.name}`,
    });

    const populated = await SessionModel.findById(newSession._id).populate("terms").lean();
    return NextResponse.json(
      { success: true, data: populated!, message: "Session created successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/admin/sessions]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
// import { NextRequest, NextResponse } from "next/server";
// // import { auth } from "@/lib/auth";
// // import { getServerSession } from "next-auth";
// import { getSession } from "@/lib/session";
// import { authConfig } from "@/lib/auth";
// import { connectDB } from "@/lib/db";
// import { SessionModel, TermModel } from "@/models/Session";
// import { AuditAction, SessionStatus, TermName, TermStatus, UserRole } from "@/types/enums";
// import { createAuditLog } from "@/lib/audit";
// import type { ApiResponse } from "@/types";

// async function requireAdmin() {
//   const session = await getSession();
//   if (!session?.user || session.user.activeRole !== UserRole.ADMIN) return null;
//   return session;
// }

// export async function GET(): Promise<NextResponse<ApiResponse<object[]>>> {
//   const session = await requireAdmin();
//   if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

//   try {
//     await connectDB();
//     const sessions = await SessionModel.find()
//       .populate("terms")
//       .sort({ startYear: -1 })
//       .lean();
//     return NextResponse.json({ success: true, data: sessions });
//   } catch (error) {
    
//     return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
//   }
// }

// export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<object>>> {
//   const session = await requireAdmin();
//   if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

//   try {
//     await connectDB();

//     const body = await request.json() as {
//       name: string;
//       startYear: number;
//       endYear: number;
//       terms: Array<{
//         name: TermName;
//         startDate: string;
//         endDate: string;
//         resumptionDate?: string;
//         schoolDaysOpen?: number;
//       }>;
//     };

//     const existingSession = await SessionModel.findOne({ name: body.name });
//     if (existingSession) {
//       return NextResponse.json({ success: false, error: "Session already exists" }, { status: 409 });
//     }

//     // Create session
//     const newSession = await SessionModel.create({
//       name: body.name,
//       startYear: body.startYear,
//       endYear: body.endYear,
//       status: SessionStatus.UPCOMING,
//     });

//     // Create 3 terms for the session
//     const termNames = [TermName.FIRST, TermName.SECOND, TermName.THIRD];
//     const termIds: unknown[] = [];

//     for (let i = 0; i < 3; i++) {
//       const termData = body.terms[i];
//       const term = await TermModel.create({
//         name: termData?.name ?? termNames[i],
//         status: TermStatus.UPCOMING,
//         startDate: termData?.startDate ?? new Date(),
//         endDate: termData?.endDate ?? new Date(),
//         resumptionDate: termData?.resumptionDate,
//         schoolDaysOpen: termData?.schoolDaysOpen ?? 0,
//         session: newSession._id,
//       });
//       termIds.push(term._id);
//     }

//     newSession.terms = termIds as typeof newSession.terms;
//     await newSession.save();

//     await createAuditLog({
//       actorId: session.user.id,
//       actorName: `${session.user.surname} ${session.user.firstName} ${session.user.otherName}`,
//       actorRole: UserRole.ADMIN,
//       action: AuditAction.CREATE,
//       entity: "Session",
//       entityId: newSession._id.toString(),
//       description: `Created academic session: ${body.name}`,
//     });

//     const populated = await SessionModel.findById(newSession._id).populate("terms").lean();
//     return NextResponse.json({ success: true, data: populated!, message: "Session created successfully" }, { status: 201 });
//   } catch (error) {
   
//     return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
//   }
// }
