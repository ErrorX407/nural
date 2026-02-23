
import { describe, it, expect, vi } from 'vitest';
import { InterceptorsConsumer } from '../interceptors-consumer';
import { ExecutionContextHost } from '../execution-context-host';

describe('InterceptorsConsumer', () => {
  const consumer = new InterceptorsConsumer();
  const context = new ExecutionContextHost([]);

  it('should call next if no interceptors', async () => {
    const next = vi.fn().mockResolvedValue('result');
    const result = await consumer.intercept([], {}, context, next);
    expect(result).toBe('result');
    expect(next).toHaveBeenCalled();
  });

  it('should execute interceptor', async () => {
    const interceptor = vi.fn().mockImplementation((req, next, ctx) => next());
    const next = vi.fn().mockResolvedValue('result');
    
    const result = await consumer.intercept([interceptor], {}, context, next);
    expect(result).toBe('result');
    expect(interceptor).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should support transforming response', async () => {
    const interceptor = vi.fn().mockImplementation(async (req, next, ctx) => {
      const data = await next();
      return { data };
    });
    const next = vi.fn().mockResolvedValue('test');
    
    const result = await consumer.intercept([interceptor], {}, context, next);
    expect(result).toEqual({ data: 'test' });
  });
});
