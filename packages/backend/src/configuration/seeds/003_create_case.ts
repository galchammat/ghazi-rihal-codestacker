import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("cases").del();

  await knex("cases").insert({
    id: 12345,
    case_name: "Theft Investigation",
    description: "Investigation of a reported theft at a local store.",
    area: "Downtown",
    city: "New York",
    created_by: 1,
    type: "criminal",
    clearance: "high"
  });

  await knex("reports")
    .where({ id: 12 })
    .update({ case_id: 12345 });
}
