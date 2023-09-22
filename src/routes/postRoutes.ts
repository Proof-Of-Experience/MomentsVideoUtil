import { Router } from 'express';
import { createPosts, getPosts } from '../controllers/postController';

const router: Router = Router();

router.get('/posts', getPosts);
router.post('/posts', createPosts);

export default router;
