import mongoose, { Document, Schema } from "mongoose";

export interface PostDocumentInterface extends Document {
	Body: string;
	CommentCount: number;
	LikeCount: number;
	GiftCount: number;
	hashtags: string[];
	moment: boolean;
	PostHashHex: string;
	PublicKeyBase58Check: string;
	UserPublicKeyBase58Check?: string;
	screenshot?: string;
	Username: string;
	VideoURL: string;
}

const PostSchema: Schema = new Schema(
	{
		// @note: not the best idea, for MVP purpose only
		Body: { type: String, index: "text" }, // Add text index to the "Body" field
		CommentCount: Number,
		LikeCount: Number,
		GiftCount: Number,
		hashtags: [String],
		moment: Boolean,
		PostHashHex: { type: String, required: true },
		PublicKeyBase58Check: String,
		UserPublicKeyBase58Check: String,
		screenshot: String,
		Username: String,
		VideoURL: String,
	},
	{
		timestamps: true,
		collection: "posts",
	}
);

export default mongoose.model<PostDocumentInterface>("Post", PostSchema);
