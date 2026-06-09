/// <reference types="node" />

// Ambient module declarations to quiet editor TypeScript errors
declare module "dotenv/config";
declare module "@prisma/adapter-pg";
declare module "argon2";
declare module "pg";

// Node built-in namespace shims (should be provided by @types/node)
declare module "node:fs/promises";
declare module "node:path";
declare module "node:url";

// Generic catch-all for any other untyped imports used only in build/runtime
declare module '*';
