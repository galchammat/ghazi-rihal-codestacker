import type { Knex } from "knex";
import { clearanceLevels } from "../../schemas/userSchema";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('cases', table => {
    table.enum('clearance', clearanceLevels).defaultTo('critical');
    table.dropColumn('level');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('cases', table => {
    table.dropColumn('clearance');
  });
}