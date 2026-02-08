/**
 * Full-Featured API Server
 *
 * Production-grade REST API demonstrating all Nural features:
 * - Authentication & Authorization
 * - CRUD Operations
 * - Input Validation (Zod)
 * - Custom Error Handling
 * - CORS & Helmet Security
 * - Auto-generated Documentation
 *
 * Run: npx tsx examples/full-api/src/server.ts
 *
 * Structure:
 * ├── config/        - App configuration
 * ├── middleware/    - Auth & other middleware
 * ├── routes/        - API route definitions
 * ├── schemas/       - Zod validation schemas
 * ├── services/      - Business logic
 * └── server.ts      - Entry point
 */

import { Nural } from "../../../src";
import { appConfig } from "./config";
import { authRoutes, userRoutes, healthRoutes } from "./routes";

// Create application
const app = new Nural(appConfig);

// Register routes
app.register([...healthRoutes, ...authRoutes, ...userRoutes]);

// Start server
const PORT = Number(process.env.PORT) || 3000;
app.start(PORT);

// Custom logger usage
import { Logger } from "../../../src";
const logger = new Logger("Example");

logger.log(`Server started at http://localhost:${PORT}`);
logger.log(`Docs available at http://localhost:${PORT}/docs`);
