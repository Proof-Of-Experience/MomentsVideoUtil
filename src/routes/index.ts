import { Router } from 'express';
import { createPosts, getPosts } from '../controllers/postController';
import { getHashtags } from '../controllers/hashController';
import { createUser, getUserById, getUserPreferece, updateUser, updateUserPreference } from '../controllers/userController';
import { getTiktokUrl } from '../controllers/socialLoginController';
const router: Router = Router();

router.get('/users/:userId', getUserById);
router.get('/users/:userId/preferences', getUserPreferece);
router.patch('/users/:userId/preferences', updateUserPreference);
router.post('/user', createUser);
router.patch('/users/:userId', updateUser);

router.get('/posts', getPosts);
router.post('/posts', createPosts);
router.get('/hashtags', getHashtags);

router.get('/x', getHashtags)
router.get('/oauth/tiktok/get-redirect-url', getTiktokUrl)

export default router;

