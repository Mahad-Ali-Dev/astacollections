/**
 * Reset the admin password to whatever's in ADMIN_EMAIL / ADMIN_PASSWORD env vars.
 *
 * Usage:
 *   npm run admin:reset
 *
 * Or override on the command line:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=newpass npm run admin:reset
 *
 * If the admin doesn't exist yet, it's created.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("✘ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("✘ ADMIN_PASSWORD should be at least 8 characters");
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);
  const admin = await prisma.admin.upsert({
    where: { email },
    update: { password: hashed },
    create: { email, password: hashed, name: "Store Admin" },
  });

  console.log(`✔ Admin password reset for ${admin.email}`);
  console.log(`  You can now sign in at /admin/login with this password.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
