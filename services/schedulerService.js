import cron from 'node-cron';

class SchedulerService {
    constructor() {
        this.jobs = new Map();
        this.postCallback = null;
    }

    // Set the callback function that will be called when a post is scheduled
    setPostCallback(callback) {
        this.postCallback = callback;
    }

    // Convert WeeklySchedule to cron jobs
    updateSchedule(schedule) {
        // Clear all existing jobs
        this.clearAllJobs();

        // Create new jobs from schedule
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        days.forEach((dayName, dayIndex) => {
            const daySchedule = schedule[dayName];

            if (daySchedule.enabled && daySchedule.postTimes.length > 0) {
                daySchedule.postTimes.forEach((time, timeIndex) => {
                    const [hour, minute] = time.split(':');

                    // Cron format: minute hour day-of-month month day-of-week
                    // day-of-week: 0 = Sunday, 1 = Monday, etc.
                    const cronExpression = `${minute} ${hour} * * ${dayIndex}`;

                    const jobId = `${dayName}-${timeIndex}`;

                    try {
                        const task = cron.schedule(cronExpression, async () => {
                            console.log(`[Scheduler] Executing scheduled post: ${dayName} at ${time}`);
                            if (this.postCallback) {
                                await this.postCallback(daySchedule.isLongPost);
                            }
                        }, {
                            scheduled: true,
                            timezone: 'America/New_York' // Adjust timezone as needed
                        });

                        this.jobs.set(jobId, {
                            task,
                            day: dayName,
                            time,
                            isLongPost: daySchedule.isLongPost
                        });

                        console.log(`[Scheduler] Scheduled job: ${jobId} - ${cronExpression} (${daySchedule.isLongPost ? 'long' : 'short'} post)`);
                    } catch (error) {
                        console.error(`[Scheduler] Failed to schedule job ${jobId}:`, error);
                    }
                });
            }
        });

        console.log(`[Scheduler] Total jobs scheduled: ${this.jobs.size}`);
    }

    // Clear all scheduled jobs
    clearAllJobs() {
        this.jobs.forEach((job, id) => {
            job.task.stop();
            console.log(`[Scheduler] Stopped job: ${id}`);
        });
        this.jobs.clear();
    }

    // Get current schedule status
    getStatus() {
        const status = [];

        this.jobs.forEach((job, id) => {
            status.push({
                id,
                day: job.day,
                time: job.time,
                isLongPost: job.isLongPost
            });
        });

        return status;
    }

    // Stop the scheduler
    stop() {
        this.clearAllJobs();
        console.log('[Scheduler] Scheduler stopped');
    }
}

// Export singleton instance
export const schedulerService = new SchedulerService();
