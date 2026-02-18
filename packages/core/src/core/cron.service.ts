import { CronJob } from "cron";
import { CronJobConfig } from "../types/cron";
import { Logger } from "./logger";

/**
 * Service to manage Cron Jobs in Nural ecosystem
 */
export class CronService {
  private jobs: Map<string, CronJob> = new Map();
  private logger: Logger;

  constructor() {
    this.logger = new Logger("CronService");
  }

  /**
   * Register a new Cron Job
   * @param config Configuration for the cron job
   */
  public addJob(config: CronJobConfig): void {
    if (this.jobs.has(config.name)) {
      this.logger.warn(`Cron job with name "${config.name}" already exists. Skipping.`);
      return;
    }

    try {
      const job = new CronJob(
        config.schedule,
        async () => {
          this.logger.info(`Executing job: ${config.name}`, { 
              schedule: config.schedule,
              jobName: config.name 
          });
          
          const start = Date.now();
          try {
            await config.task();
            const duration = Date.now() - start;
            this.logger.info(`Job completed: ${config.name} +${duration}ms`);
          } catch (error) {
            const duration = Date.now() - start;
            this.logger.error(`Job failed: ${config.name} +${duration}ms`, { error });
          }
        },
        null,
        false, // Don't start automatically, wait for explicit start or use runOnInit logic if we want immediate execution separate from start
        config.timeZone
      );

      this.jobs.set(config.name, job);
      this.logger.info(`Registered job: ${config.name} (${config.schedule})`);

      if (config.runOnInit) {
        this.logger.info(`Running job on init: ${config.name}`);
        // Execute immediately
        config.task(); 
      }
      
      // Start the job
      job.start();

    } catch (error) {
      this.logger.error(`Failed to create cron job "${config.name}":`, error);
    }
  }

  /**
   * Stop a specific job by name
   */
  public stopJob(name: string): void {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.logger.info(`Stopped job: ${name}`);
    } else {
      this.logger.warn(`Job not found: ${name}`);
    }
  }

  /**
   * Start a specific job by name (if stopped)
   */
  public startJob(name: string): void {
    const job = this.jobs.get(name);
    if (job) {
      job.start();
      this.logger.info(`Started job: ${name}`);
    } else {
      this.logger.warn(`Job not found: ${name}`);
    }
  }

  /**
   * Stop all registered jobs
   */
  public stopAll(): void {
    this.jobs.forEach((job, name) => {
      job.stop();
    });
    this.logger.info(`Stopped all ${this.jobs.size} cron jobs`);
  }
}
