import { Command } from "commander";
import { newCommand } from "./commands/new.js";
import { generateCommand } from "./commands/generate.js";
import { addCommand } from "./commands/add.js";
import { infoCommand } from "./commands/info.js";
import { devCommand } from "./commands/dev.js";
import { buildCommand } from "./commands/build.js";
import { startCommand } from "./commands/start.js";
import { testCommand } from "./commands/test.js";
import { docsCommand } from "./commands/docs.js";
import { routesCommand } from "./commands/routes.js";
import { consoleCommand } from "./commands/console.js";
import { cleanCommand } from "./commands/clean.js";
import { doctorCommand } from "./commands/doctor.js";
import { completionCommand } from "./commands/completion.js";
import { updateCommand } from "./commands/update.js";

const program = new Command();

program
  .name("nural")
  .description("Nural CLI - The intelligent framework tool")
  .version("0.4.2");

program
  .command("new <project-name>")
  .description("Scaffold a new Nural project")
  .action(newCommand);

program
  .command("generate <schematic> [name]")
  .alias("g")
  .description("Generate a new resource (Module, Controller, Service, Schema)")
  .action(generateCommand);

program
  .command("add [integration]")
  .description("Add an integration to the project (redis, rabbitmq, mongoose, prisma-pg)")
  .action(addCommand);

program
  .command("info")
  .description("It's incredibly useful when users report bugs \"What version of Nural are you running?\"")
  .action(infoCommand);

program
  .command("dev")
  .description("Start the development server")
  .option("-w, --watch", "Enable polling mode for WSL/Docker compatibility")
  .action(devCommand);

program
  .command("build")
  .description("Build the application for production")
  .option("--ignore-ts-errors", "Proceed with build even if TypeScript checks fail")
  .action(buildCommand);

program
  .command("start")
  .description("Run the production application")
  .option("--debug", "Run in debug mode (inspector enabled)")
  .action(startCommand);

program
  .command("test")
  .description("Run application tests")
  .option("-w, --watch", "Run in watch mode")
  .option("-c, --coverage", "Generate coverage report")
  .option("--e2e", "Run end-to-end tests only")
  .action(testCommand);

program
  .command("docs")
  .description("Generate static OpenAPI specification file")
  .option("-o, --output <file>", "Output file path", "openapi.json")
  .action(docsCommand);

program
  .command("routes")
  .alias("list") // 'nural list' is also intuitive
  .description("List all registered routes")
  .action(routesCommand);

program
  .command("console")
  .alias("c") // Shortcut: 'nural c'
  .alias("tinker") // Laravel developers will love this
  .description("Launch an interactive application shell (REPL)")
  .action(consoleCommand);

program
  .command("clean")
  .description("Remove build artifacts and temporary files")
  .action(cleanCommand);

program
  .command("doctor")
  .description("Check your system and project health")
  .action(doctorCommand);

program
  .command("completion")
  .description("Generate shell completion script")
  .action(completionCommand(program));

program
  .command("update")
  .alias("u")
  .description("Update Nural dependencies to the latest version")
  .action(updateCommand);

program.parse(process.argv);
