import type { Knex } from "knex";
import dotenv from "dotenv";

// Load environment variables because knex scripts may be called directly without server.ts
dotenv.config({ path: [".env.local", ".env"] });

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "postgresql",
    connection: process.env.PG_URI,
    pool: {
      min: 1,
      max: 5
    },
    migrations: {
      directory: './src/configuration/migrations',
      tableName: "knex_migrations"
    },
    seeds: {
      directory: './src/configuration/seeds'
    }
  },

  production: {
    client: "postgresql",
    connection: process.env.PG_URI,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './src/configuration/migrations',
      tableName: "knex_migrations"
    },
    seeds: {
      directory: './src/configuration/seeds'
    }
  }

};

export default config;
