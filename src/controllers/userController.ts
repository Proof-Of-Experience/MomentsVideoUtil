import { Request, Response } from "express";
import User, {
	IUser,
	Role,
	UpdatePayload,
	UpdateUserPreferencePayload,
} from "../models/user";
import { HttpStatusCode } from "axios";
import { Types } from "mongoose";
import { GetUserPreferences } from "../service/user";

// API endpoint to create user
export const createUser = async (req: Request, res: Response): Promise<void> => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "POST");

	if (req.method !== "POST") {
		res.status(405).json({ error: "Method Not Allowed" });
		return;
	}

	try {
		const userId = req.body.userId;
		const existingUser = await User.findOne({ userId });

		// Check if userId is provided
		if (!userId) {
			res.status(400).json({ error: "User ID is not provided" });
			return;
		}

		if (existingUser) {
			res.status(400).json({
				error: "User with the provided ID already exists",
			});
			return;
		}
		const newUser: IUser = new User({
			accounts: [
				{
					name: "youtube",
					isSynced: false,
				},
			],
			youtubeAccessToken: null,
			userId,
			roles: [Role.User],
			preferences: [],
		});
		await newUser.save();
		res.status(201).json({
			message: "User created successfully",
			user: newUser,
		});
	} catch (error: any) {
		if (error.response) {
			console.error("error.response.data", error.response.data);
			console.error("error.response.status", error.response.status);
			console.error("error.response.headers", error.response.headers);
		} else if (error.request) {
			console.error("error.request", error.request);
		} else {
			console.error("error.message", error.message);
		}
		res.status(500).json({ error: "Failed to create user" });
	}
};

// API endpoint to fetch user by userId
export const getUserById = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.params.userId; // Assuming you pass userId as a route parameter

		const user = await GetUserPreferences(userId);

		if (!user) {
			res.status(HttpStatusCode.NotFound).json({ error: "User not found" });
			return;
		}

		res.status(HttpStatusCode.Ok).json(user);
	} catch (error: any) {
		res.status(HttpStatusCode.InternalServerError).json({
			error: "Failed to fetch user",
		});
	}
};

// API endpoint to patch user data
export const updateUser = async (req: Request, res: Response): Promise<void> => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "PATCH");

	try {
		const { userId } = req.params;
		const { youtubeAccessToken, accounts } = req.body;

		if (!userId) {
			res.status(400).json({ error: "User ID is not provided" });
			return;
		}

		const existingUser = await User.findOne({ userId });
		if (!existingUser) {
			res.status(404).json({ error: "User not found" });
			return;
		}

		const updateData: UpdatePayload = {};
		const updateAccountFilters = [];

		if (accounts && Array.isArray(accounts)) {
			const accountNamesSet = new Set();

			for (let account of accounts) {
				if (
					typeof account !== "object" ||
					Array.isArray(account) ||
					account === null
				) {
					res.status(400).json({
						error: "Each item in accounts should be an object",
					});
					return;
				}

				// Check for required fields and their types
				if (!account.name || typeof account.name !== "string") {
					res.status(400).json({
						error: "Account name should be a string and is required",
					});
					return;
				}

				// Check for unique account name
				if (accountNamesSet.has(account.name)) {
					res.status(400).json({
						error: `Account name "${account.name}" should be unique`,
					});
					return;
				}
				accountNamesSet.add(account.name);

				if (
					account.isSynced !== undefined &&
					typeof account.isSynced !== "boolean"
				) {
					res.status(400).json({
						error: "Account isSynced should be a boolean",
					});
					return;
				}

				if (!["youtube", "vimeo"].includes(account.name)) {
					res.status(400).json({
						error: `Account name "${account.name}" is not allowed. Only "youtube" and "vimeo" are accepted.`,
					});
					return;
				}

				if (
					existingUser &&
					existingUser.accounts.some((e) => e.name === account.name)
				) {
					// Construct the update object to update isSynced status for the specific account
					updateData[`accounts.$[accountElem].isSynced`] =
						account.isSynced;
					updateAccountFilters.push({ "accountElem.name": account.name });
				} else {
					if (!updateData.$push) {
						updateData.$push = {
							accounts: { $each: [account] },
						};
					} else if (!updateData.$push.accounts) {
						updateData.$push.accounts = { $each: [account] };
					} else {
						updateData.$push.accounts.$each.push(account);
					}
				}
			}
		}

		if (typeof youtubeAccessToken !== "undefined") {
			updateData.youtubeAccessToken = youtubeAccessToken;
		}

		const updateOptions = {
			new: true,
			arrayFilters: updateAccountFilters,
		};

		const updatedUser = await User.findOneAndUpdate(
			{ userId },
			{ $set: updateData },
			updateOptions
		);

		res.status(200).json(updatedUser);
	} catch (error: any) {
		console.error("Error updating user:", error.message);
		res.status(500).json({ error: "Failed to update user" });
	}
};

// API endpoint to patch user data
export const getUserPreferece = async (
	req: Request,
	res: Response
): Promise<void> => {
	// @todo need to be fixed
	// get auth user id
	const userId = req.params.userId;

	try {
		if (!userId) {
			res.status(HttpStatusCode.BadRequest).json({
				error: "User ID is not provided",
			});
			return;
		}

		const user = await GetUserPreferences(userId);

		if (!user) {
			res.status(HttpStatusCode.NotFound).json({
				error: "User not found with given id",
			});
			return;
		}

		res.status(HttpStatusCode.Ok).json(user.preferences);
	} catch (error: any) {
		res.status(HttpStatusCode.InternalServerError).json({
			error: "Failed to update user",
		});
	}
};

export const updateUserPreference = async (
	req: Request,
	res: Response
): Promise<void> => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "PATCH");

	try {
		const { userId } = req.params;

		if (!userId) {
			res.status(HttpStatusCode.BadRequest).json({
				error: "User ID is not provided",
			});
			return;
		}

		const existingUser = await User.findOne({ userId });

		if (!existingUser) {
			res.status(HttpStatusCode.NotFound).json({ error: "User not found" });
			return;
		}

		const updateData: UpdateUserPreferencePayload = req.body;

		// Ensure preferences property exists in the updateData object
		if (!updateData || !updateData.preferences) {
			res.status(HttpStatusCode.BadRequest).json({
				error: "Preferences data is missing in the request body",
			});
			return;
		}

		const validPreferences = updateData.preferences.filter((preference) =>
			Types.ObjectId.isValid(preference)
		);

		// Use $set to update only the specified fields
		const updateOptions = {
			new: true,
		};

		const updatedUser = await User.findOneAndUpdate(
			{ userId },
			{ $set: { preferences: validPreferences } },
			updateOptions
		).populate("preferences", { _id: 1, name: 1 });

		res.status(HttpStatusCode.Ok).json(updatedUser);
	} catch (error: any) {
		res.status(HttpStatusCode.InternalServerError).json({
			error: "Failed to update user preferences",
		});
	}
};

export const migrate_users = async (req: Request, res: Response): Promise<void> => {
	await User.updateMany({}, { $set: { roles: [Role.User] } });

	res.send({ message: "done" });
};
