
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Nural } from '../nural.application';

describe('Nural', () => {
  let app: Nural;

  beforeEach(() => {
    app = new Nural();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should delegate module registration to RoutesResolver', () => {
    const module = { routes: [] };
    const mockResolve = vi.fn().mockReturnValue([]);

    // Mock the nested pipelineManager.routesResolver used by registerModule
    const pipelineManager = (app as unknown as Record<string, Record<string, unknown>>)['pipelineManager']!;
    pipelineManager['routesResolver'] = { resolveModule: mockResolve };

    app.registerModule(module);
    expect(mockResolve).toHaveBeenCalledWith(module);
  });
});
