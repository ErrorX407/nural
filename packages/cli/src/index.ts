import { Command } from "commander";
import { newCommand } from "./commands/new.js";
import { generateCommand } from "./commands/generate.js";
import { addCommand } from "./commands/add.js";
import { infoCommand } from "./commands/info.js";

const program = new Command();

program
  .name("nural")
  .description("Nural CLI - The intelligent framework tool")
  .version("0.4.0");

program
  .command("new <project-name>")
  .description("Scaffold a new Nural project")
  .action(newCommand);

program
  .command("generate <name>")
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

program.parse(process.argv);
