import fs from "fs-extra";
import path from "path";
import { CliLogger, chalk } from "../../ui";
import { ScaffoldData, PackageJsonFactory } from "./package-json.factory";
import { TemplateRendererService } from "./template-renderer.service";
import { IntegrationsFactory } from "./integrations.factory";
import { DependenciesService } from "./dependencies.service";

export async function scaffold(name: string, options: any) {
  const projectPath = path.resolve(process.cwd(), name);
  CliLogger.startSpinner(`Creating project structure in ${chalk.bold(name)}...`);

  try {
    if (fs.existsSync(projectPath)) {
      CliLogger.failSpinner(`Directory ${chalk.bold(name)} already exists.`);
      process.exit(1);
    }

    // 1. Prepare Data
    const data: ScaffoldData = {
      name,
      framework: options.framework.includes("Fastify") ? "fastify" : "express",
      packageManager: options.packageManager,
      integrations: options.integrations || [],
    };

    // 2. Base Directories & Files
    await TemplateRendererService.createDirectories(projectPath);

    // Generate package.json
    const pkgJson = PackageJsonFactory.create(data);
    await fs.writeJson(path.join(projectPath, "package.json"), pkgJson, { spaces: 2 });

    // Render Core EJS Templates (tsconfig, main.ts, auth module, env)
    await TemplateRendererService.renderCoreFiles(projectPath, data);

    // 3. Process Integrations (Redis, RabbitMQ, Prisma, Mongoose)
    await IntegrationsFactory.applyIntegrations(projectPath, data);

    CliLogger.succeedSpinner(`Project ${chalk.bold(name)} created!`);

    // 4. Install Dependencies
    await DependenciesService.install(projectPath, data.packageManager);

    // 5. Post-Install Hooks
    if (data.integrations.includes("prisma-pg")) {
      await DependenciesService.generatePrisma(projectPath, data.packageManager);
    }

    // 6. Final Outputs
    CliLogger.success(`\nReady to go!`);
    CliLogger.info(`  cd ${name}`);
    CliLogger.info(`  ${data.packageManager} run dev`);

  } catch (error) {
    CliLogger.failSpinner("Failed to scaffold project.");
    console.error(error);
    process.exit(1);
  }
}
