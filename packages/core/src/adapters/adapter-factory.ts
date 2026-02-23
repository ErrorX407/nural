
import { ExpressAdapter } from "./express.adapter";
import { FastifyAdapter } from "./fastify.adapter";
import { ServerAdapter } from "./server-adapter.interface";
import { ResolvedErrorHandlerConfig } from "../exceptions/error-handler.provider";

export class AdapterFactory {
  public static create(
    framework: "express" | "fastify" = "express",
    errorHandlerConfig?: ResolvedErrorHandlerConfig
  ): ServerAdapter {
    if (framework === "express") {
      return new ExpressAdapter(errorHandlerConfig);
    }
    return new FastifyAdapter(errorHandlerConfig);
  }
}
