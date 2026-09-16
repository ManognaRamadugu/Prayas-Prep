import { colors } from '../constants/theme';
import type { PreparationPath, StudentDashboardData } from '../types/dashboard';

/**
 * getDashboardData
 * -----------------
 * Returns the dashboard content for a given preparation path.
 *
 * Replace the body of this function with a Supabase query, e.g.
 *   supabase.from('student_dashboard_view').select('*').eq('user_id', uid)
 * The screen and every component below only depend on the
 * `StudentDashboardData` shape — none of them know or care which
 * exam the student is preparing for. That's what keeps this scalable
 * to new exams without touching UI code.
 */
export function getDashboardData(
  studentName: string,
  path: PreparationPath
): StudentDashboardData {
  const byPath: Record<PreparationPath, StudentDashboardData> = {
    JEE: {
      studentName,
      preparationPath: 'JEE',
      examLabel: 'JEE Main',
      daysToExam: 214,
      overallProgressPercent: 62,
      continueLearning: {
        subjectName: 'Physics',
        chapterName: 'Rotational Motion',
        topicName: 'Moment of Inertia',
        progressPercent: 45,
        estimatedMinutesLeft: 18,
      },
      subjects: [
        { id: 'phy', name: 'Physics', icon: 'planet-outline', progressPercent: 58, accuracyPercent: 74, color: colors.primary },
        { id: 'chem', name: 'Chemistry', icon: 'flask-outline', progressPercent: 71, accuracyPercent: 81, color: colors.success },
        { id: 'math', name: 'Mathematics', icon: 'calculator-outline', progressPercent: 49, accuracyPercent: 66, color: colors.accent },
      ],
      dailyGoal: { targetMinutes: 120, completedMinutes: 75, streakDays: 9 },
      performance: { overallAccuracy: 74, testsCompleted: 32, percentile: 88, weakestTopic: 'Electrostatics' },
      quickActions: [
        { id: 'practice', label: 'Practice', icon: 'create-outline', route: '/practice' },
        { id: 'mock', label: 'Mock Test', icon: 'timer-outline', route: '/tests' },
        { id: 'performance', label: 'Performance', icon: 'stats-chart-outline', route: '/performance' },
        { id: 'doubts', label: 'Doubts', icon: 'help-buoy-outline', route: '/doubts' },
      ],
      unreadNotifications: 3,
    },
    NEET: {
      studentName,
      preparationPath: 'NEET',
      examLabel: 'NEET UG ',
      daysToExam: 198,
      overallProgressPercent: 55,
      continueLearning: {
        subjectName: 'Biology',
        chapterName: 'Human Physiology',
        topicName: 'Excretory System',
        progressPercent: 60,
        estimatedMinutesLeft: 22,
      },
      subjects: [
        { id: 'bio', name: 'Biology', icon: 'leaf-outline', progressPercent: 68, accuracyPercent: 82, color: colors.success },
        { id: 'phy', name: 'Physics', icon: 'planet-outline', progressPercent: 44, accuracyPercent: 61, color: colors.primary },
        { id: 'chem', name: 'Chemistry', icon: 'flask-outline', progressPercent: 52, accuracyPercent: 70, color: colors.accent },
      ],
      dailyGoal: { targetMinutes: 150, completedMinutes: 90, streakDays: 14 },
      performance: { overallAccuracy: 78, testsCompleted: 27, percentile: 91, weakestTopic: 'Genetics & Evolution' },
      quickActions: [
        { id: 'practice', label: 'Practice', icon: 'create-outline', route: '/practice' },
        { id: 'mock', label: 'Mock Test', icon: 'timer-outline', route: '/tests' },
        { id: 'performance', label: 'Performance', icon: 'stats-chart-outline', route: '/performance' },
        { id: 'doubts', label: 'Doubts', icon: 'help-buoy-outline', route: '/doubts' },
      ],
      unreadNotifications: 1,
    },
    EAMCET: {
      studentName,
      preparationPath: 'EAMCET',
      examLabel: 'TS EAMCET ',
      daysToExam: 160,
      overallProgressPercent: 48,
      continueLearning: {
        subjectName: 'Mathematics',
        chapterName: 'Coordinate Geometry',
        topicName: 'Parabola',
        progressPercent: 30,
        estimatedMinutesLeft: 25,
      },
      subjects: [
        { id: 'math', name: 'Mathematics', icon: 'calculator-outline', progressPercent: 51, accuracyPercent: 69, color: colors.accent },
        { id: 'phy', name: 'Physics', icon: 'planet-outline', progressPercent: 46, accuracyPercent: 64, color: colors.primary },
        { id: 'chem', name: 'Chemistry', icon: 'flask-outline', progressPercent: 47, accuracyPercent: 67, color: colors.success },
      ],
      dailyGoal: { targetMinutes: 100, completedMinutes: 40, streakDays: 4 },
      performance: { overallAccuracy: 67, testsCompleted: 18, percentile: 76, weakestTopic: 'Vectors' },
      quickActions: [
        { id: 'practice', label: 'Practice', icon: 'create-outline', route: '/practice' },
        { id: 'mock', label: 'Mock Test', icon: 'timer-outline', route: '/tests' },
        { id: 'performance', label: 'Performance', icon: 'stats-chart-outline', route: '/performance' },
        { id: 'doubts', label: 'Doubts', icon: 'help-buoy-outline', route: '/doubts' },
      ],
      unreadNotifications: 0,
    },
    FOUNDATION: {
      studentName,
      preparationPath: 'FOUNDATION',
      examLabel: 'IIT Foundation · Class 9',
      daysToExam: 0,
      overallProgressPercent: 71,
      continueLearning: {
        subjectName: 'Science',
        chapterName: 'Motion & Force',
        topicName: 'Newton\u2019s Laws',
        progressPercent: 55,
        estimatedMinutesLeft: 15,
      },
      subjects: [
        { id: 'math', name: 'Mathematics', icon: 'calculator-outline', progressPercent: 76, accuracyPercent: 85, color: colors.accent },
        { id: 'sci', name: 'Science', icon: 'flask-outline', progressPercent: 69, accuracyPercent: 79, color: colors.success },
        { id: 'mat', name: 'Mental Ability', icon: 'bulb-outline', progressPercent: 64, accuracyPercent: 73, color: colors.primary },
      ],
      dailyGoal: { targetMinutes: 80, completedMinutes: 80, streakDays: 21 },
      performance: { overallAccuracy: 80, testsCompleted: 40, percentile: 93, weakestTopic: 'Algebraic Identities' },
      quickActions: [
        { id: 'practice', label: 'Practice', icon: 'create-outline', route: '/practice' },
        { id: 'mock', label: 'Mock Test', icon: 'timer-outline', route: '/tests' },
        { id: 'performance', label: 'Performance', icon: 'stats-chart-outline', route: '/performance' },
        { id: 'doubts', label: 'Doubts', icon: 'help-buoy-outline', route: '/doubts' },
      ],
      unreadNotifications: 2,
    },
  };

  return byPath[path];
}
