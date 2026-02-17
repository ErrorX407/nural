import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import os from "os";

export async function infoCommand() {
  const cwd = process.cwd();
  const pkgPath = path.join(cwd, "package.json");
  
  console.log(chalk.bold("\n  Nural CLI Information\n"));
  
  console.log(chalk.blue("  System:"));
  console.log(`    OS: ${os.type()} ${os.release()} ${os.arch()}`);
  console.log(`    Node: ${process.version}`);
  
  if (fs.existsSync(pkgPath)) {
    const pkg = await fs.readJson(pkgPath);
    console.log(chalk.blue("\n  Project:"));
    console.log(`    Name: ${pkg.name}`);
    console.log(`    Version: ${pkg.version}`);
    
    console.log(chalk.blue("\n  Dependencies:"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const coreDeps = ["nural", "fastify", "express", "zod", "typescript"];
    
    coreDeps.forEach(dep => {
        if (deps[dep]) {
            console.log(`    ${dep}: ${deps[dep]}`);
        }
    });
  } else {
    console.log(chalk.yellow("\n  (Not inside a Nural project)"));
  }
  console.log("");
}