import { CliLogger } from "../../ui";
import { execa } from "execa";

export class DependenciesService {
    /**
     * Installs npm/pnpm packages in the target directory
     */
    static async install(projectPath: string, packageManager: string): Promise<void> {
        CliLogger.info(`\nInstalling dependencies with ${packageManager}...`);
        CliLogger.startSpinner("Installing dependencies...");

        try {
            const installArgs = ["install"];
            if (packageManager === "pnpm") {
                installArgs.push("--ignore-workspace");
            }
            await execa(packageManager, installArgs, { cwd: projectPath });
            CliLogger.succeedSpinner("Dependencies installed successfully!");
        } catch (error) {
            CliLogger.failSpinner("Failed to install dependencies.");
            console.error(error);
            throw error;
        }
    }

    /**
     * Runs the Prisma generation script
     */
    static async generatePrisma(projectPath: string, packageManager: string): Promise<void> {
        CliLogger.startSpinner("Generating Prisma Client...");
        try {
            await execa(packageManager, ["run", "db:generate"], { cwd: projectPath });
            CliLogger.succeedSpinner("Prisma Client generated!");
        } catch (error) {
            CliLogger.failSpinner("Failed to generate Prisma Client.");
            console.error(error);
            throw error;
        }
    }
}
