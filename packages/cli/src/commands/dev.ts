import chalk from "chalk";
import { execa } from "execa";
import fs from "fs-extra";
import { createRequire } from "module";
import path from "path";

const require = createRequire(import.meta.url);

export async function devCommand(options: { watch?: boolean }) {
    const cwd = process.cwd();

    // 1. Pre-flight Checks
    const envPath = path.join(cwd, ".env");
    if (!fs.existsSync(envPath)) {
        console.warn(chalk.yellow("⚠ No .env file found. Copying .env.example..."));
        try {
            await fs.copy(path.join(cwd, ".env.example"), envPath);
            console.log(chalk.green("✔ Created .env from example"));
        } catch (e) {
            console.error(chalk.red("❌ Failed to create .env"));
        }
    }

    console.clear();
    console.log(chalk.bold.hex("#6366f1")(`
 ███╗   ██╗██╗   ██╗██████╗  █████╗ ██╗             ██╗███████╗
 ████╗  ██║██║   ██║██╔══██╗██╔══██╗██║             ██║██╔════╝
 ██╔██╗ ██║██║   ██║██████╔╝███████║██║             ██║███████╗
 ██║╚██╗██║██║   ██║██╔══██╗██╔══██║██║        ██   ██║╚════██║
 ██║ ╚████║╚██████╔╝██║  ██║██║  ██║███████╗   ╚█████╔╝███████║                                 
   `));
    console.log(chalk.dim(`  v${require("../package.json").version}`));
    console.log(chalk.green.bold("\n  🚀 Starting Nural Development Server..."));

    const env: NodeJS.ProcessEnv = {
        ...process.env,
        NURAL_CLI: "true",
        FORCE_COLOR: "true", // Ensures child process keeps colors
    };

    if (options.watch) {
        console.log(chalk.yellow("  ⚠  Polling mode enabled (for WSL/Docker compatibility)"));
        env.CHOKIDAR_USEPOLLING = "true";
        env.CHOKIDAR_INTERVAL = "500"; // Check every 500ms
    }

    console.log(chalk.dim("  Watching for changes in src/...\n"));

    try {
        // 2. Run tsx watch
        // stdio: 'inherit' lets the child process print directly to the console
        await execa("tsx", ["watch", "src/main.ts"], {
            cwd,
            stdio: "inherit",
            env: env
        });

    } catch (error: any) {
        // Check if it was a user interrupt (Ctrl+C)
        if (error.signal !== 'SIGINT') {
            console.error(chalk.red("\n❌ Server crashed."));
        } else {
            console.log(chalk.yellow("\n👋 Goodbye!"));
        }
    }
}