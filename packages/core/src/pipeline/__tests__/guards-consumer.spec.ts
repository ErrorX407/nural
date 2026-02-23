
import { describe, it, expect, vi } from 'vitest';
import { GuardsConsumer } from '../guards-consumer';
import { ExecutionContextHost } from '../execution-context-host';

describe('GuardsConsumer', () => {
  const consumer = new GuardsConsumer();
  const context = new ExecutionContextHost([]);

  it('should pass if no guards', async () => {
    await expect(consumer.tryActivate([], {}, context)).resolves.toBeUndefined();
  });

  it('should pass if guard returns true', async () => {
    const guard = vi.fn().mockReturnValue(true);
    await expect(consumer.tryActivate([guard], {}, context)).resolves.toBeUndefined();
    expect(guard).toHaveBeenCalled();
  });

  it('should throw if guard returns false', async () => {
    const guard = vi.fn().mockReturnValue(false);
    await expect(consumer.tryActivate([guard], {}, context)).rejects.toThrow('Forbidden');
  });

  it('should throw if guard throws', async () => {
    const error = new Error('Custom Error');
    const guard = vi.fn().mockRejectedValue(error);
    await expect(consumer.tryActivate([guard], {}, context)).rejects.toThrow(error);
  });
});
