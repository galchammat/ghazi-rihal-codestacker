import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("reports").del();

  await knex("reports").insert({
    id: 12,
    email: "bob.wilson@gmail.com",
    civil_id: "A12356879",
    name: "Citizen Bob Wilson",
    area: "Downtown",
    city: "New York",
    description: "I witnessed a robbery at XYZ store.",
  });
}
