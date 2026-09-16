import { supabase } from "./supabase";

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function isOnboardingComplete(userId: string) {
  const { data, error } = await supabase
    .from("student_profiles")
    .select("onboarding_completed")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error checking onboarding status:", error);
    return false;
  }

  return data?.onboarding_completed ?? false;
}