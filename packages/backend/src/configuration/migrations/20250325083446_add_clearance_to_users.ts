import type { Knex } from "knex";
import { clearanceLevels } from "../../schemas/userSchema";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', table => {
    table.enum('clearance', clearanceLevels).nullable().defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', table => {
    table.dropColumn('clearance');
  });
}