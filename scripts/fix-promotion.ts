/**
 * One-off fix script — run once, then delete.
 *
 * Fixes a student who was wrongly auto-promoted (currentClass moved
 * immediately instead of pendingClass) by the pre-fix handlePromotion() bug.
 *
 * USAGE:
 *   1. Place this file anywhere in your Next.js project (e.g. /scripts/fix-promotion.ts)
 *   2. Run in DRY RUN mode first (default) to verify:
 *        npx tsx scripts/fix-promotion.ts
 *   3. Once the printed output looks correct, run for real:
 *        npx tsx scripts/fix-promotion.ts --apply
 *
 * Requires `tsx` (or ts-node) installed: npm install -D tsx
 */

import { connectDB } from "../lib/db"; // ← adjust path if you place this file elsewhere
import "../lib/registerModels";
import StudentModel from "../models/Student";
import ReportCardModel from "../models/ReportCard";
import ClassModel from "../models/Class";
import { ReportStatus, TermName } from "../types/enums";

const ADMISSION_NUMBER = "GWS/19/0784";
const APPLY = process.argv.includes("--apply");

async function main() {
  await connectDB();

  // ── 1. Find the student ────────────────────────────────────────────────
  const student = await StudentModel.findOne({
    admissionNumber: ADMISSION_NUMBER,
  }).populate("currentClass", "name");

  if (!student) {
    console.error(`❌ No student found with admission number ${ADMISSION_NUMBER}`);
    process.exit(1);
  }

  const studentInfo = student as unknown as {
    surname: string;
    firstName: string;
    otherName: string;
  };

  console.log(`✅ Found student: ${studentInfo.surname} ${studentInfo.firstName} ${studentInfo.otherName}`);
  console.log(`   Current class right now: ${(student.currentClass as unknown as { name: string })?.name ?? "(none)"}`);

  // ── 2. Find the 3rd-term approved report that triggered the promotion ──
  const report = await ReportCardModel.findOne({
    student: student._id,
    termName: TermName.THIRD,
    status: ReportStatus.APPROVED,
    isPromoted: true,
  }).lean();

  if (!report) {
    console.error("❌ No matching APPROVED 3rd-term report with isPromoted=true found for this student.");
    process.exit(1);
  }

  const correctOldClassName = report.className; // where he SHOULD currently still be
  const wronglyPromotedToName = report.promotedToClass; // where he was wrongly moved to

  console.log(`\n📄 Found matching report card:`);
  console.log(`   Report's className (his class during that term): ${correctOldClassName}`);
  console.log(`   promotedToClass (where he was wrongly moved):     ${wronglyPromotedToName}`);

  if (
    !wronglyPromotedToName ||
    ["Graduated", "Performance Under Review", "Pending Department Assignment"].includes(
      wronglyPromotedToName,
    )
  ) {
    console.error(
      `\n⚠️  promotedToClass is "${wronglyPromotedToName}" — this isn't a normal class promotion, so this script won't touch it. Stopping to avoid a wrong fix.`,
    );
    process.exit(1);
  }

  // ── 3. Resolve both class documents ─────────────────────────────────────
  const oldClassDoc = await ClassModel.findOne({ name: correctOldClassName });
  const newClassDoc = await ClassModel.findOne({ name: wronglyPromotedToName });

  if (!oldClassDoc) {
    console.error(`❌ Could not find a Class document named "${correctOldClassName}"`);
    process.exit(1);
  }
  if (!newClassDoc) {
    console.error(`❌ Could not find a Class document named "${wronglyPromotedToName}"`);
    process.exit(1);
  }

  console.log(`\n🔧 Planned fix:`);
  console.log(`   currentClass  →  ${oldClassDoc.name}  (${oldClassDoc._id})`);
  console.log(`   pendingClass  →  ${newClassDoc.name}  (${newClassDoc._id})`);

  if (!APPLY) {
    console.log(`\n🧪 DRY RUN — no changes made. Re-run with --apply to actually update the database.`);
    process.exit(0);
  }

  // ── 4. Apply the fix ──────────────────────────────────────────────────
  await StudentModel.findByIdAndUpdate(student._id, {
    currentClass: oldClassDoc._id,
    pendingClass: newClassDoc._id,
  });

  console.log(`\n✅ Applied. ${studentInfo.surname} ${studentInfo.firstName} is now:`);
  console.log(`   currentClass: ${oldClassDoc.name} (stays here for the rest of this session)`);
  console.log(`   pendingClass: ${newClassDoc.name} (will move here when the next session is activated)`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});