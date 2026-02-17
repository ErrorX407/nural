import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ejs from "ejs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to find Resource templates specifically
const resourceTemplatePath = (name: string) => {
  // 1. Check dist/templates/resource (production build)
  // __dirname points to 'dist' when running the built CLI
  const distPath = path.join(__dirname, "templates/resource", name);
  if (fs.existsSync(distPath)) return distPath;
  
  // 2. Check src/templates/resource (local dev / raw ts-node)
  // If __dirname is 'src/commands' (dev), go up to src/templates
  // If __dirname is 'dist' (prod locally linked), go up to src via ../src
  const localSrcPath = path.join(__dirname, "../src/templates/resource", name);
  if (fs.existsSync(localSrcPath)) return localSrcPath;

  return distPath; // Return dist path by default for error message clarity
};

// String utilities
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const camelCase = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export async function generateCommand(name: string) {
  const cwd = process.cwd();
  
  // 1. Normalize Names
  // Input: "Products" -> fileName: "products", className: "Products", camelName: "products"
  const fileName = name.toLowerCase(); 
  const className = capitalize(fileName); 
  const camelName = camelCase(fileName);

  const targetDir = path.join(cwd, "src/modules", fileName);

  // 2. Safety Check
  if (fs.existsSync(targetDir)) {
    console.error(chalk.red(`❌ Module '${fileName}' already exists.`));
    process.exit(1);
  }

  console.log(chalk.blue(`✨ Generating resource: ${chalk.bold(className)}`));

  // 3. Create Enterprise Directory Structure
  await fs.ensureDir(path.join(targetDir, "models"));
  await fs.ensureDir(path.join(targetDir, "schemas"));

  const data = { name: className, className, fileName, camelName };

  // 4. Generate Files (Mapping Template -> Destination)
  const files = [
    { tpl: "model.ts.ejs", out: `models/${fileName}.model.ts` },
    { tpl: "schema.request.ts.ejs", out: `schemas/${fileName}.request.ts` },
    { tpl: "schema.response.ts.ejs", out: `schemas/${fileName}.response.ts` },
    { tpl: "service.ts.ejs", out: `${fileName}.service.ts` },
    { tpl: "controller.ts.ejs", out: `${fileName}.controller.ts` },
    { tpl: "module.ts.ejs", out: `${fileName}.module.ts` },
  ];

  for (const file of files) {
    const template = resourceTemplatePath(file.tpl);
    if (!fs.existsSync(template)) {
        console.error(chalk.red(`Template not found: ${file.tpl}`));
        continue;
    }
    const content = await ejs.renderFile(template, data);
    await fs.outputFile(path.join(targetDir, file.out), content);
    console.log(chalk.green(`  ✔ Created src/modules/${fileName}/${file.out}`));
  }

  // 5. Auto-Register in app.ts
  await registerModuleInApp(cwd, fileName, camelName);
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