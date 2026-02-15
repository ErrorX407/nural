import { Command } from "commander";
import { newCommand } from "./commands/new.js";

const program = new Command();

program
  .name("nural")
  .description("Nural CLI - The intelligent framework tool")
  .version("0.3.8");

program
  .command("new <project-name>")
  .description("Scaffold a new Nural project")
  .action(newCommand);

program.parse(process.argv);
