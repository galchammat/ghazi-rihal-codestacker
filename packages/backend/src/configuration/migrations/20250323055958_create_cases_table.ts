import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('cases', table => {
    table.increments('id').primary();
    table.string('case_name').notNullable();
    table.text('description').notNullable();
    table.string('area').notNullable();
    table.string('city').notNullable();
    table.integer('created_by').unsigned().references('id').inTable('users');
    table.string('type').notNullable();
    table.string('level').notNullable();
    table.string('status').defaultTo('pending').notNullable();
    table.timestamps(true, true);
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('cases');
}

