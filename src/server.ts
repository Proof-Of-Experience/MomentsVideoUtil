import express from 'express';
import multer from 'multer';
import path from 'path';
import { connectDB } from '../config/db';
import videoRoutes from './routes/videoRoutes';
import cors from 'cors';

const upload = multer();

const app = express();
const PORT = process.env.PORT || 3011;

const corsOptions = {
    origin: function (origin: any, callback: any) {
        const allowedOrigins = ['http://localhost', 'http://moments.social'];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,  // This allows cookies or authentication headers to be exchanged across origins.
    optionsSuccessStatus: 200
};

connectDB();

app.use(cors(corsOptions));
app.use('/images', express.static(path.join(__dirname, '../', 'public', 'images')));
app.use(express.json());
app.use(upload.none());
app.use('/api', videoRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
