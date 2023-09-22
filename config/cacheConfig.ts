import NodeCache from "node-cache";

const postCache = new NodeCache({ stdTTL: 600, checkperiod: 620 }); // Cache for 10 minutes (600 seconds)

export default postCache;
