import { Router } from 'express';
import { createPosts, getPosts } from '../controllers/postController';
import { getTopHashtags } from '../controllers/hashController';
import { createUser, getUserById, getUserPreferece, updateUser, updateUserPreference } from '../controllers/userController';
const router: Router = Router();

router.get('/users/:userId', getUserById);
router.get('/users/:userId/preferences', getUserPreferece);
router.patch('/users/:userId/preferences', updateUserPreference);
router.post('/user', createUser);
router.patch('/users/:userId', updateUser);

router.get('/posts', getPosts);
router.post('/posts', createPosts);
router.get('/hashtags', getTopHashtags);

export default router;
