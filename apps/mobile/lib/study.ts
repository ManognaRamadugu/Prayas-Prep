import { supabase } from "./supabase";

export async function startStudySession(
  activityType: string = "lesson"
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("No logged-in user found.");
  }

  const { data, error } = await supabase
    .from("study_sessions")
    .insert({
      user_id: user.id,
      activity_type: activityType,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error starting study session:", error);
    throw error;
  }

  return data;
}

export async function finishStudySession(
  sessionId: string,
  startedAt: string
) {
  const endedAt = new Date();

  const started = new Date(startedAt);
  const durationSeconds = Math.max(
    0,
    Math.floor(
      (endedAt.getTime() - started.getTime()) / 1000
    )
  );

  const { data, error } = await supabase
    .from("study_sessions")
    .update({
      ended_at: endedAt.toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
    console.error("Error finishing study session:", error);
    throw error;
  }

  return data;
}
export async function getTodayStudyMinutes() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("No logged-in user found.");
  }

  const { data, error } = await supabase
    .from("study_sessions")
    .select("duration_seconds")
    .eq("user_id", user.id)
    .gte("started_at", new Date().toISOString().split("T")[0])
    .lt(
      "started_at",
      new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]
    )
    .not("duration_seconds", "is", null);

  if (error) {
    console.error("Error loading today's study time:", error);
    throw error;
  }

  const totalSeconds = (data ?? []).reduce(
    (total, session) =>
      total + (session.duration_seconds ?? 0),
    0
  );

  return Math.floor(totalSeconds / 60);
}