import { BanType } from "../models/banned_user";
import BannedUser from "../models/banned_user"; // Import your BannedUser model

export class BannedUserService {
	// Method 1: Create a banned user entity
	static async create_banned_user(
		userId: string,
		bannedBy: string,
		banType: string,
		banEndsAt: Date,
		reason: string
	): Promise<any> {
		return BannedUser.create({ reason, userId, bannedBy, banType, banEndsAt });
	}

	// Method 2: Find all banned users for a certain user ID
	static async find_user_banned_history(userId: string): Promise<any> {
		return BannedUser.find({ userId });
	}

	// Method 3: Check if a user is currently banned
	static async is_user_banned(userId: string): Promise<boolean> {
		const userBanned = await BannedUser.findOne({ userId });

		if (!userBanned) {
			// User is not banned
			return false;
		}

		if (userBanned.banType === BanType.Permanent) {
			// User is permanently banned
			return true;
		}

		if (!userBanned.banEndsAt) {
			// Pitfall
			return false;
		}

		// Check if the temporary ban has expired
		return userBanned.banEndsAt.getTime() > Date.now();
	}

	// Method 4: Lift ban by updating banEndsAt
	static async lift_ban(userId: string): Promise<any> {
		return BannedUser.findOneAndUpdate(
			{ userId },
			{ $set: { banEndsAt: new Date() } },
			{ new: true }
		);
	}

	// Method 5: Get all currently banned users
	static async get_currently_banned_users(): Promise<string[]> {
		const currentTime = new Date();

		// Find users who are permanently banned or have a temporary ban that hasn't expired
		const currentlyBannedUsers = await BannedUser.find({
			$or: [
				{ banType: BanType.Permanent },
				{ banType: BanType.Temporary, banEndsAt: { $gt: currentTime } },
			],
		});

		// Extract userIds from the result and return as an array of strings
		const userIds = currentlyBannedUsers.map((user) => user.userId);

		return userIds;
	}

	static async delete_banned_record(userIdToDelete: string): Promise<any> {
		await BannedUser.deleteOne({ userId: userIdToDelete });
	}
}
