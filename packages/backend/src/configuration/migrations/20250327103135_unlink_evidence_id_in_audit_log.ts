import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('audit_logs', (table) => {
    table.dropForeign(['evidence_id']); // Remove the foreign key constraint
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('audit_logs', (table) => {
    table.foreign('evidence_id').references('id').inTable('evidence').onDelete('CASCADE');
  });
}