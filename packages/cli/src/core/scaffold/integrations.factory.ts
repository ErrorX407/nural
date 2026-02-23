import fs from "fs-extra";
import path from "path";
import { ScaffoldData } from "./package-json.factory";
import { TemplateRendererService } from "./template-renderer.service";

export class IntegrationsFactory {
    /**
     * Generates logic files specific to the chosen integrations (Redis, Prisma, Mongoose, etc.)
     */
    static async applyIntegrations(projectPath: string, data: ScaffoldData): Promise<void> {
        if (data.integrations.includes("redis")) {
            await TemplateRendererService.renderCustomTemplate(
                "src/providers/redis.ts.ejs",
                path.join(projectPath, "src/providers/redis.ts"),
                data
            );
        }

        if (data.integrations.includes("rabbitmq")) {
            await TemplateRendererService.renderCustomTemplate(
                "src/providers/rabbitmq.ts.ejs",
                path.join(projectPath, "src/providers/rabbitmq.ts"),
                data
            );
        }

        if (data.integrations.includes("mongoose")) {
            await TemplateRendererService.renderCustomTemplate(
                "src/providers/mongoose.ts.ejs",
                path.join(projectPath, "src/providers/mongoose.ts"),
                data
            );
        }

        if (data.integrations.includes("prisma-pg")) {
            // Setup Provider
            await TemplateRendererService.renderCustomTemplate(
                "src/providers/prisma.ts.ejs",
                path.join(projectPath, "src/providers/prisma.ts"),
                data
            );

            // Create schema.prisma map
            await fs.ensureDir(path.join(projectPath, "prisma"));
            const prismaSchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
`;
            await fs.outputFile(
                path.join(projectPath, "prisma/schema.prisma"),
                prismaSchema,
            );

            // Create prisma.config.ts for v7
            const prismaConfig = `import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL,
  },
});
`;
            await fs.outputFile(
                path.join(projectPath, "prisma.config.ts"),
                prismaConfig,
            );
        }
    }
}
