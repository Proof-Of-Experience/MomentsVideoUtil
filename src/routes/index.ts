import { Router } from "express";
import {
	createPosts,
	getPostSuggestions,
	getPosts,
} from "../controllers/postController";
import { getHashtags, migrateHashtags } from "../controllers/hashController";
import {
	createUser,
	getUserById,
	getUserPreferece,
	migrate_users,
	updateUser,
	updateUserPreference,
} from "../controllers/userController";
import { getTiktokUrl } from "../controllers/socialLoginController";
import {
	addToMultiple,
	createPlaylist,
	deletePlaylist,
	getAllPlaylistOfUser,
	removeFromMultiple,
	showPlaylist,
	updatePlaylist,
} from "../controllers/playlistController";
import {
	create_banned_user,
	find_user_banned_history,
	is_user_banned,
	lift_ban,
} from "../controllers/bannedUserController";
const router: Router = Router();

router.get("/users/:userId", getUserById);
router.get("/users/:userId/preferences", getUserPreferece);
router.patch("/users/:userId/preferences", updateUserPreference);
router.post("/user", createUser);
router.patch("/users/:userId", updateUser);

router.get("/posts", getPosts);
router.post("/posts", createPosts);
router.get("/hashtags", getHashtags);
router.post("/suggestions", getPostSuggestions);

router.post("/migrate-hashtags", migrateHashtags);
router.get("/oauth/tiktok/get-redirect-url", getTiktokUrl);

router.get("/playlists/users/:userId", getAllPlaylistOfUser);
router.post("/playlists", createPlaylist);
router.post("/playlists/add-multiple", addToMultiple);
router.post("/playlists/remove-multiple", removeFromMultiple);
router.get("/playlists/:playlistId", showPlaylist);
router.delete("/playlists/:playlistId", deletePlaylist);
router.patch("/playlists/:playlistId", updatePlaylist);

router.post("/ban-user", create_banned_user);
router.patch("/ban-user/lift-ban", lift_ban);
router.get("/ban-user/:userId/history", find_user_banned_history);
router.get("/ban-user/:userId/is-banned", is_user_banned);

// router.post("/dev/migrate-users", migrate_users);
export default router;
