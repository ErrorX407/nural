export interface ScaffoldData {
    name: string;
    framework: "fastify" | "express";
    packageManager: string;
    integrations: string[];
}

export class PackageJsonFactory {
    /**
     * Generates the programmatic package.json object for a new Nural project
     */
    static create(data: ScaffoldData): Record<string, any> {
        const pkgJson: any = {
            name: data.name,
            version: "0.0.1",
            description: "Nural Project",
            scripts: {
                dev: "nural dev --watch",
                build: "nural build",
                start: "nural start",
                "start:prod": "nural start",
                "start:debug": "nural start --debug",
                "docs:gen": "nural docs",
                test: "nural test",
                "test:watch": "nural test --watch",
                "test:cov": "nural test --coverage",
                "test:e2e": "nural test --e2e",
            },
            dependencies: {
                "@nuraljs/core": "^0.7.0",
                dotenv: "^17.3.1",
            },
            devDependencies: {
                tsx: "^4.7.1",
                tsup: "^8.0.2",
                typescript: "^5.3.3",
                "@types/node": "^25.2.3",
                vitest: "^1.3.1",
                "@nuraljs/testing": "^0.1.0",
            },
        };

        if (data.framework === "fastify") {
            pkgJson.dependencies.fastify = "^5.7.4";
        } else {
            pkgJson.dependencies.express = "^5.2.1";
            pkgJson.devDependencies["@types/express"] = "^5.0.0";
        }

        if (data.integrations.includes("redis")) {
            pkgJson.dependencies.ioredis = "^5.3.2";
        }
        if (data.integrations.includes("ws")) {
            pkgJson.dependencies["socket.io"] = "^4.7.4";
        }
        if (data.integrations.includes("rabbitmq")) {
            pkgJson.dependencies.amqplib = "^0.10.3";
            pkgJson.devDependencies["@types/amqplib"] = "^0.10.1";
        }
        if (data.integrations.includes("prisma-pg")) {
            pkgJson.dependencies["@prisma/client"] = "^7.3.0";
            pkgJson.dependencies["@prisma/adapter-pg"] = "^7.3.0";
            pkgJson.dependencies.pg = "^8.11.3";
            pkgJson.devDependencies.prisma = "^7.3.0";
            pkgJson.devDependencies["@types/pg"] = "^8.11.0";
            pkgJson.scripts["db:generate"] = "prisma generate";
            pkgJson.scripts["db:migrate"] = "prisma migrate dev";
        }
        if (data.integrations.includes("mongoose")) {
            pkgJson.dependencies.mongoose = "^9.2.1";
        }

        return pkgJson;
    }
}
