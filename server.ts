//Update this path based on different environment
require('dotenv').config({ path: './.env.dev' })


import express from 'express';
import multer from 'multer';
import path from 'path';
import { connectDB } from './config/db';
import postRoutes from './src/routes';
import { scheduleJobs } from './scheduler';

const upload = multer();

const app = express();
const PORT = process.env.PORT || 3011;

connectDB();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method == "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        return res.status(200).json({});
    }

    next();
});
console.log(path.join(__dirname, './', 'public', 'images'));

app.use('/images', express.static(path.join(__dirname, './', 'public', 'images')));
app.use(express.json());
app.use(upload.none());
app.use('/api', postRoutes);

scheduleJobs();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
