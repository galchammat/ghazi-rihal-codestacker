import { Knex } from "knex";
import bcrypt from "bcrypt";

export async function seed(knex: Knex): Promise<void> {
  // Check if the admin user already exists
  const existingUser = await knex("users")
    .where({ email: process.env.ADMIN_EMAIL })
    .first();

  if (existingUser) {
    console.log("Admin user already exists. Skipping seed.");
    return;
  }

  // Seed the admin user
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be defined in environment variables before seeding the database for the first time.");
  }

  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

  await knex("users").insert([
    {
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
    }
  ]);
}