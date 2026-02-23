import { CliLogger, chalk } from "../ui";
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
        CliLogger.warn("No .env file found. Copying .env.example...");
        try {
            await fs.copy(path.join(cwd, ".env.example"), envPath);
            CliLogger.success("Created .env from example");
        } catch (e) {
            CliLogger.error("Failed to create .env");
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
    CliLogger.dim(`  v${require("../package.json").version}`);
    CliLogger.success("\n  🚀 Starting Nural Development Server...");

    const env: NodeJS.ProcessEnv = {
        ...process.env,
        NURAL_CLI: "true",
        FORCE_COLOR: "true", // Ensures child process keeps colors
    };

    if (options.watch) {
        CliLogger.warn("Polling mode enabled (for WSL/Docker compatibility)");
        env['CHOKIDAR_USEPOLLING'] = "true";
        env['CHOKIDAR_INTERVAL'] = "500"; // Check every 500ms
    }

    CliLogger.dim("  Watching for changes in src/...\n");

    try {
        // 2. Run tsx watch
        // stdio: 'inherit' lets the child process print directly to the console
        const child = execa("tsx", ["watch", "src/main.ts"], {
            cwd,
            stdio: "inherit",
            env: env,
            reject: false // Don't throw on exit code
        });

        // Forward signals to child manually to ensure they get them
        process.on('SIGINT', () => {
            child.kill('SIGINT');
        });

        process.on('SIGTERM', () => {
            child.kill('SIGTERM');
        });

        await child;

    } catch (error: any) {
        CliLogger.error(error);
    }
}