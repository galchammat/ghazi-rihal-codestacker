import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('deletion_requests', (table) => {
    table.increments('id').primary();
    table.integer('evidence_id').unsigned().references('id').inTable('evidence').onDelete('CASCADE');
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.string('status').notNullable().defaultTo('In Progress'); // Status: Initiated, Confirmed, Finalized
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('deletion_requests');
}