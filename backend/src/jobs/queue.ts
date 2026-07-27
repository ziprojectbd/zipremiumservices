import { Queue, Worker, type Job } from 'bullmq';
import env from '@config/env';
import logger from '@config/logger';

const connection = {
  host: (env.REDIS_URL ? new URL(env.REDIS_URL).hostname : 'localhost') || 'localhost',
  port: env.REDIS_URL ? parseInt(new URL(env.REDIS_URL).port || '6379', 10) : 6379,
};

// ---- Queue Definitions ----

export const emailQueue = new Queue('email', { connection });
export const smsQueue = new Queue('sms', { connection });
export const notificationQueue = new Queue('notification', { connection });
export const orderQueue = new Queue('order', { connection });
export const cleanupQueue = new Queue('cleanup', { connection });

// ---- Worker Definitions ----

const workers: Worker[] = [];

function createWorker<T>(queueName: string, processor: (job: Job<T>) => Promise<void>): Worker {
  const worker = new Worker<T>(
    queueName,
    async (job) => {
      logger.info(`Processing job ${job.id} from queue ${queueName}`, {
        queue: queueName,
        jobId: job.id,
        data: JSON.stringify(job.data).substring(0, 200),
      });
      try {
        await processor(job);
        logger.info(`Job ${job.id} completed successfully`, { queue: queueName, jobId: job.id });
      } catch (error) {
        logger.error(`Job ${job.id} failed`, {
          queue: queueName,
          jobId: job.id,
          error: error instanceof Error ? error.message : String(error),
          attemptsMade: job.attemptsMade,
        });
        throw error; // Let BullMQ handle retry
      }
    },
    {
      connection,
      concurrency: 5,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  );

  worker.on('failed', (job: Job<T> | undefined, err: Error) => {
    if (job) {
      logger.error(`Job ${job.id} failed permanently`, {
        queue: queueName,
        jobId: job.id,
        error: err.message,
        attemptsMade: job.attemptsMade,
      });
    }
  });

  worker.on('completed', (job: Job<T>) => {
    logger.info(`Job ${job.id} completed`, { queue: queueName, jobId: job.id });
  });

  workers.push(worker);
  return worker;
}

// ---- Job Processors ----

// Email worker
createWorker('email', async (job) => {
  const { to, subject, body } = job.data as Record<string, string>;
  logger.info(`Sending email to ${to}: ${subject}`);
  // Implement actual email sending here (e.g., nodemailer, SendGrid, etc.)
  // For now, just log
});

// Notification worker
createWorker('notification', async (job) => {
  const { type, recipient, message } = job.data as Record<string, string>;
  logger.info(`Sending ${type} notification to ${recipient}: ${message.substring(0, 100)}`);
  // Implement actual notification sending
});

// Cleanup worker
createWorker('cleanup', async (job) => {
  const { action } = job.data as Record<string, string>;
  logger.info(`Running cleanup task: ${action}`);
  // Implement cleanup logic
});

export function addJob<T>(
  queue: Queue,
  name: string,
  data: T,
  options?: { delay?: number; attempts?: number; backoff?: { type: 'exponential'; delay: number } },
): Promise<Job<T>> {
  return queue.add(name, data, {
    attempts: options?.attempts ?? 3,
    backoff: options?.backoff ?? { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
    ...options,
  });
}

export async function closeAllQueues(): Promise<void> {
  await Promise.all([
    emailQueue.close(),
    smsQueue.close(),
    notificationQueue.close(),
    orderQueue.close(),
    cleanupQueue.close(),
  ]);
}

export async function closeAllWorkers(): Promise<void> {
  await Promise.all(workers.map((w) => w.close()));
}

export { createWorker };
