
import { describe, it, expect, vi } from 'vitest';
import { RoutesResolver } from '../routes-resolver';
import { GuardsConsumer } from '../../pipeline/guards-consumer';
import { InterceptorsConsumer } from '../../pipeline/interceptors-consumer';
import { ExceptionFiltersConsumer } from '../../exceptions/exception-filters-consumer';
import { ModuleConfig } from '../module.factory';

describe('RoutesResolver', () => {
    const guardsConsumer = new GuardsConsumer();
    const interceptorsConsumer = new InterceptorsConsumer();
    const filtersConsumer = new ExceptionFiltersConsumer();
    const resolver = new RoutesResolver(guardsConsumer, interceptorsConsumer, filtersConsumer);

    it('should resolve module routes', () => {
        const handler = vi.fn();
        const module: ModuleConfig = {
            prefix: '/api',
            routes: [
                { path: '/users', handler, method: 'GET' }
            ]
        };

        const resolved = resolver.resolveModule(module);
        expect(resolved).toHaveLength(1);
        expect(resolved[0]!.path).toBe('/api/users');
        expect(resolved[0]!.handler).toBeDefined();
        expect(resolved[0]!.handler).not.toBe(handler); // It should be wrapped
    });

    it('should execute pipeline in wrapped handler', async () => {
        vi.spyOn(guardsConsumer, 'tryActivate').mockResolvedValue(undefined);
        vi.spyOn(interceptorsConsumer, 'intercept').mockImplementation((i, r, c, next) => next());

        const handler = vi.fn().mockResolvedValue('ok');
        const module: ModuleConfig = {
            prefix: '/',
            routes: [
                { path: '/test', handler, method: 'GET' }
            ]
        };

        const resolved = resolver.resolveModule(module);
        const wrappedHandler = resolved[0]!.handler as Function;

        const ctx = { req: {}, res: {} };
        const result = await wrappedHandler(ctx);

        expect(guardsConsumer.tryActivate).toHaveBeenCalled();
        expect(interceptorsConsumer.intercept).toHaveBeenCalled();
        expect(result).toBe('ok');
    });
});
