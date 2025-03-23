import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("case_assignments").del();

  // Assign users to case
  await knex("case_assignments").insert([
    { case_id: 12345, user_id: 101 },  // Detective Jane Smith
    { case_id: 12345, user_id: 102 }, // Officer Mike Johnson
    { case_id: 12345, user_id: 104 }  // Auditor Alice Green
  ]);
}