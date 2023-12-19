import mongoose, { Schema, Document } from "mongoose";

// Enum for the type of ban
export enum BanType {
	Temporary = "temporary",
	Permanent = "permanent",
}

// Define the interface for the BannedUser document
export interface BannedUserDocumentInterface extends Document {
	reason: string;
	userId: Schema.Types.ObjectId;
	bannedBy: Schema.Types.ObjectId;
	banType?: BanType; // Enum: temporary or permanent
	banEndsAt?: Date; // Optional: Date and time when the ban ends
}

// Define the BannedUser schema
const BannedUserSchema: Schema = new Schema(
	{
		// Reason for blocking the user
		reason: { type: String, required: true },

		// ID of the blocked user, referencing the 'User' model
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

		// ID of the user who initiated the ban, referencing the 'User' model
		bannedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

		// Type of ban (enum: 'temporary' or 'permanent')
		banType: { type: String, enum: Object.values(BanType) },

		// Optional: Date and time when the ban ends
		banEndsAt: { type: Date },
	},
	{
		// Enable timestamps for createdAt and updatedAt fields
		timestamps: true,

		// Set the collection name in the database
		collection: "BannedUsers",
	}
);

// Create and export the BannedUser model
export default mongoose.model<BannedUserDocumentInterface>(
	"BannedUser",
	BannedUserSchema
);
