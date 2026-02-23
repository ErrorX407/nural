import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CronService } from "../cron.service";
import { CronJobConfig } from "../cron.types";

describe("CronService", () => {
  let cronService: CronService;

  beforeEach(() => {
    vi.useFakeTimers();
    cronService = new CronService();
  });

  afterEach(() => {
    cronService.stopAll();
    vi.useRealTimers();
  });

  it("should register and start a cron job", () => {
    const task = vi.fn();
    const config: CronJobConfig = {
      name: "TestJob",
      schedule: "* * * * * *", // Every second
      task,
    };

    cronService.addJob(config);

    // Check if task is not called immediately
    expect(task).not.toHaveBeenCalled();

    // Advance time by 1.1s
    vi.advanceTimersByTime(1100);

    // Should be called once
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("should executing immediately if runOnInit is true", () => {
    const task = vi.fn();
    const config: CronJobConfig = {
      name: "InitJob",
      schedule: "* * * * * *",
      task,
      runOnInit: true
    };

    cronService.addJob(config);

    expect(task).toHaveBeenCalledTimes(1);
  });

  it("should stop a specific job", () => {
    const task = vi.fn();
    const config: CronJobConfig = {
      name: "StopJob",
      schedule: "* * * * * *",
      task,
    };

    cronService.addJob(config);
    cronService.stopJob("StopJob");

    vi.advanceTimersByTime(2000);
    expect(task).not.toHaveBeenCalled();
  });

  // Since we rely on 'cron' package, we assume it works correctly.
  // We mainly test our wrapper logic.
});
