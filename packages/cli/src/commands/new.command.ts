import { scaffold } from "../core/scaffold/scaffold.service";

// We'll use CliPrompts but since we need a complex nested object, 
// we will export inquirer from the ui module later and for now use it directly 
// or implement a generic 'prompt' method on CliPrompts.
// For now, let's just make it use inquirer from the `ui` folder's wrapped scope.
import inquirer from "inquirer";

export async function newCommand(projectName: string) {
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "framework",
      message: "Which underlying engine would you like to use?",
      choices: ["Fastify (Recommended)", "Express"],
      default: "Fastify (Recommended)",
    },
    {
      type: "list",
      name: "packageManager",
      message: "Which package manager do you use?",
      choices: ["npm", "pnpm", "yarn", "bun"],
      default: "npm",
    },
    {
      type: "checkbox",
      name: "integrations",
      message: "Which integrations do you need?",
      choices: [
        { name: "Redis", value: "redis" },
        { name: "WebSockets (WS)", value: "ws" },
        { name: "RabbitMQ", value: "rabbitmq" },
        { name: "PostgreSQL (Prisma)", value: "prisma-pg" },
        { name: "MongoDB (Mongoose)", value: "mongoose" },
      ],
    },
  ]);

  await scaffold(projectName, answers);
}
