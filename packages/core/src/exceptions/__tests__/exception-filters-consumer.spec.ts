
import { describe, it, expect, vi } from 'vitest';
import { ExceptionFiltersConsumer } from '../exception-filters-consumer';
import { ExecutionContextHost } from '../../pipeline/execution-context-host';

describe('ExceptionFiltersConsumer', () => {
  const consumer = new ExceptionFiltersConsumer();
  const context = new ExecutionContextHost([]);

  it('should return false if no filters', async () => {
    await expect(consumer.apply([], new Error(), {}, {}, context)).resolves.toBe(false);
  });

  it('should return true if filter handles response (headersSent)', async () => {
    const res = { headersSent: true };
    const filter = vi.fn().mockImplementation((err, req, r) => {
      // simulate handling
    });

    const result = await consumer.apply([filter], new Error(), {}, res, context);
    expect(result).toBe(true);
    expect(filter).toHaveBeenCalled();
  });

  it('should return false if filter does not handle response', async () => {
    const res = { headersSent: false };
    const filter = vi.fn();

    const result = await consumer.apply([filter], new Error(), {}, res, context);
    expect(result).toBe(false);
  });
});
