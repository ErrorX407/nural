import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ejs from "ejs";
import inquirer from "inquirer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to find templates (Resource vs Granular)
const templatePath = (type: string, name: string) => {
  const folder = type === "resource" ? "resource" : "granular";
  
  // 1. Production path (dist/templates)
  const distPath = path.join(__dirname, "templates", folder, name);
  if (fs.existsSync(distPath)) return distPath;
  
  // 2. Dev path (src/templates)
  const localSrcPath = path.join(__dirname, "../src/templates", folder, name);
  if (fs.existsSync(localSrcPath)) return localSrcPath;

  return distPath; // Default to prod path for error messages
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const camelCase = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export async function generateCommand(schematic: string, name: string) {
  const cwd = process.cwd();

  // 1. Handle "Schematic" selection if missing
  // User ran 'nural g product' (missing type) -> assume resource? 
  // OR User ran 'nural g' -> ask what they want.
  if (!name) {
    // If only one arg provided (nural g product), assume it's a resource name
    if (schematic && !["middleware", "guard", "interceptor", "filter", "provider", "service", "resource"].includes(schematic)) {
        name = schematic;
        schematic = "resource";
    } else {
        // Interactive prompt
        if (!schematic) {
            const answer = await inquirer.prompt([{
                type: 'list',
                name: 'type',
                message: 'What do you want to generate?',
                choices: ['resource', 'middleware', 'guard', 'interceptor', 'filter', 'provider']
            }]);
            schematic = answer.type;
        }
        if (!name) {
             const answer = await inquirer.prompt([{
                type: 'input',
                name: 'name',
                message: 'What is the name?'
            }]);
            name = answer.name;
        }
    }
  }

  const fileName = name.toLowerCase();
  const className = capitalize(fileName);
  const camelName = camelCase(fileName);
  const data = { name: className, className, fileName, camelName };

  console.log(chalk.blue(`✨ Generating ${schematic}: ${chalk.bold(className)}`));

  try {
    // 2. Resource Generation (The Full Module - Existing Logic)
    if (schematic === "resource") {
      const targetDir = path.join(cwd, "src/modules", fileName);
      if (fs.existsSync(targetDir)) {
        console.error(chalk.red(`❌ Module '${fileName}' already exists.`));
        return;
      }

      await fs.ensureDir(path.join(targetDir, "models"));
      await fs.ensureDir(path.join(targetDir, "schemas"));

      const files = [
        { tpl: "model.ts.ejs", out: `models/${fileName}.model.ts` },
        { tpl: "schema.request.ts.ejs", out: `schemas/${fileName}.request.ts` },
        { tpl: "schema.response.ts.ejs", out: `schemas/${fileName}.response.ts` },
        { tpl: "service.ts.ejs", out: `${fileName}.service.ts` },
        { tpl: "controller.ts.ejs", out: `${fileName}.controller.ts` },
        { tpl: "module.ts.ejs", out: `${fileName}.module.ts` },
      ];

      for (const file of files) {
        const content = await ejs.renderFile(templatePath("resource", file.tpl), data);
        await fs.outputFile(path.join(targetDir, file.out), content);
      }
      
      // Auto-register (Keep your existing function)
      await registerModuleInApp(cwd, fileName, camelName);
      return;
    }

    // 3. Granular Generation
    let destPath = "";
    let tplName = "";

    if (schematic === "middleware") {
        destPath = path.join(cwd, "src/common/middleware", `${fileName}.middleware.ts`);
        tplName = "middleware.ts.ejs";
    } 
    else if (schematic === "guard") {
        destPath = path.join(cwd, "src/common/guards", `${fileName}.guard.ts`);
        tplName = "guard.ts.ejs";
        await fs.ensureDir(path.join(cwd, "src/common/guards"));
    }
    else if (schematic === "interceptor") {
        destPath = path.join(cwd, "src/common/interceptors", `${fileName}.interceptor.ts`);
        tplName = "interceptor.ts.ejs";
        await fs.ensureDir(path.join(cwd, "src/common/interceptors"));
    }
    else if (schematic === "filter") {
        destPath = path.join(cwd, "src/common/filters", `${fileName}.filter.ts`);
        tplName = "filter.ts.ejs";
        await fs.ensureDir(path.join(cwd, "src/common/filters"));
    }
    else if (schematic === "provider") {
        destPath = path.join(cwd, "src/providers", `${fileName}.provider.ts`);
        tplName = "provider.ts.ejs";
    }

    if (fs.existsSync(destPath)) {
        console.error(chalk.red(`❌ File already exists at ${destPath}`));
        return;
    }

    const content = await ejs.renderFile(templatePath("granular", tplName), data);
    await fs.outputFile(destPath, content);
    console.log(chalk.green(`  ✔ Created ${path.relative(cwd, destPath)}`));

    if (schematic === "provider") {
        await registerProviderInMain(cwd, fileName, camelName);
    }

  } catch (error) {
    console.error(chalk.red("Generation failed."));
    console.error(error);
  }
}

/**
 * Automatically injects provider registration into src/main.ts
 */
async function registerProviderInMain(cwd: string, fileName: string, camelName: string) {
  const mainPath = path.join(cwd, "src/main.ts");
  
  if (!fs.existsSync(mainPath)) {
    console.warn(chalk.yellow("⚠ Could not find src/main.ts. Please register the provider manually."));
    return;
  }

  let content = await fs.readFile(mainPath, "utf-8");
  const providerName = `${camelName}Provider`;
  const importPath = `./providers/${fileName}.provider`;
  
  // Check if already registered
  if (content.includes(providerName)) {
    return;
  }

  console.log(chalk.blue(`  ⚙ Wiring up ${providerName} in main.ts...`));

  // A. Add Import Statement
  const lastImportIdx = content.lastIndexOf("import ");
  const nextLineIdx = content.indexOf("\n", lastImportIdx);
  const importStatement = `import { ${providerName} } from "${importPath}";`;

  if (lastImportIdx !== -1) {
    content = 
      content.slice(0, nextLineIdx + 1) + 
      importStatement + "\n" + 
      content.slice(nextLineIdx + 1);
  } else {
    content = importStatement + "\n" + content;
  }

  // B. Register Provider inside bootstrap() or main()
  // Look for 'app.start' or 'bootstrap'
  const registerLine = `  await app.registerProvider(${providerName});`;
  
  // Try to find insertion point: Before 'app.start'
  const startRegex = /app\.start\(/;
  const match = startRegex.exec(content);

  if (match) {
    const insertPos = match.index;
    content = 
      content.slice(0, insertPos) + 
      registerLine + "\n\n  " + // Add formatting
      content.slice(insertPos);
  } else {
    console.warn(chalk.yellow("⚠ Could not find 'app.start()' in main.ts. Added provider registration at the end."));
    content += `\n// TODO: Register this provider inside your async startup function\n// app.registerProvider(${providerName});\n`;
  }

  await fs.writeFile(mainPath, content);
  console.log(chalk.green(`  ✔ Registered ${providerName} successfully!`));
}

/**
 * Automatically injects the module registration into src/app.ts
 */
async function registerModuleInApp(cwd: string, fileName: string, camelName: string) {
  const appPath = path.join(cwd, "src/app.ts");
  
  if (!fs.existsSync(appPath)) {
    console.warn(chalk.yellow("⚠ Could not find src/app.ts. Please register the module manually."));
    return;
  }

  let appContent = await fs.readFile(appPath, "utf-8");
  const moduleName = `${camelName}Module`;
  const importPath = `./modules/${fileName}/${fileName}.module`;
  
  // Check if already registered
  if (appContent.includes(moduleName)) {
    return;
  }

  console.log(chalk.blue(`  ⚙ Wiring up ${moduleName} in app.ts...`));

  // A. Add Import Statement
  // Find the last import and add ours after it
  const lastImportIdx = appContent.lastIndexOf("import ");
  const nextLineIdx = appContent.indexOf("\n", lastImportIdx);
  
  const importStatement = `import { ${moduleName} } from "${importPath}";`;

  if (lastImportIdx !== -1) {
    appContent = 
      appContent.slice(0, nextLineIdx + 1) + 
      importStatement + "\n" + 
      appContent.slice(nextLineIdx + 1);
  } else {
    appContent = importStatement + "\n" + appContent;
  }

  // B. Register Module
  // Append to the end of the file or find specific insertion point
  const registerLine = `app.registerModule(${moduleName});`;
  
  // We append it before the export or at the end of file for safety
  // Or look for existing registrations
  const registerRegex = /app\.registerModule\(([^)]+)\);/g;
  let match;
  let lastMatchIndex = -1;
  let lastMatchLength = 0;

  while ((match = registerRegex.exec(appContent)) !== null) {
    lastMatchIndex = match.index;
    lastMatchLength = match[0].length;
  }

  if (lastMatchIndex !== -1) {
    const insertPos = lastMatchIndex + lastMatchLength;
    appContent = 
      appContent.slice(0, insertPos) + 
      "\n" + registerLine + 
      appContent.slice(insertPos);
  } else {
    // If no modules registered yet, try to find where app is initialized
    appContent += `\n${registerLine}\n`;
  }

  await fs.writeFile(appPath, appContent);
  console.log(chalk.green(`  ✔ Registered ${moduleName} successfully!`));
}