import { Router } from 'express';
import { createPosts, getPosts } from '../controllers/postController';
import { getTopHashtags } from '../controllers/hashController';
import { createUser, getUserById, updateUser } from '../controllers/userController';

const router: Router = Router();

router.get('/users/:userId', getUserById);
router.post('/user', createUser);
router.patch('/users/:userId', updateUser);

router.get('/posts', getPosts);
router.post('/posts', createPosts);
router.get('/hashtags', getTopHashtags);

export default router;
