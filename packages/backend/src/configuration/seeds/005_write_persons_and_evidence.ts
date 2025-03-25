import { Knex } from "knex";
import * as fs from 'fs';
import * as path from 'path';

export async function seed(knex: Knex): Promise<void> {
  await knex("persons").del();
  await knex("evidence").del();

  // Inserts seed entries for persons
  await knex("persons").insert([
    { case_id: 12345, type: "suspect", name: "Michael Brown", age: 32, gender: "Male", role: "Primary Suspect" },
    { case_id: 12345, type: "victim", name: "Sarah Parker", age: 28, gender: "Female", role: "Store Owner" }
  ]);

  // Read an actual image file and convert it to a buffer
  const imagePath = path.join(__dirname, '../cases/sampleEvidence.jpg');
  const imageBuffer = fs.readFileSync(imagePath);

  // Inserts seed entries for evidence
  await knex("evidence").insert([
    { case_id: 12345, type: "image", content: imageBuffer, remarks: "torn shirt", deleted: false },
    { case_id: 12345, type: "text", content: Buffer.from("This is a text evidence."), deleted: false }
  ]);

  await knex.raw('SET session_replication_role = DEFAULT');
}