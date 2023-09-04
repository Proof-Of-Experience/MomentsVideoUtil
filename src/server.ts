import express from 'express';
import multer from 'multer';
import path from 'path';
import { connectDB } from '../config/db';
import videoRoutes from './routes/videoRoutes';
import cors from 'cors';

const upload = multer();

const app = express();
const PORT = process.env.PORT || 3011;

connectDB();

app.use(cors());
app.use('/images', express.static(path.join(__dirname, '../', 'public', 'images')));
app.use(express.json());
app.use(upload.none());
app.use('/api', videoRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
