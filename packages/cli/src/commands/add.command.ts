import { execa } from "execa";
import fs from "fs-extra";
import path from "path";
import ejs from "ejs";
import { fileURLToPath } from "url";
import { CliLogger, CliPrompts, chalk } from "../ui";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Reuse templates from the 'new' command
const templatePath = (name: string) => {
  const distPath = path.join(__dirname, "templates", name);
  if (fs.existsSync(distPath)) return distPath;
  return path.join(__dirname, "../src/templates", name);
};

export async function addCommand(integration: string) {
  const supportedIntegrations = ["redis", "rabbitmq", "mongoose", "prisma-pg"];

  // 1. Validate Input
  if (!integration) {
    integration = await CliPrompts.select(
      "Which integration would you like to add?",
      supportedIntegrations
    );
  }

  if (!supportedIntegrations.includes(integration)) {
    CliLogger.error(`Integration '${integration}' is not supported.`);
    CliLogger.info(`Available: ${supportedIntegrations.join(", ")}`);
    process.exit(1);
  }

  const cwd = process.cwd();
  const pkgPath = path.join(cwd, "package.json");

  if (!fs.existsSync(pkgPath)) {
    CliLogger.error("package.json not found. Are you in a Nural project?");
    process.exit(1);
  }

  // 2. Define Integration Configs
  const config: Record<string, any> = {
    redis: {
      deps: ["ioredis"],
      devDeps: [],
      providerTpl: "src/providers/redis.ts.ejs",
      providerDest: "src/providers/redis.ts",
      envVars: 'REDIS_URL: z.string().default("redis://localhost:6379")',
      mainCall: "// No explicit connection needed for IORedis (lazy connect)"
    },
    rabbitmq: {
      deps: ["amqplib"],
      devDeps: ["@types/amqplib"],
      providerTpl: "src/providers/rabbitmq.ts.ejs",
      providerDest: "src/providers/rabbitmq.ts",
      envVars: 'RABBITMQ_URL: z.string().default("amqp://localhost")',
      mainCall: "await connectRabbitMQ();"
    },
    mongoose: {
      deps: ["mongoose"],
      devDeps: [],
      providerTpl: "src/providers/mongoose.ts.ejs",
      providerDest: "src/providers/mongoose.ts",
      envVars: 'MONGO_URL: z.string().default("mongodb://localhost:27017/mydb")',
      mainCall: "await connectMongoDB();"
    },
    "prisma-pg": {
      deps: ["@prisma/client", "@prisma/adapter-pg", "pg"],
      devDeps: ["prisma", "@types/pg"],
      providerTpl: "src/providers/prisma.ts.ejs",
      providerDest: "src/providers/prisma.ts",
      envVars: `DATABASE_URL: z.string(),\n  DIRECT_DATABASE_URL: z.string().optional()`,
      mainCall: "await connectPrisma();"
    }
  };

  const selected = config[integration];
  CliLogger.startSpinner(`Adding ${chalk.bold(integration)}...`);

  try {
    // 3. Install Dependencies
    CliLogger.updateSpinner("Installing dependencies...");
    const pkgManager = fs.existsSync(path.join(cwd, "pnpm-lock.yaml")) ? "pnpm" : "npm";

    if (selected.deps.length > 0) {
      await execa(pkgManager, ["install", ...selected.deps], { cwd });
    }
    if (selected.devDeps.length > 0) {
      await execa(pkgManager, ["install", "-D", ...selected.devDeps], { cwd });
    }

    // 4. Create Provider File
    CliLogger.updateSpinner("Generating provider...");
    const tplContent = await ejs.renderFile(templatePath(selected.providerTpl), {});
    await fs.outputFile(path.join(cwd, selected.providerDest), tplContent);

    // Special setup for Prisma
    if (integration === "prisma-pg") {
      CliLogger.updateSpinner("Initializing Prisma...");
      await fs.ensureDir(path.join(cwd, "prisma"));
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
      await fs.outputFile(path.join(cwd, "prisma/schema.prisma"), prismaSchema);

      // Add db scripts to package.json
      const pkg = await fs.readJson(pkgPath);
      pkg.scripts["db:generate"] = "prisma generate";
      pkg.scripts["db:migrate"] = "prisma migrate dev";
      await fs.writeJson(pkgPath, pkg, { spaces: 2 });
    }

    CliLogger.succeedSpinner(`Successfully added ${chalk.bold(integration)}!`);

    // 5. Post-Install Instructions
    console.log(chalk.yellow(`\n⚠ Action Required: Update your configuration`));

    console.log(chalk.bold(`\n1. Update src/config/env.ts:`));
    CliLogger.dim(`  const envSchema = z.object({`);
    console.log(chalk.green(`    ${selected.envVars},`));
    CliLogger.dim(`  });`);

    console.log(chalk.bold(`\n2. Update src/main.ts (bootstrap function):`));
    if (integration === "redis") {
      CliLogger.dim(`  (Redis connects automatically on first use, no change needed)`);
    } else {
      console.log(chalk.green(`  ${selected.mainCall}`));
    }

    if (integration === "prisma-pg") {
      console.log(chalk.bold(`\n3. Generate Prisma Client:`));
      console.log(chalk.cyan(`  ${pkgManager} run db:generate`));
    }

  } catch (error) {
    CliLogger.failSpinner("Failed to add integration.");
    console.error(error);
  }
}