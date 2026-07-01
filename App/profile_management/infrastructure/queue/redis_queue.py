import os
import json
import logging
import redis

logger = logging.getLogger("redis-queue")

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

try:
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
except Exception as e:
    logger.error(f"Failed to initialize Redis client: {e}")
    redis_client = None

def enqueue_embedding_task(task_type: str, record_id: int):
    """
    Pushes a task to the Redis list 'embedding_queue'.
    task_type can be 'title', 'experience', or 'project'
    """
    if redis_client is None:
        logger.warning("Redis client is not initialized. Skipping enqueue.")
        return False
    
    task_payload = {
        "type": task_type,
        "id": record_id
    }
    
    try:
        redis_client.rpush("embedding_queue", json.dumps(task_payload))
        logger.info(f"Successfully enqueued task: {task_payload}")
        return True
    except Exception as e:
        logger.error(f"Failed to enqueue task to Redis: {e}")
        return False
