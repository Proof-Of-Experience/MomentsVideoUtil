import cron from "node-cron";
import { createPosts } from './src/controllers/postController';

const dummyReq = {};
const dummyRes = {
    setHeader: () => {},
    json: () => {},
    status: () => dummyRes,  // Mock chaining methods
    // ... add any other methods you might be using in `createPosts`
};

export const scheduleJobs = () => {
    console.log(`Cron Job started at ${new Date().toISOString()}`);
    cron.schedule("*/10 * * * *", () => {
        createPosts(dummyReq as any, dummyRes as any);
    });
};
