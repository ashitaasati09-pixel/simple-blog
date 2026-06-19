import { Schema, models, model } from "mongoose";

export interface IAdmin {
  username: string;
  email: string;
  password: string;
  createdBy?: string;
  ipAddress?: string;
  createdAt?: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdBy: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
  },
  { timestamps: true }
);

export default models.Admin || model<IAdmin>("Admin", AdminSchema);