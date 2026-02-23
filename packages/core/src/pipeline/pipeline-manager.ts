
import { GuardsConsumer } from "./guards-consumer";
import { InterceptorsConsumer } from "./interceptors-consumer";
import { ExceptionFiltersConsumer } from "../exceptions/exception-filters-consumer";
import { RoutesResolver } from "../router/routes-resolver";
import { MiddlewareContainer } from "./middleware-container";
import { ServerAdapter } from "../adapters/server-adapter.interface";
import { ResolvedCorsConfig, ResolvedHelmetConfig } from "./middleware/middleware-config";

export class PipelineManager {
  public readonly guardsConsumer: GuardsConsumer;
  public readonly interceptorsConsumer: InterceptorsConsumer;
  public readonly exceptionFiltersConsumer: ExceptionFiltersConsumer;
  public readonly routesResolver: RoutesResolver;
  public readonly middlewareContainer: MiddlewareContainer;

  constructor() {
    this.guardsConsumer = new GuardsConsumer();
    this.interceptorsConsumer = new InterceptorsConsumer();
    this.exceptionFiltersConsumer = new ExceptionFiltersConsumer();
    this.routesResolver = new RoutesResolver(
      this.guardsConsumer,
      this.interceptorsConsumer,
      this.exceptionFiltersConsumer
    );
    this.middlewareContainer = new MiddlewareContainer();
  }

  public applyBuiltInMiddleware(
    adapter: ServerAdapter,
    isExpress: boolean,
    corsConfig: ResolvedCorsConfig | null,
    helmetConfig: ResolvedHelmetConfig | null
  ) {
    this.middlewareContainer.applyBuiltIn(adapter, isExpress, corsConfig, helmetConfig);
  }
}
