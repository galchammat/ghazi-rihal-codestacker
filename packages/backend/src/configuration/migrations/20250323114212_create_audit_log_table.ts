import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('audit_logs', table => {
    table.increments('id').primary();
    table.integer('evidence_id').unsigned().references('id').inTable('evidence').notNullable();
    table.integer('user_id').unsigned().references('id').inTable('users').notNullable();
    table.string('action').notNullable();
    table.timestamp('timestamp').defaultTo(knex.fn.now()).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('audit_logs');
}