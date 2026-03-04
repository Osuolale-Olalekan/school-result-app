import mongoose, { Schema, Document, Model } from "mongoose";
import UserModel from "./User";

export interface IParentDocument extends Document {
  // children: mongoose.Types.ObjectId[];
  occupation?: string;
  relationship?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ParentSchema = new Schema<IParentDocument>(
  {
    // children: [{ type: Schema.Types.ObjectId, ref: "Student" }],
    occupation: { type: String },
    relationship: { type: String },
  },
  { timestamps: true }
);

ParentSchema.index({ children: 1 });

// const ParentModel: Model<IParentDocument> =
//   mongoose.models.Parent ??
//   UserModel.discriminator<IParentDocument>("parent", ParentSchema);

// export default ParentModel;


let ParentModel: Model<IParentDocument>;

try {
  ParentModel = mongoose.model<IParentDocument>("parent");
} catch {
  ParentModel = UserModel.discriminator<IParentDocument>("parent", ParentSchema);
}

export default ParentModel;