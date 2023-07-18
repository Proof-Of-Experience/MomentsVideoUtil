import { Router } from 'express';
import { createVideo, getVideoInfo, getAllVideos, deleteVideoInfo } from '../controllers/videoController';

const router: Router = Router();

router.get('/video-info/:url', getVideoInfo);
router.get('/video-list', getAllVideos);
router.post('/video-info', createVideo);
router.delete('/video-info/:id', deleteVideoInfo);

export default router;
