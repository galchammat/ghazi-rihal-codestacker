import { Knex } from "knex";
import bcrypt from "bcrypt";

export async function seed(knex: Knex): Promise<void> {
  await knex.raw('SET session_replication_role = replica');
  await knex("users").del();

  // Create the admin user
  if (!process.env.ADMIN_EMAIL) {
    throw new Error("ADMIN_EMAIL must be defined in environment variables before seeding the database for the first time.");
  }

  if (!process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD must be defined in environment variables before seeding the database for the first time.");
  }

  if (!process.env.ADMIN_NAME) {
    throw new Error("ADMIN_NAME must be defined in environment variables before seeding the database for the first time.");
  }

  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

  await knex("users").insert([
    {
      id: 1,
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      name: process.env.ADMIN_NAME,
      role: "admin",
    }
  ]);

  // Create detective, officer, and auditor to be assigned to the seed case
  await knex("users").insert([
    { id: 101, name: "Detective Jane Smith", email: "investigator.jane@example.com", password: await bcrypt.hash("janesPa55wORD", 10), role: "investigator" },
    { id: 102, name: "Officer Mike Johnson", email: "officer.mike@example.com", password: await bcrypt.hash("mikesPa55wORD", 10), role: "officer", clearance: "high" },
    { id: 104, name: "Auditor Alice Green", email: "auditor.alice@example.com", password: await bcrypt.hash("alicesPa55wORD", 10), role: "auditor", clearance: "critical" },
    { id: 105, name: "Officer Jon Doe", email: "officer.jon@example.com", password: await bcrypt.hash("jonsPa55wORD", 10), role: "officer", clearance: "low" }
  ]);
}