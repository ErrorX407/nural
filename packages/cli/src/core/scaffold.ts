import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { execa } from "execa";
import ejs from "ejs";
import { fileURLToPath } from "url";

// Helper to resolve template path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatePath = (name: string) => {
  // Check if running from dist (templates are siblings) or src (templates are up one level)
  const distPath = path.join(__dirname, "templates", name);
  if (fs.existsSync(distPath)) {
    return distPath;
  }
  return path.join(__dirname, "../templates", name);
};

export async function scaffold(name: string, options: any) {
  const projectPath = path.resolve(process.cwd(), name);
  const spinner = ora(
    `Creating project structure in ${chalk.bold(name)}...`,
  ).start();

  try {
    if (fs.existsSync(projectPath)) {
      spinner.fail(`Directory ${chalk.bold(name)} already exists.`);
      process.exit(1);
    }

    // 1. Create Directory
    await fs.ensureDir(projectPath);

    // 2. Prepare Template Data
    const data = {
      name,
      framework: options.framework.includes("Fastify") ? "fastify" : "express",
      packageManager: options.packageManager,
      integrations: options.integrations || [],
    };

    // 3. Render Templates
    // For now, we'll manually list files. A improved version would walk the templates dir.

    // 3. Render Templates

    // Package.json (Programmatic for better formatting)
    const pkgJson: any = {
      name: name,
      version: "0.0.1",
      description: "Nural Project",
      scripts: {
        dev: "tsx watch src/main.ts",
        build: "tsup",
        start: "node dist/main.js",
      },
      dependencies: {
        nural: "^0.3.8",
        zod: "^3.22.4",
        dotenv: "^16.4.5",
      },
      devDependencies: {
        tsx: "^4.7.1",
        tsup: "^8.0.2",
        typescript: "^5.3.3",
        "@types/node": "^20.11.24",
      },
    };

    if (data.framework === "fastify") {
      pkgJson.dependencies.fastify = "^5.7.4";
    } else {
      pkgJson.dependencies.express = "^5.2.1";
      pkgJson.devDependencies["@types/express"] = "^5.0.0";
    }

    if (data.integrations.includes("redis")) {
      pkgJson.dependencies.ioredis = "^5.3.2";
    }
    if (data.integrations.includes("ws")) {
      pkgJson.dependencies["socket.io"] = "^4.7.4";
    }
    if (data.integrations.includes("rabbitmq")) {
      pkgJson.dependencies.amqplib = "^0.10.3";
      pkgJson.devDependencies["@types/amqplib"] = "^0.10.1";
    }
    if (data.integrations.includes("prisma-pg")) {
      pkgJson.dependencies["@prisma/client"] = "^7.3.0";
      pkgJson.dependencies["@prisma/adapter-pg"] = "^7.3.0";
      pkgJson.dependencies["pg"] = "^8.11.3";
      pkgJson.devDependencies.prisma = "^7.3.0";
      pkgJson.devDependencies["@types/pg"] = "^8.11.0";
      pkgJson.scripts["db:generate"] = "prisma generate";
      pkgJson.scripts["db:migrate"] = "prisma migrate dev";
    }
    if (data.integrations.includes("mongoose")) {
      pkgJson.dependencies.mongoose = "^8.2.0";
    }

    await fs.writeJson(path.join(projectPath, "package.json"), pkgJson, {
      spaces: 2,
    });

    // TSConfig
    const tsConfig = await ejs.renderFile(
      templatePath("tsconfig.json.ejs"),
      data,
    );
    await fs.outputFile(path.join(projectPath, "tsconfig.json"), tsConfig);

    // .env
    const envFile = await ejs.renderFile(templatePath("env.ejs"), data);
    await fs.outputFile(path.join(projectPath, ".env"), envFile);
    await fs.outputFile(path.join(projectPath, ".env.example"), envFile);

    // Source Files Structure
    const dirs = [
      "src/common/exceptions",
      "src/common/middleware",
      "src/common/utils",
      "src/config",
      "src/modules",
      "src/providers",
    ];
    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectPath, dir));
    }

    // src/config/env.ts
    const envTs = await ejs.renderFile(
      templatePath("src/config/env.ts.ejs"),
      data,
    );
    await fs.outputFile(path.join(projectPath, "src/config/env.ts"), envTs);

    // src/app.ts
    const appTs = await ejs.renderFile(templatePath("src/app.ts.ejs"), data);
    await fs.outputFile(path.join(projectPath, "src/app.ts"), appTs);

    // src/main.ts
    const mainTs = await ejs.renderFile(templatePath("src/main.ts.ejs"), data);
    await fs.outputFile(path.join(projectPath, "src/main.ts"), mainTs);

    // Handle Integrations (Providers)
    if (data.integrations.includes("redis")) {
      const redisProvider = await ejs.renderFile(
        templatePath("src/providers/redis.ts.ejs"),
        data,
      );
      await fs.outputFile(
        path.join(projectPath, "src/providers/redis.ts"),
        redisProvider,
      );
    }
    if (data.integrations.includes("rabbitmq")) {
      const rmqProvider = await ejs.renderFile(
        templatePath("src/providers/rabbitmq.ts.ejs"),
        data,
      );
      await fs.outputFile(
        path.join(projectPath, "src/providers/rabbitmq.ts"),
        rmqProvider,
      );
    }
    if (data.integrations.includes("mongoose")) {
      const mongooseProvider = await ejs.renderFile(
        templatePath("src/providers/mongoose.ts.ejs"),
        data,
      );
      await fs.outputFile(
        path.join(projectPath, "src/providers/mongoose.ts"),
        mongooseProvider,
      );
    }
    if (data.integrations.includes("prisma-pg")) {
      const prismaProvider = await ejs.renderFile(
        templatePath("src/providers/prisma.ts.ejs"),
        data,
      );
      await fs.outputFile(
        path.join(projectPath, "src/providers/prisma.ts"),
        prismaProvider,
      );

      // Also create schema.prisma
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

    spinner.succeed(`Project ${chalk.bold(name)} created!`);

    // 4. Install Dependencies
    console.log(
      chalk.blue(`\nInstalling dependencies with ${options.packageManager}...`),
    );
    const installSpinner = ora("Installing dependencies...").start();

    try {
      const installArgs = ["install"];
      if (options.packageManager === "pnpm") {
        installArgs.push("--ignore-workspace");
      }
      await execa(options.packageManager, installArgs, { cwd: projectPath });
      installSpinner.succeed(
        chalk.green("Dependencies installed successfully!"),
      );
    } catch (error) {
      installSpinner.fail(chalk.red("Failed to install dependencies."));
      console.error(error);
    }

    if (data.integrations.includes("prisma-pg")) {
      const prismaSpinner = ora("Generating Prisma Client...").start();
      try {
        const manager = options.packageManager;
        let cmd = manager;
        let args = ["run", "db:generate"];

        if (manager === "npm") {
          // npm run is default
        } else if (manager === "yarn") {
          // yarn run is default
        }

        // Universal 'run' command works for npm, pnpm, yarn, bun
        await execa(manager, ["run", "db:generate"], { cwd: projectPath });
        prismaSpinner.succeed(chalk.green("Prisma Client generated!"));
      } catch (error) {
        prismaSpinner.fail(chalk.red("Failed to generate Prisma Client."));
        console.error(error);
      }
    }

    console.log(chalk.green(`\n✔ Ready to go!`));
    console.log(chalk.cyan(`  cd ${name}`));
    console.log(chalk.cyan(`  ${options.packageManager} run dev`));
  } catch (error) {
    spinner.fail("Failed to scaffold project.");
    console.error(error);
    process.exit(1);
  }
}
