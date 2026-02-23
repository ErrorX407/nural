
import { ServerAdapter } from "../adapters/server-adapter.interface";
import { ResolvedCorsConfig, ResolvedHelmetConfig } from "./middleware/middleware-config";
import { applyCorsExpress, applyCorsFastify } from "./middleware/cors.middleware";
import { applyHelmetExpress, applyHelmetFastify } from "./middleware/helmet.middleware";

export class MiddlewareContainer {
  public applyBuiltIn(
    adapter: ServerAdapter,
    isExpress: boolean,
    corsConfig: ResolvedCorsConfig | null,
    helmetConfig: ResolvedHelmetConfig | null
  ) {
    const app = adapter.app;
    if (isExpress) {
      if (helmetConfig) applyHelmetExpress(app, helmetConfig);
      if (corsConfig) applyCorsExpress(app, corsConfig);
    } else {
      if (helmetConfig) applyHelmetFastify(app, helmetConfig);
      if (corsConfig) applyCorsFastify(app, corsConfig);
    }
  }
}
