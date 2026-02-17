import { execa } from "execa";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import ora from "ora";

export async function docsCommand(options: { output?: string }) {
    const cwd = process.cwd();
    const outputPath = options.output || "openapi.json";
    const absOutputPath = path.resolve(cwd, outputPath);

    const spinner = ora("Generating OpenAPI specification...").start();

    // 1. Create a temporary script
    const scriptContent = `
    import { app } from "./src/app";
    import fs from "fs";

    async function generate() {
      try {
        const spec = app.getOpenApiSpec();
        const dest = ${JSON.stringify(absOutputPath)}; // Safely inject path
        
        fs.writeFileSync(dest, JSON.stringify(spec, null, 2));
        console.log("Spec written successfully");
        process.exit(0);
      } catch (error) {
        console.error(error);
        process.exit(1);
      }
    }
    
    generate();
  `;

    const scriptPath = path.join(cwd, ".nural-gen-docs.ts");

    try {
        // 2. Write the temporary script
        await fs.writeFile(scriptPath, scriptContent);

        // 3. Execute with tsx
        await execa("tsx", [scriptPath], {
            cwd,
            env: { ...process.env, NODE_ENV: "development" }
        });

        spinner.succeed(chalk.green(`Spec generated at ${chalk.bold(outputPath)}`));

    } catch (error: any) {
        spinner.fail(chalk.red("Failed to generate documentation."));
        if (error.stderr) console.error(chalk.dim(error.stderr));
        if (error.stdout) console.log(chalk.dim(error.stdout));
    } finally {
        // 4. Cleanup
        if (fs.existsSync(scriptPath)) {
            await fs.unlink(scriptPath);
        }
    }
}