import mongoose, { Schema } from "mongoose";

export interface HashtagDocumentInterface extends Document {
  _id: Schema.Types.ObjectId;
  name: string;
  postCount: number;
}

const HashtagSchema: Schema = new Schema(
  {
    name: String,
    postCount: Number,
  },
  {
    timestamps: true,
    collection: "hashtags",
  }
);

export default mongoose.model<HashtagDocumentInterface>(
  "Hashtag",
  HashtagSchema
);
