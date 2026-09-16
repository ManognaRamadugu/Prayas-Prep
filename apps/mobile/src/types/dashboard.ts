/**
 * Prayas Prep — Dashboard domain types
 * These describe the shape of data the dashboard renders. In production
 * this is populated from Supabase (student profile, progress, attempts);
 * for now `data/dashboardConfig.ts` provides mock data keyed by path.
 */

export type PreparationPath = 'JEE' | 'NEET' | 'EAMCET' | 'FOUNDATION';

export interface SubjectProgress {
  id: string;
  name: string;
  icon: string; // Ionicons name
  progressPercent: number; // 0-100
  accuracyPercent: number; // 0-100
  color: string;
}

export interface ContinueLearningItem {
  subjectName: string;
  chapterName: string;
  topicName: string;
  progressPercent: number;
  estimatedMinutesLeft: number;
}

export interface DailyGoal {
  targetMinutes: number;
  completedMinutes: number;
  streakDays: number;
}

export interface PerformanceSnapshot {
  overallAccuracy: number; // 0-100
  testsCompleted: number;
  percentile: number; // 0-100
  weakestTopic: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string; // Ionicons name
  route: string; // expo-router path
}

export interface StudentDashboardData {
  studentName: string;
  preparationPath: PreparationPath;
  examLabel: string; // e.g. "JEE Main 2027"
  daysToExam: number;
  overallProgressPercent: number;
  continueLearning: ContinueLearningItem;
  subjects: SubjectProgress[];
  dailyGoal: DailyGoal;
  performance: PerformanceSnapshot;
  quickActions: QuickAction[];
  unreadNotifications: number;
}
