import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('reports', table => {
    table.increments('id').primary();

    // reporter details
    table.string('email').notNullable();
    table.string('civil_id').notNullable();
    table.string('name').notNullable();

    // crime details
    table.text('description').notNullable();
    table.string("area").notNullable();
    table.string("city").notNullable();

    table.integer('case_id').unsigned().references('id').inTable('cases').nullable().defaultTo(null);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('reports');
}