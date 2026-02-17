import { execa } from "execa";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";

export async function startCommand(options: { debug?: boolean; watch?: boolean }) {
    const cwd = process.cwd();
    const distPath = path.join(cwd, "dist/main.js");

    // 1. Pre-flight Check
    if (!fs.existsSync(distPath)) {
        console.error(chalk.red("❌ dist/main.js not found."));
        console.log(chalk.yellow("  Run 'nural build' first."));
        process.exit(1);
    }

    console.log(chalk.green(`\n  🚀 Starting production server...`));

    const args = [];

    // 2. Handle Debug Mode
    if (options.debug) {
        console.log(chalk.yellow("  🐞 Debug mode enabled (--inspect)"));
        args.push("--inspect");
    }

    args.push("dist/main.js");

    // 3. Execution
    try {
        await execa("node", args, {
            cwd,
            stdio: "inherit",
            env: {
                ...process.env,
                NODE_ENV: "production"
            }
        });
    } catch (error: any) {
        if (error.signal !== 'SIGINT') {
            console.error(chalk.red("\n❌ Application crashed."));
            process.exit(1);
        }
    }
}