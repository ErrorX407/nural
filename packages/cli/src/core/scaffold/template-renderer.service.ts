import fs from "fs-extra";
import path from "path";
import ejs from "ejs";
import { fileURLToPath } from "url";
import { ScaffoldData } from "./package-json.factory";

export class TemplateRendererService {
    private static __filename = fileURLToPath(import.meta.url);
    private static __dirname = path.dirname(this.__filename);

    /**
     * Resolves the template path dynamically based on whether it is running from src or dist
     */
    private static getTemplatePath(name: string): string {
        const distPath = path.join(this.__dirname, "../../templates", name);
        if (fs.existsSync(distPath)) {
            return distPath;
        }
        return path.join(this.__dirname, "../../../templates", name);
    }

    /**
     * Generates fundamental project directories
     */
    static async createDirectories(projectPath: string): Promise<void> {
        const dirs = [
            "src/common/exceptions",
            "src/common/middleware",
            "src/common/utils",
            "src/config",
            "src/modules/auth/models",
            "src/modules/auth/schemas",
            "src/modules/users",
            "src/providers",
            "test/e2e" // Proper E2E test folder
        ];
        for (const dir of dirs) {
            await fs.ensureDir(path.join(projectPath, dir));
        }
    }

    /**
     * Renders basic files like tsconfig, env, and Dockerfile
     */
    static async renderCoreFiles(projectPath: string, data: ScaffoldData): Promise<void> {
        // TSConfig
        const tsConfig = await ejs.renderFile(
            this.getTemplatePath("tsconfig.json.ejs"),
            data,
        );
        await fs.outputFile(path.join(projectPath, "tsconfig.json"), tsConfig);

        // .env
        const envFile = await ejs.renderFile(this.getTemplatePath("env.ejs"), data);
        await fs.outputFile(path.join(projectPath, ".env"), envFile);
        await fs.outputFile(path.join(projectPath, ".env.example"), envFile);

        const templates = [
            // Config & Main
            { src: "src/config/env.ts.ejs", dest: "src/config/env.ts" },
            { src: "src/app.ts.ejs", dest: "src/app.ts" },
            { src: "src/main.ts.ejs", dest: "src/main.ts" },

            // Auth Module - Models
            { src: "src/modules/auth/models/user.model.ts.ejs", dest: "src/modules/auth/models/user.model.ts" },

            // Auth Module - Schemas (Request/Response Split)
            { src: "src/modules/auth/schemas/auth.request.ts.ejs", dest: "src/modules/auth/schemas/auth.request.ts" },
            { src: "src/modules/auth/schemas/auth.response.ts.ejs", dest: "src/modules/auth/schemas/auth.response.ts" },

            // Auth Module - Core
            { src: "src/modules/auth/auth.service.ts.ejs", dest: "src/modules/auth/auth.service.ts" },
            { src: "src/modules/auth/auth.controller.ts.ejs", dest: "src/modules/auth/auth.controller.ts" },
            { src: "src/modules/auth/auth.module.ts.ejs", dest: "src/modules/auth/auth.module.ts" },

            // Docker
            { src: "docker-compose.yml.ejs", dest: "docker-compose.yml" },

            // Tests
            { src: "test/auth.e2e.ts.ejs", dest: "test/e2e/auth.e2e.ts" },

            // Build Config
            { src: "tsup.config.ts.ejs", dest: "tsup.config.ts" },
        ];

        for (const file of templates) {
            const content = await ejs.renderFile(this.getTemplatePath(file.src), data);
            await fs.outputFile(path.join(projectPath, file.dest), content);
        }
    }

    /**
     * Helper utility for external classes to render a single custom template
     */
    static async renderCustomTemplate(src: string, dest: string, data: ScaffoldData): Promise<void> {
        const content = await ejs.renderFile(this.getTemplatePath(src), data);
        await fs.outputFile(dest, content);
    }
}
