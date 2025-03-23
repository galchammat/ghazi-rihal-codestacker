import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('persons', table => {
    table.increments('id').primary();
    table.integer('case_id').unsigned().references('id').inTable('cases').onDelete('CASCADE');
    table.string('type').notNullable();
    table.string('name').notNullable();
    table.integer('age').notNullable();
    table.string('gender').notNullable();
    table.string('role').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('persons');
}