import mongoose, { Document, Schema, Types } from "mongoose";
import { HashtagDocumentInterface } from "./hashtags";

interface IAccount {
	isSynced?: boolean;
	name?: string;
}

export enum Role {
	Admin = "admin",
	User = "user",
}

const AccountSchema: Schema = new Schema({
	isSynced: { type: Boolean, default: true },
	name: { type: String },
});

export interface IUser extends Document {
	userId: string;
	accounts: IAccount[];
	youtubeAccessToken: string | null;
	preferences: HashtagDocumentInterface[];
	roles: Role[];
}

// Definition of UpdatePayload
export interface UpdatePayload {
	accounts?: IAccount[];
	youtubeAccessToken?: string | null;
	$push?: { accounts: { $each: IAccount[] } };
	[key: string]: any;
}

export interface UpdateUserPreferencePayload {
	preferences: (string | Types.ObjectId)[];
}

const UserSchema: Schema = new Schema(
	{
		userId: { type: String, required: true },
		accounts: [AccountSchema],
		youtubeAccessToken: { type: String || null },
		preferences: [{ type: Schema.Types.ObjectId, ref: "Hashtag" }],
		roles: { type: [String], enum: Object.values(Role), default: [Role.User] },
	},
	{
		timestamps: true,
		collection: "users",
	}
);

export default mongoose.model<IUser>("User", UserSchema);
