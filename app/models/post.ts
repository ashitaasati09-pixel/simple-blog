import mongoose, { Schema, models, model } from "mongoose";

export interface IComment {
  _id?: mongoose.Types.ObjectId;
  author: string;
  text: string;
  createdAt: Date;
}

export interface IPost {
  title: string;
  content: string;
  author: string;
  likes: string[];
  comments: IComment[];
  ipAddress?: string;
  createdAt?: Date;
}

const CommentSchema = new Schema<IComment>({
  author: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const PostSchema = new Schema<IPost>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    likes: { type: [String], default: [] },
    comments: { type: [CommentSchema], default: [] },
    ipAddress: { type: String, default: "" },
  },
  { timestamps: true }
);

export default models.Post || model<IPost>("Post", PostSchema);