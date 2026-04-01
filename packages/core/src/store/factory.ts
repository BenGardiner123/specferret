import * as fs from "node:fs/promises";
import * as path from "node:path";
import { DBStore } from "./types.js";
import { SqliteStore } from "./sqlite.js";
import { PostgresStore } from "./postgres.js";
import { loadConfig } from "../config.js";
import { findProjectRoot } from "../utils/paths.js";

/**
 * Evaluates the current environment and configuration (handling overrides from the CI pipeline, S005)
 * and returns the correct initialized database engine.
 */
export async function getStore(): Promise<DBStore> {
  // S005: If FERRET_DATABASE_URL is set in the environment, use PostgreSQL without prompts.
  const envUrl = process.env.FERRET_DATABASE_URL;
  if (envUrl) {
    const store = new PostgresStore(envUrl);
    // In production we should ensure init() was run by `ferret init`, but we do it gracefully here
    // or rely on the user to run init. If this was just the runner, it shouldn't recreate tables.
    // For now we assume the caller handles init if necessary, or we just return the instantiated store.
    return store;
  }

  // At this point FERRET_DATABASE_URL is NOT set in the environment (we returned early above if it was).
  // If the config explicitly opts into postgres, that means the user ran `ferret upgrade --postgres`
  // which writes FERRET_DATABASE_URL to .env, but that .env has not been loaded into the environment.
  // Fail fast with a clear error rather than silently falling through to SQLite.
  try {
    const config = await loadConfig();
    if (config.store === "postgres") {
      console.error("FATAL: ferret.config.json sets store to postgres but FERRET_DATABASE_URL is not set. Source your .env file or set the variable in your environment.");
      process.exit(1);
    }
  } catch {
    // Suppress config missing errors and fallback to logic
  }

  // S005: If FERRET_DATABASE_URL is not set, and config is missing / local, fall back to SQLite
  // Check if .ferret/graph.db exists relative to the discovered project root
  const dbPath = path.join(findProjectRoot(), ".ferret", "graph.db");
  try {
    await fs.access(dbPath);
    return new SqliteStore(); // Implicit fallback to SQLite
  } catch (err) {
    // CI Mode checking: 
    if (process.env.FERRET_CI === "true") {
      console.error("FATAL: FERRET_CI is true, but no database configuration found.");
      process.exit(1);
    }
    
    // SQLite by default
    return new SqliteStore();
  }
}
