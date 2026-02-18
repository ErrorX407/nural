import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { execa } from "execa";
import inquirer from "inquirer";

// Helper: Fetch latest version from npm registry
async function getLatestVersion(pkg: string): Promise<string | null> {
  try {
    const { stdout } = await execa("npm", ["view", pkg, "version"]);
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function updateCommand() {
  const cwd = process.cwd();
  const pkgPath = path.join(cwd, "package.json");

  if (!fs.existsSync(pkgPath)) {
    console.error(chalk.red("❌ package.json not found."));
    return;
  }

  const pkg = await fs.readJson(pkgPath);
  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
  
  // 1. Find Nural Packages
  const nuralPkgs = Object.keys(dependencies).filter(
    (d) => d === "nural" || d.startsWith("@nural/")
  );

  if (nuralPkgs.length === 0) {
    console.log(chalk.yellow("  No Nural dependencies found in this project."));
    return;
  }

  console.log(chalk.bold.blue(`\n  Checking for updates...`));
  const spinner = ora("Fetching latest versions...").start();
  
  const updates: { name: string; current: string; latest: string }[] = [];

  // 2. Check Versions
  for (const name of nuralPkgs) {
    const current = dependencies[name].replace(/^[\^~]/, ""); // remove ^ or ~
    const latest = await getLatestVersion(name);

    // Skip if we can't find version or if it's a local file: link
    if (!latest || current.startsWith("file:")) continue;

    if (latest !== current) {
      updates.push({ name, current, latest });
    }
  }

  spinner.stop();

  // 3. Report Results
  if (updates.length === 0) {
    console.log(chalk.green("  ✔ All Nural packages are up to date!"));
    return;
  }

  console.log(chalk.bold("\n  Updates available:"));
  updates.forEach((u) => {
    console.log(
      `  ${u.name}: ${chalk.red(u.current)} -> ${chalk.green(u.latest)}`
    );
  });
  console.log("");

  // 4. Ask to Update
  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: "Do you want to update these packages now?",
      default: true,
    },
  ]);

  if (!confirm) {
    console.log(chalk.dim("  Update cancelled."));
    return;
  }

  // 5. Run Update
  const pkgManager = fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))
    ? "pnpm"
    : fs.existsSync(path.join(cwd, "yarn.lock"))
    ? "yarn"
    : "npm";

  const installSpinner = ora("Updating packages...").start();
  
  try {
    const args = pkgManager === "npm" ? ["install"] : ["add"];
    // Add packages with @latest tag
    const pkgsToUpdate = updates.map((u) => `${u.name}@latest`);
    
    // Dev dependencies vs regular is tricky in one go, 
    // but most package managers handle moving them correctly if they exist.
    // For safety, we just run install/add which updates the lockfile and package.json
    await execa(pkgManager, [...args, ...pkgsToUpdate], { cwd });
    
    installSpinner.succeed(chalk.green("Packages updated successfully!"));
  } catch (error) {
    installSpinner.fail(chalk.red("Failed to update packages."));
  }
}