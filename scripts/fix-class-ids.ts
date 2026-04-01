import mongoose, { Types } from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("Connected to DB");

  const db = mongoose.connection.db!;

  const broken = await db.collection("users").find({
    role: "student",
    currentClass: { $type: "string" },
  }).toArray();

  console.log(`Found ${broken.length} students to fix...`);

  for (const s of broken) {
    await db.collection("users").updateOne(
      { _id: s._id },
      { $set: { currentClass: new Types.ObjectId(s.currentClass as string) } }
    );
    console.log(`Fixed: ${s.firstName} ${s.surname}`);
  }

  console.log("All done! You can delete this script.");
  await mongoose.disconnect();
}

fix().catch(console.error);

// import mongoose, { Types } from "mongoose";
// import StudentModel from "@/models/Student";
// import UserModel from "@/models/User";

// async function fix() {
//   await mongoose.connect(process.env.MONGODB_URI!);
//   console.log("Connected to DB");

//   const broken = await StudentModel.find({
//     currentClass: { $type: "string" },
//   }).lean();

//   console.log(`Found ${broken.length} students to fix...`);

//   for (const s of broken) {
//     const currentClassStr = s.currentClass as unknown as string;

//     // Get name from UserModel since surname/firstName live there
//     const user = await UserModel.findById(s._id).lean();

//     await StudentModel.updateOne(
//       { _id: s._id },
//       { $set: { currentClass: new Types.ObjectId(currentClassStr) } }
//     );

//     console.log(`Fixed: ${user?.firstName} ${user?.surname}`);
//   }

//   console.log("All done! You can delete this script.");
//   await mongoose.disconnect();
// }

// fix().catch(console.error);