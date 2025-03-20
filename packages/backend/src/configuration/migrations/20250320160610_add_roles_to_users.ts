import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.table("users", (table) => {
    table.string("role").defaultTo("officer-low");
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.table("users", (table) => {
    table.dropColumn("role");
  });
}

