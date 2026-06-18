// Create (or promote) an admin user. Reads Supabase creds from .env.local.
// Usage: node scripts/make-admin.mjs "email@domain" "Full Name" ["password"]
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function env(key) {
  const line = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .find((l) => l.startsWith(key + "="));
  return line ? line.slice(key.length + 1).trim() : "";
}

const url = env("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
const email = process.argv[2];
const fullName = process.argv[3] || "Admin";
const password =
  process.argv[4] || "Poss-" + Math.random().toString(36).slice(2, 10) + "!";

if (!url || !serviceKey || !email) {
  console.error("Missing url/serviceKey/email.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Create the auth user (or find existing), then flag the profile as admin.
let userId;
const { data: created, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName, role_tag: "People & Culture" },
});
if (error && !/already/i.test(error.message)) {
  console.error("createUser failed:", error.message);
  process.exit(1);
}
if (created?.user) {
  userId = created.user.id;
  console.log("Created auth user.");
} else {
  const { data: list } = await admin.auth.admin.listUsers();
  userId = list.users.find((u) => u.email === email)?.id;
  console.log("User already existed — promoting.");
}

await admin
  .from("profiles")
  .upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      role_tag: "People & Culture",
      is_admin: true,
      status: "active",
    },
    { onConflict: "id" },
  );

console.log("\n✅ Admin ready");
console.log("   email:    " + email);
if (!process.argv[4]) console.log("   password: " + password + "  (change it after first login)");
