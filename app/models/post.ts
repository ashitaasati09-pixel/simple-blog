import mongoose, { Schema, models, model, Document } from "mongoose";

/* ---------------- COMMENT TYPE ---------------- */
export interface IComment {
  _id?: mongoose.Types.ObjectId;
  author: string;
  text: string;
  createdAt: Date;
}

/* ---------------- POST TYPE ---------------- */
export interface IPost extends Document {
  title: string;
  content: string;
  author: string;
  likes: string[];
  comments: IComment[];
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ---------------- COMMENT SCHEMA ---------------- */
const CommentSchema = new Schema<IComment>({
  author: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

/* ---------------- POST SCHEMA ---------------- */
const PostSchema = new Schema<IPost>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    likes: { type: [String], default: [] },
    comments: { type: [CommentSchema], default: [] },
    ipAddress: { type: String, default: "" },
  },
  {
    timestamps: true, // auto adds createdAt & updatedAt
  }
);

/* ---------------- EXPORT MODEL ---------------- */
export const Post =
  models.Post || model<IPost>("Post", PostSchema);