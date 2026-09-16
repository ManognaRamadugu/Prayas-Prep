
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  router,
  useRootNavigationState,
  useSegments,
} from "expo-router";

import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";

import { supabase } from "../../lib/supabase";
import { isOnboardingComplete } from "../../lib/auth";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load the current Supabase session
  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);
      setLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Handle authentication and onboarding navigation
  useEffect(() => {
    // Wait until everything required for navigation is ready
    if (loading || !rootNavigationState?.key) {
      return;
    }

    let cancelled = false;

    async function handleNavigation() {
      const firstSegment = segments[0];

      // User is not logged in
      if (!session) {
        if (
          firstSegment !== "login" &&
          firstSegment !== "register"
        ) {
          router.replace("/login");
        }

        return;
      }

      // User is logged in — check onboarding
      const onboardingComplete = await isOnboardingComplete(
        session.user.id
      );

      // Component/effect may no longer be active
      if (cancelled) return;

      if (!onboardingComplete) {
        if (firstSegment !== "onboarding") {
          router.replace("/onboarding");
        }
      } else {
        if (
          firstSegment === "login" ||
          firstSegment === "register" ||
          firstSegment === "onboarding" ||
          !firstSegment
        ) {
          router.replace("/dashboard");
        }
      }
    }

    handleNavigation();

    return () => {
      cancelled = true;
    };
  }, [session, loading, segments, rootNavigationState?.key]);

  if (loading || !rootNavigationState?.key) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider
      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="login"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="register"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="dashboard"
          options={{ headerShown: false }}
        />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

