/**
 * Configuration for a scheduled Cron Job
 */
export interface CronJobConfig {
  /**
   * Unique name for the cron job
   */
  name: string;

  /**
   * Cron schedule expression (e.g., "* * * * *")
   */
  schedule: string;

  /**
   * The task to execute (sync or async)
   */
  task: () => void | Promise<void>;

  /**
   * Whether to run the task immediately upon registration
   * @default false
   */
  runOnInit?: boolean;
  
  /**
   * Timezone for the schedule execution
   */
  timeZone?: string;
}
