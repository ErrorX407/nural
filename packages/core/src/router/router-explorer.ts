
import { Logger } from "../common/logger.provider";

export class RouterExplorer {
    private logger = new Logger("RouterExplorer");

    public scan(module: unknown): void {
        this.logger.debug("Scanning module for route hooks...");
        // Future: Scan for @BeforeRoute, @AfterRoute decorators
    }
}
