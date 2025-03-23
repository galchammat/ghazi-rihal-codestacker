import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('evidence', table => {
    table.increments('id').primary();
    table.integer('case_id').unsigned().references('id').inTable('cases').onDelete('CASCADE');
    table.string('type').notNullable(); // Type of evidence (image, text)
    table.binary('content').notNullable(); // Binary data for evidence
    table.boolean('deleted').defaultTo(false).notNullable(); // Soft delete flag
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('evidence');
}