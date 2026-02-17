import type { Nural } from 'nural';
import type { TestClient, NuralInternals } from './types';
import { createExpressClient } from './strategies/express-strategy';
import { createFastifyClient } from './strategies/fastify-strategy';
import type { FastifyInstance } from 'fastify';

/**
 * Creates a universal test client for Nural applications.
 * Works seamlessly with both Express and Fastify.
 * @param app - The initialized Nural application instance
 */
export function createTestClient(app: Nural): TestClient {
  // We access internal properties via strict interface casting
  const internals = app as unknown as NuralInternals;
  
  if (internals.isExpress) {
    // For Express, we need the raw server/app
    // Ensure app.server is initialized (even if not listening)
    const server = internals.adapter.server; 
    return createExpressClient(server);
  } else {
    return createFastifyClient(internals.adapter.app as FastifyInstance);
  }
}

export type { TestClient, TestResponse } from './types';