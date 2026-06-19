import { Schema, models, model } from "mongoose";

export interface IUser {
  username: string;
  email: string;
  password: string;
  bio?: string;
  location?: string;
  avatarColor?: string;
  ipAddress?: string;
  isBanned?: boolean;
  createdAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    avatarColor: { type: String, default: "#f97316" },
    ipAddress: { type: String, default: "" },
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default models.User || model<IUser>("User", UserSchema);