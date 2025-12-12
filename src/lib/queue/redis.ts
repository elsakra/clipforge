import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Job types
export type JobType = 'transcribe' | 'analyze' | 'generate-clips' | 'generate-content' | 'publish';

export interface Job {
  id: string;
  type: JobType;
  data: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
  createdAt: number;
  updatedAt: number;
  attempts: number;
  maxAttempts: number;
}

const QUEUE_KEY = 'clipforge:jobs';
const JOB_PREFIX = 'clipforge:job:';

/**
 * Add a job to the queue
 */
export async function addJob(type: JobType, data: Record<string, unknown>): Promise<Job> {
  const job: Job = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    data,
    status: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    attempts: 0,
    maxAttempts: 3,
  };

  // Store job data
  await redis.set(`${JOB_PREFIX}${job.id}`, JSON.stringify(job));
  
  // Add to queue
  await redis.lpush(QUEUE_KEY, job.id);

  return job;
}

/**
 * Get the next job from the queue
 */
export async function getNextJob(): Promise<Job | null> {
  const jobId = await redis.rpop(QUEUE_KEY);
  if (!jobId) return null;

  const jobData = await redis.get(`${JOB_PREFIX}${jobId}`);
  if (!jobData) return null;

  return typeof jobData === 'string' ? JSON.parse(jobData) : jobData as Job;
}

/**
 * Update job status
 */
export async function updateJob(jobId: string, updates: Partial<Job>): Promise<void> {
  const jobData = await redis.get(`${JOB_PREFIX}${jobId}`);
  if (!jobData) return;

  const job = typeof jobData === 'string' ? JSON.parse(jobData) : jobData as Job;
  const updatedJob = {
    ...job,
    ...updates,
    updatedAt: Date.now(),
  };

  await redis.set(`${JOB_PREFIX}${jobId}`, JSON.stringify(updatedJob));
}

/**
 * Get job by ID
 */
export async function getJob(jobId: string): Promise<Job | null> {
  const jobData = await redis.get(`${JOB_PREFIX}${jobId}`);
  if (!jobData) return null;
  return typeof jobData === 'string' ? JSON.parse(jobData) : jobData as Job;
}

/**
 * Retry a failed job
 */
export async function retryJob(jobId: string): Promise<boolean> {
  const job = await getJob(jobId);
  if (!job || job.attempts >= job.maxAttempts) return false;

  await updateJob(jobId, {
    status: 'pending',
    error: undefined,
    attempts: job.attempts + 1,
  });

  await redis.lpush(QUEUE_KEY, jobId);
  return true;
}

/**
 * Clean up old completed/failed jobs
 */
export async function cleanupOldJobs(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
  const keys = await redis.keys(`${JOB_PREFIX}*`);
  let cleaned = 0;

  for (const key of keys) {
    const jobData = await redis.get(key);
    if (!jobData) continue;

    const job = typeof jobData === 'string' ? JSON.parse(jobData) : jobData as Job;
    if (
      (job.status === 'completed' || job.status === 'failed') &&
      Date.now() - job.updatedAt > maxAge
    ) {
      await redis.del(key);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}> {
  const queueLength = await redis.llen(QUEUE_KEY);
  const keys = await redis.keys(`${JOB_PREFIX}*`);
  
  let processing = 0;
  let completed = 0;
  let failed = 0;

  for (const key of keys) {
    const jobData = await redis.get(key);
    if (!jobData) continue;

    const job = typeof jobData === 'string' ? JSON.parse(jobData) : jobData as Job;
    if (job.status === 'processing') processing++;
    else if (job.status === 'completed') completed++;
    else if (job.status === 'failed') failed++;
  }

  return {
    pending: queueLength,
    processing,
    completed,
    failed,
  };
}


