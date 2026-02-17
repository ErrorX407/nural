import { execa } from "execa";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import ora from "ora";

export async function buildCommand(options: { ignoreTsErrors?: boolean }) {
    const cwd = process.cwd();
    const pkgPath = path.join(cwd, "package.json");
    const tsupConfig = path.join(cwd, "tsup.config.ts");

    if (!fs.existsSync(pkgPath)) {
        console.error(chalk.red("❌ package.json not found. Are you in a Nural project?"));
        process.exit(1);
    }

    console.log(chalk.bold.blue("\n  📦 Building for production...\n"));

    // 1. Type Checking (Strict by Default)
    const typeSpinner = ora("Running type checks...").start();
    try {
        // We capture stdout to print it nicely on failure
        await execa("tsc", ["--noEmit"], { cwd });
        typeSpinner.succeed(chalk.green("Type checks passed."));
    } catch (error: any) {
        typeSpinner.fail(chalk.red("Type check failed."));

        // 🟢 Show the actual errors
        if (error.stdout) {
            console.log("\n" + chalk.red(error.stdout.trim()));
        }

        // 🟢 Strict Exit Logic
        if (!options.ignoreTsErrors) {
            console.error(chalk.bold.red("\n❌ Build aborted due to TypeScript errors."));
            console.log(chalk.dim("  To force a build, run: nural build --ignore-ts-errors"));
            process.exit(1);
        }

        console.log(chalk.yellow("\n⚠  Proceeding with build despite errors (--ignore-ts-errors active)\n"));
    }

    // 2. Build Process (TSUP)
    const buildSpinner = ora("Compiling assets...").start();
    try {
        const buildArgs = ["--env.NODE_ENV", "production"];

        if (!fs.existsSync(tsupConfig)) {
            buildArgs.push("src/main.ts", "--format", "cjs", "--clean", "--minify");
        }

        await execa("tsup", buildArgs, {
            cwd,
            stdio: "inherit",
            env: { ...process.env, NODE_ENV: "production" }
        });

        buildSpinner.succeed(chalk.green("Build complete!"));

        const distFile = path.join(cwd, "dist/main.js");
        if (fs.existsSync(distFile)) {
            const stats = fs.statSync(distFile);
            const size = (stats.size / 1024).toFixed(2);
            console.log(chalk.dim(`\n  Output: dist/main.js (${size} KB)`));
        }

    } catch (error) {
        buildSpinner.fail(chalk.red("Build failed."));
        process.exit(1);
    }
}