import { describe, it, expect } from "vitest";
import { PackageJsonFactory, ScaffoldData } from "../../../core/scaffold/package-json.factory";

describe("PackageJsonFactory", () => {
    it("should generate a basic express package.json without integrations", () => {
        const data: ScaffoldData = {
            name: "test-app",
            framework: "express",
            packageManager: "npm",
            integrations: [],
        };

        const pkg = PackageJsonFactory.create(data);

        expect(pkg["name"]).toBe("test-app");
        expect(pkg["dependencies"]?.express).toBeDefined();
        expect(pkg["dependencies"]?.fastify).toBeUndefined();
        expect(pkg["dependencies"]?.["@prisma/client"]).toBeUndefined();
    });

    it("should generate a fastify package.json with redis and prisma", () => {
        const data: ScaffoldData = {
            name: "fastify-app",
            framework: "fastify",
            packageManager: "pnpm",
            integrations: ["redis", "prisma-pg"],
        };

        const pkg = PackageJsonFactory.create(data);

        expect(pkg["name"]).toBe("fastify-app");
        expect(pkg["dependencies"]?.fastify).toBeDefined();
        expect(pkg["dependencies"]?.express).toBeUndefined();

        // Integrations
        expect(pkg["dependencies"]?.ioredis).toBeDefined();
        expect(pkg["dependencies"]?.["@prisma/client"]).toBeDefined();
        expect(pkg["devDependencies"]?.prisma).toBeDefined();
        expect(pkg["scripts"]?.["db:generate"]).toBe("prisma generate");
    });
});
