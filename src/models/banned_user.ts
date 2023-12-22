import mongoose, { Schema, Types, Document } from "mongoose";

// Enum for the type of ban
export enum BanType {
	Temporary = "temporary",
	Permanent = "permanent",
}

// Define the interface for the BannedUser document
export interface BannedUserDocumentInterface extends Document {
	reason: string;
	userId: string; // User public key check
	bannedBy: Types.ObjectId;
	banType?: BanType; // Enum: temporary or permanent
	banEndsAt?: Date; // Optional: Date and time when the ban ends
}

// Define the BannedUser schema
const BannedUserSchema: Schema = new Schema(
	{
		// Reason for blocking the user
		reason: { type: String, required: true },

		userId: { type: String, required: true },

		bannedBy: { type: Types.ObjectId, ref: "User", required: true },

		banType: { type: String, enum: Object.values(BanType) },

		banEndsAt: { type: Date },
	},
	{
		// Enable timestamps for createdAt and updatedAt fields
		timestamps: true,

		// Set the collection name in the database
		collection: "banned_users",
	}
);

// Create and export the BannedUser model
export default mongoose.model<BannedUserDocumentInterface>(
	"BannedUser",
	BannedUserSchema
);
