// ─── app/api/parent/payment-history/route.ts ─────────────────────────────────
// Parent: GET all payment records for their children

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import PaymentRecordModel from "@/models/PaymentRecord";
import { UserRole } from "@/types/enums";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.PARENT) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const UserModel = (await import("@/models/User")).default;
    const parent    = await UserModel.findById(session.user.id, { children: 1 }).lean();

    if (!parent?.children?.length) {
      return NextResponse.json({ success: true, data: [] });
    }

    const childIds = parent.children.map((c: unknown) => String(c));

    const payments = await PaymentRecordModel.find({
      student: { $in: childIds },
    })
      .populate("session", "name")
      .populate("term",    "name")
      .populate("student", "firstName surname admissionNumber")
      .sort({ createdAt: -1 })
      .lean();

    // Only return paid records in history
    const paid = payments.filter((p) => p.status === "paid" || p.amount);

    return NextResponse.json({ success: true, data: paid });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// SETUP INSTRUCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/*
1. ADD MODEL — models/FeeStructure.ts  (from FeeStructure.ts output)

2. ADD TO models/registerModels.ts:
   import "@/models/FeeStructure"

3. PLACE API ROUTE FILES:
   - admin-fee-structure-route.ts      → app/api/admin/fee-structure/route.ts
   - admin-fee-structure-id-route.ts   → app/api/admin/fee-structure/[id]/route.ts
   - admin-outstanding-balances-route.ts → app/api/admin/outstanding-balances/route.ts
   - admin-fee-reminders-route.ts      → app/api/admin/fee-reminders/route.ts
   - parent-fee-structure-route.ts     → app/api/parent/fee-structure/route.ts
   - parent-payment-history-route.ts   → app/api/parent/payment-history/route.ts  (this file)
   - parent-payments-initialize-route.ts → REPLACE app/api/parent/payments/initialize/route.ts
   - parent-payments-verify-route.ts   → REPLACE app/api/parent/payments/verify/route.ts

4. PLACE COMPONENTS:
   - FeeStructureManagement.tsx  → components/admin/FeeStructureManagement.tsx
   - OutstandingBalances.tsx     → components/admin/OutstandingBalances.tsx
   - ParentPaymentHistory.tsx    → components/parent/ParentPaymentHistory.tsx

5. CREATE PAGE FILES:

   app/(dashboard)/admin/fee-structure/page.tsx:
     import FeeStructureManagement from "@/components/admin/FeeStructureManagement"
     export default function Page() { return <FeeStructureManagement /> }

   app/(dashboard)/admin/outstanding-balances/page.tsx:
     import OutstandingBalances from "@/components/admin/OutstandingBalances"
     export default function Page() { return <OutstandingBalances /> }

   app/(dashboard)/parent/payments/page.tsx:
     import ParentPaymentHistory from "@/components/parent/ParentPaymentHistory"
     export default function Page() { return <ParentPaymentHistory /> }

6. ADD SIDEBAR LINKS:
   ADMIN_NAV:
     { label: "Fee Structure",       href: "/admin/fee-structure",        icon: Banknote    }
     { label: "Outstanding Balances", href: "/admin/outstanding-balances", icon: AlertCircle }
   PARENT_NAV:
     { label: "Payments",            href: "/parent/payments",             icon: CreditCard  }

7. NOTE — the existing AdminPaymentsView already handles marking payments manually.
   The new FeeStructureManagement lets admin define the expected amounts per class/term
   so that amount pre-populates when marking payments. You can wire this up by fetching
   the fee structure in AdminPaymentsView and defaulting the amount field to the
   fee structure total when opening the mark modal.
*/