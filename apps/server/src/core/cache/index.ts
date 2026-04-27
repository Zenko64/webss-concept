import { RedisClient } from "bun";
import config from "../config";

const redis = new RedisClient(config.redisUrl);
redis.onclose = (error: Error) => {
  if (error) {
    console.error("Redis connection closed with error:", error);
  } else {
    console.warn("Redis connection closed.");
  }
};

export default redis;
