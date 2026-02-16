import { AnyRouteConfig } from "../types";
import type { MiddlewareHandler } from "./middleware";

export interface ModuleConfig {
    /** * Prefix for all routes in this module (e.g. "/users") 
     */
    prefix?: string;

    /** * Middleware to apply to ALL routes in this module 
     */
    middleware?: MiddlewareHandler<any, any>[];

    /** * OpenAPI Tags to apply to ALL routes (e.g. ["Auth"]) 
     * This groups endpoints in the Scalar/Swagger UI.
     */
    tags?: string[];

    /**
     * Security requirements for ALL routes in this module
     * @example [{ bearerAuth: [] }]
     */
    security?: Array<Record<string, string[]>>;

    /** * The routes belonging to this module 
     */
    routes: AnyRouteConfig[];
}

/**
 * Create a modular group of routes with shared prefix/middleware/docs
 */
export function createModule(config: ModuleConfig): ModuleConfig {
    return config;
}