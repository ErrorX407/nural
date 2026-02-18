import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";

export async function cleanCommand() {
    const cwd = process.cwd();
    const spinner = ora("Cleaning project...").start();

    const paths = [
        "dist",
        "coverage",
        ".turbo",
        ".nural-routes.ts",
        ".nural-routes-data.json",
        ".nural-console.ts",
        ".nural-gen-docs.ts"
    ];

    let deletedCount = 0;

    for (const p of paths) {
        const fullPath = path.join(cwd, p);
        if (fs.existsSync(fullPath)) {
            await fs.remove(fullPath);
            deletedCount++;
        }
    }

    spinner.succeed(chalk.green(`Cleaned ${deletedCount} files/directories.`));
}