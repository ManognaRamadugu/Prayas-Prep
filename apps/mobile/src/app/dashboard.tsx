import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import DailyGoalCard from "../components/dashboard/DailyGoalCard";
import ContinueLearningCard from "../components/dashboard/ContinueLearningCard";
import PerformanceSnapshotCard from "../components/dashboard/PerformanceSnapshotCard";
import SubjectProgressSection from "../components/dashboard/SubjectProgressSection";
import QuickActionGrid from "../components/dashboard/QuickActionGrid";

import { colors } from "../constants/theme";
import { getDashboardData } from "../data/dashboardConfig";
import type { PreparationPath } from "../types/dashboard";

import { supabase } from "../../lib/supabase";
import { getTodayStudyMinutes } from "../../lib/study";

export default function DashboardScreen() {
  const router = useRouter();

  const [studentName, setStudentName] = useState("Student");
  const [preparationPath, setPreparationPath] =
    useState<PreparationPath>("JEE");

  const [loading, setLoading] = useState(true);
  const [todayStudyMinutes, setTodayStudyMinutes] = useState(0);

  useEffect(() => {
    async function loadStudentData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.log("No logged-in user found");
          return;
        }
        const studyMinutes = await getTodayStudyMinutes();

setTodayStudyMinutes(studyMinutes);

        // Get student's name
        const fullName = user.user_metadata?.full_name;

        if (fullName) {
          setStudentName(fullName);
        } else if (user.email) {
          setStudentName(user.email.split("@")[0]);
        }

        // Get preparation path
        const { data: profile, error } = await supabase
          .from("student_profiles")
          .select("preparation_path")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error(
            "Error loading preparation path:",
            error
          );
        } else if (profile?.preparation_path) {
          setPreparationPath(
            profile.preparation_path as PreparationPath
          );
        }
      } catch (error) {
        console.error(
          "Error loading student dashboard data:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadStudentData();
  }, []);

  const data = getDashboardData(studentName, preparationPath);

const dailyGoal = {
  ...data.dailyGoal,
  completedMinutes: todayStudyMinutes,
};

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top"]}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Loading your dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader
          studentName={data.studentName}
          examLabel={data.examLabel}
          unreadNotifications={data.unreadNotifications}
        />

        <DailyGoalCard goal={dailyGoal} />

        <ContinueLearningCard
          item={data.continueLearning}
        />

        <PerformanceSnapshotCard
          performance={data.performance}
        />

        <SubjectProgressSection
          subjects={data.subjects}
        />

        <QuickActionGrid
          actions={data.quickActions}
          onPressAction={(action) => {
            router.push(action.route as any);
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingBottom: 48,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.background,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});