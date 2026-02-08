import { Command } from "commander";
import select from "@inquirer/select";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";

const program = new Command();

program.name("nural").description("Nural Framework CLI").version("0.3.7");

program
  .command("new <project-name>")
  .description("Create a new Nural project")
  .action(async (projectName) => {
    const projectPath = path.join(process.cwd(), projectName);

    if (fs.existsSync(projectPath)) {
      console.error(
        chalk.red(`Error: Directory ${projectName} already exists.`),
      );
      process.exit(1);
    }

    const framework = await select({
      message: "Select a framework:",
      choices: [
        {
          name: "express",
          value: "express",
          description: "Fast, unopinionated, minimalist web framework",
        },
        {
          name: "fastify",
          value: "fastify",
          description: "Fast and low overhead web framework",
        },
      ],
      default: "express",
    });

    console.log(
      chalk.blue(`\nInitializing new Nural project in ${projectName}...`),
    );

    // Create directories
    fs.ensureDirSync(path.join(projectPath, "src/config"));
    fs.ensureDirSync(path.join(projectPath, "src/routes"));
    fs.ensureDirSync(path.join(projectPath, "src/middleware"));
    fs.ensureDirSync(path.join(projectPath, "src/services"));

    // Create package.json
    const packageJson = {
      name: projectName,
      version: "1.0.0",
      main: "dist/index.js",
      scripts: {
        dev: "nodemon --exec tsx src/index.ts",
        build: "tsup src/index.ts --format cjs,esm --dts",
        start: "node dist/index.js",
      },
      dependencies: {
        nural: "^0.3.7",
        [framework]: framework === "express" ? "^5.0.0" : "^5.0.0", // Using explicit versions for peer deps
        zod: "^3.22.4",
      },
      devDependencies: {
        tsx: "^4.7.1",
        tsup: "^8.0.2",
        typescript: "^5.3.3",
        nodemon: "^3.1.11",
        "@types/node": "^20.11.24",
        ...(framework === "express" ? { "@types/express": "^5.0.0" } : {}),
      },
    };

    fs.writeJsonSync(path.join(projectPath, "package.json"), packageJson, {
      spaces: 2,
    });

    // Create tsconfig.json
    const tsconfig = {
      compilerOptions: {
        target: "ES2020",
        module: "CommonJS",
        moduleResolution: "node",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        outDir: "./dist",
      },
      include: ["src/**/*"],
      exclude: ["node_modules"],
    };

    fs.writeJsonSync(path.join(projectPath, "tsconfig.json"), tsconfig, {
      spaces: 2,
    });

    // Create src/index.ts
    const indexContent = `import { Nural } from "nural";
import { appConfig } from "./config/app.config";

const app = new Nural(appConfig);

app.start(3000)
`;
    fs.writeFileSync(path.join(projectPath, "src/index.ts"), indexContent);

    // Create src/config/app.config.ts
    const configContent = `import { NuralConfig } from "nural";

export const appConfig: NuralConfig = {
  framework: "${framework}",
  docs: true,
  logger: {
    enabled: true,
  },
};
`;
    fs.writeFileSync(
      path.join(projectPath, "src/config/app.config.ts"),
      configContent,
    );

    console.log(
      chalk.green(`\n✔ Project ${projectName} created successfully!`),
    );
    console.log(chalk.white(`\nNext steps:`));
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan(`  npm install`));
    console.log(chalk.cyan(`  npm run dev`));
  });

program
  .command("generate <type> <name>")
  .alias("g")
  .description("Generate a resource (route, middleware, service)")
  .action((typeArg, nameArg) => {
    const type = typeArg.toLowerCase();
    const name = nameArg.toLowerCase();
    const srcDir = path.join(process.cwd(), "src");

    if (!fs.existsSync(srcDir)) {
      console.error(
        chalk.red(
          "Error: src directory not found. Are you in a Nural project root?",
        ),
      );
      process.exit(1);
    }

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    switch (type) {
      case "route": {
        const routeContent = `import { createRoute, z } from "nural";

export const ${name}Route = createRoute({
  method: "GET",
  path: "/${name}",
  summary: "${capitalize(name)} route",
  responses: {
    200: z.object({ message: z.string() }),
  },
  handler: async () => {
    return { message: "Hello from ${name}" };
  },

  export const ${name}Routes = [${name}Route]
});
`;
        const routesDir = path.join(srcDir, "routes");
        fs.ensureDirSync(routesDir);
        fs.writeFileSync(
          path.join(routesDir, `${name}.routes.ts`),
          routeContent,
        );
        console.log(chalk.green(`Created src/routes/${name}.routes.ts`));
        break;
      }
      case "middleware": {
        const middlewareContent = `import { defineMiddleware } from "nural";

export const ${name}Middleware = defineMiddleware(async (req, res) => {
  // TODO: Implement middleware logic
  return { ${name}: true };
});
`;
        const middlewareDir = path.join(srcDir, "middleware");
        fs.ensureDirSync(middlewareDir);
        fs.writeFileSync(
          path.join(middlewareDir, `${name}.middleware.ts`),
          middlewareContent,
        );
        console.log(
          chalk.green(`Created src/middleware/${name}.middleware.ts`),
        );
        break;
      }
      case "service": {
        const serviceContent = `export class ${capitalize(name)}Service {
  constructor() {}

  async findAll() {
    return [];
  }
}

export const ${name}Service = new ${capitalize(name)}Service();
`;
        const servicesDir = path.join(srcDir, "services");
        fs.ensureDirSync(servicesDir);
        fs.writeFileSync(
          path.join(servicesDir, `${name}.service.ts`),
          serviceContent,
        );
        console.log(chalk.green(`Created src/services/${name}.service.ts`));
        break;
      }
      default:
        console.error(
          chalk.red(
            `Unknown type: ${type}. Supported: route, middleware, service`,
          ),
        );
        process.exit(1);
    }
  });

program.parse(process.argv);
