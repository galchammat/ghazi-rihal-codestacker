import Knex from "knex";
import knexConfig from "../../knexfile";
import dotenv from "dotenv";

dotenv.config({ path: [".env.local", ".env"] });

const environment = process.env.NODE_ENV || "development";
const config = knexConfig[environment];

const pgKnex = Knex(config);

export const pgQuery = pgKnex;