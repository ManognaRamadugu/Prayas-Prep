import { createClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const rl = createInterface({ input: stdin, output: stdout });

try {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase URL or secret key.");
  }

  const password = await rl.question("Enter your new Admin password: ");

  if (password.length < 8) {
    throw new Error("Password must contain at least 8 characters.");
  }

  const supabase = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await supabase.auth.admin.updateUserById(
    "0eaa13fb-3b28-4a18-9541-165b713cf893",
    { password }
  );

  if (error) throw error;

  console.log("Admin password updated successfully!");
} catch (error) {
  console.error("Password reset failed:", error.message);
  process.exitCode = 1;
} finally {
  rl.close();
}