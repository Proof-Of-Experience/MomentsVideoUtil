import { Request, Response } from "express";
import { BannedUserService } from "../service/banned_user";
import { HttpStatusCode } from "axios";
import { BanType } from "../models/banned_user";
import { get_users_where_ids_in } from "../service/user";
import { Role } from "../models/user";
import User from "../models/user";

// Controller method to create a banned user entity
export const create_banned_user = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const { reason, userId, bannedBy, banType, banEndsAt } = req.body;

		if (!reason) {
			res.status(HttpStatusCode.BadRequest).json({
				message: "reason is required",
			});
			return;
		}

		// Validate required fields
		if (!userId || !bannedBy) {
			res.status(HttpStatusCode.BadRequest).json({
				message: "userId and bannedBy are required fields",
			});
			return;
		}

		// Validate banType
		const validBanTypes = [BanType.Temporary, BanType.Permanent];

		if (!validBanTypes.includes(banType)) {
			res.status(HttpStatusCode.BadRequest).json({
				message: "invalid banType",
			});
			return;
		}

		if (userId === bannedBy) {
			res.status(HttpStatusCode.BadRequest).json({
				message: "can not ban yourself",
			});
			return;
		}

		const errorMessage = await are_users_invalid(userId, bannedBy);

		if (errorMessage) {
			res.status(HttpStatusCode.UnprocessableEntity).json({
				message: errorMessage,
			});
			return;
		}

		// Validate banEndsAt if banType is temporary and in the future
		if (
			banType === BanType.Temporary &&
			(!banEndsAt ||
				!is_valid_date(banEndsAt) ||
				!is_valid_date_in_future(banEndsAt))
		) {
			res.status(HttpStatusCode.BadRequest).json({
				message:
					"invalid or missing future date for banEndsAt for temporary banType",
			});
			return;
		}

		const result = await BannedUserService.create_banned_user(
			userId,
			bannedBy,
			banType,
			banEndsAt,
			reason
		);
		res.status(HttpStatusCode.Created).json(result);
	} catch (error) {
		console.log("error", error);
		res.status(HttpStatusCode.InternalServerError).json({
			message: "internal server error",
		});
	}
};

const are_users_invalid = async (
	user_id: string,
	admin_id: string
): Promise<string | null> => {
	const users = await get_users_where_ids_in([user_id, admin_id]);

	if (users.length !== 2) {
		return "user ids invalid";
	}

	const admins = users.filter((user: any) => user.roles?.includes(Role.Admin));

	if (admins.length === 0) {
		return "unauthorised";
	}

	if (admins[0]._id.toString() !== admin_id) {
		return "unauthorised";
	}

	return null;
};

// Controller method to find all banned users for a certain user ID
export const find_user_banned_history = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const { userId } = req.params;
		const result = await BannedUserService.find_user_banned_history(userId);
		res.status(HttpStatusCode.Ok).json(result);
	} catch (error) {
		res.status(HttpStatusCode.InternalServerError).json({
			message: "internal server error",
		});
	}
};

// Controller method to check if a user is currently banned
export const is_user_banned = async (req: Request, res: Response): Promise<void> => {
	try {
		const { userId } = req.params;
		const isBanned = await BannedUserService.is_user_banned(userId);
		res.status(HttpStatusCode.Ok).json({ is_banned: isBanned });
	} catch (error) {
		res.status(HttpStatusCode.InternalServerError).json({
			message: "internal server error",
		});
	}
};

// Controller method to lift ban by updating banEndsAt to current timestamp
export const lift_ban = async (req: Request, res: Response): Promise<void> => {
	try {
		const { userId, bannedBy } = req.body;
		const isBanned = await BannedUserService.is_user_banned(userId);

		if (!isBanned) {
			res.status(HttpStatusCode.BadRequest).json({
				message: "user is not banned",
			});
			return;
		}

		const errorMessage = await are_users_invalid(userId, bannedBy);
		if (errorMessage) {
			res.status(HttpStatusCode.UnprocessableEntity).json({
				message: errorMessage,
			});
			return;
		}

		await BannedUserService.lift_ban(userId);

		res.status(HttpStatusCode.Ok).json({
			message: "ban has been lifted",
		});
	} catch (error) {
		res.status(HttpStatusCode.InternalServerError).json({
			message: "internal server error",
		});
	}
};

const is_valid_date = (dateString: string): boolean => {
	const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
	return regex.test(dateString);
};

const is_valid_date_in_future = (dateString: string): boolean => {
	const currentDate = new Date();
	const selectedDate = new Date(dateString);
	return selectedDate > currentDate;
};
