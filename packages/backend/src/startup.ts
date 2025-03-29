import { exec } from "child_process";
import dotenv from "dotenv";
import { pgQuery } from "./services/pgClient";


dotenv.config({ path: [".env.local", ".env"] });

const runMigrations = async () => {
  console.log("Running migrations...");
  return new Promise<void>((resolve, reject) => {
    exec("npx knex migrate:latest", (error, stdout, stderr) => {
      if (error) {
        console.error(`Migration error: ${error.message}`);
        reject(error);
        return;
      }
      console.log(stdout);
      console.error(stderr);
      resolve();
    });
  });
};

const runSeeds = async () => {
  try {
    // Check if the admin user with id = 1 exists
    const adminUser = await pgQuery("users").where({ id: 1 }).first();
    if (adminUser && process.env.SEED_DB !== "true") {
      console.log("Admin user already exists and SEED_DB is not set to true. Skipping seed process.");
      return;
    }

    console.log("Running seeds...");
    return new Promise<void>((resolve, reject) => {
      exec("npx knex seed:run", (error, stdout, stderr) => {
        if (error) {
          console.error(`Seed error: ${error.message}`);
          reject(error);
          return;
        }
        console.log(stdout);
        console.error(stderr);
        resolve();
      });
    });
  } catch (error) {
    console.error("Error checking seed status:", error);
    throw error;
  }
};

const startApp = async () => {
  console.log("Starting the app...");
  try {
    // Import and run the server directly
    await import("./server");
    console.log("App started successfully.");
  } catch (error) {
    if (error instanceof Error) {
      console.error(`App start error: ${error.message}`);
    } else {
      console.error("App start error:", error);
    }
    process.exit(1); // Exit with an error code if the app fails to start
  }
};

const main = async () => {
  try {
    await runMigrations();
    await runSeeds();
    await startApp();
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1); // Exit with an error code if migrations or seeds fail
  }
};

main();