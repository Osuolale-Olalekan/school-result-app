/**
 * /scripts/cleanup-orphaned-records.ts
 *
 * Run this once to clean up all orphaned records left behind
 * by students that were deleted without cascade.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/cleanup-orphaned-records.ts
 *
 * Or add to package.json scripts:
 *   "cleanup": "ts-node -r tsconfig-paths/register scripts/cleanup-orphaned-records.ts"
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in .env.local");
  process.exit(1);
}

async function cleanup() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI!);
  console.log("✅ Connected\n");

  const db = mongoose.connection.db!;

  // ── Step 1: Get all valid student IDs ──────────────────────────────────────
  console.log("📋 Fetching valid student IDs...");
  const validStudents = await db
    .collection("users")
    .find({ activeRole: "student" })
    .project({ _id: 1 })
    .toArray();

  const validIds = validStudents.map((s) => s._id);
  console.log(`   Found ${validIds.length} active student(s)\n`);

  // ── Step 2: Delete orphaned report cards ──────────────────────────────────
  const reports = await db
    .collection("reportcards")
    .deleteMany({ student: { $nin: validIds } });
  console.log(`🗑️  Report cards deleted:     ${reports.deletedCount}`);

  // ── Step 3: Delete orphaned payment records ───────────────────────────────
  const payments = await db
    .collection("paymentrecords")
    .deleteMany({ student: { $nin: validIds } });
  console.log(`🗑️  Payment records deleted:   ${payments.deletedCount}`);

  // ── Step 4: Delete orphaned behaviour records ─────────────────────────────
  const behaviours = await db
    .collection("behaviourrecords")
    .deleteMany({ student: { $nin: validIds } });
  console.log(`🗑️  Behaviour records deleted: ${behaviours.deletedCount}`);

  // ── Step 5: Delete orphaned notifications ────────────────────────────────
  const notifications = await db
    .collection("notifications")
    .deleteMany({ recipient: { $nin: validIds } });
  console.log(`🗑️  Notifications deleted:     ${notifications.deletedCount}`);

  // ── Step 6: Clean up parent children arrays ───────────────────────────────
  const parents = await db
    .collection("users")
    .updateMany(
      { children: { $exists: true, $ne: [] } },
      { $pull: { children: { $nin: validIds } } } as object,
    );
  console.log(`🧹 Parent children cleaned:   ${parents.modifiedCount} parent(s) updated`);

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log("\n✅ Cleanup complete!");
  await mongoose.disconnect();
  process.exit(0);
}

cleanup().catch((err) => {
  console.error("❌ Cleanup failed:", err);
  mongoose.disconnect();
  process.exit(1);
});