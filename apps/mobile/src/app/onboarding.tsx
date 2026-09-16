import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../lib/supabase";

const preparationOptions = [
  {
    id: "JEE",
    title: "JEE",
    subtitle: "Engineering Entrance",
    icon: "rocket-outline" as const,
  },
  {
    id: "NEET",
    title: "NEET",
    subtitle: "Medical Entrance",
    icon: "medical-outline" as const,
  },
  {
    id: "OTHER",
    title: "Other",
    subtitle: "Choose your preparation path",
    icon: "school-outline" as const,
  },
];

export default function OnboardingScreen() {
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (!selectedExam) {
      return;
    }

    try {
      setLoading(true);

      // Get the currently logged-in student
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert(
          "Session expired",
          "Please log in again."
        );

        router.replace("/login");
        return;
      }

      // Save the preparation path and complete onboarding
      const { error } = await supabase
        .from("student_profiles")
        .update({
          preparation_path: selectedExam,
          onboarding_completed: true,
        })
        .eq("user_id", user.id);

      if (error) {
        console.error("Onboarding save error:", error);

        Alert.alert(
          "Couldn't save your selection",
          "Please try again."
        );

        return;
      }

      // Go to Dashboard after successful save
      router.replace("/dashboard");
    } catch (error) {
      console.error("Unexpected onboarding error:", error);

      Alert.alert(
        "Something went wrong",
        "Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={["#07111F", "#0B1830", "#101B35"]}
      style={styles.container}
    >
      <View style={styles.content}>

        {/* Brand */}
        <View style={styles.brandContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>P</Text>
          </View>

          <Text style={styles.brand}>PRAYAS PREP</Text>
        </View>

        {/* Heading */}
        <View style={styles.headingContainer}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>STEP 1 OF 1</Text>
          </View>

          <Text style={styles.title}>
            Let's personalize{"\n"}your preparation.
          </Text>

          <Text style={styles.subtitle}>
            Tell us what you're preparing for so we
            can create the right learning experience for you.
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionLabel}>
            CHOOSE YOUR PATH
          </Text>

          {preparationOptions.map((option) => {
            const isSelected = selectedExam === option.id;

            return (
              <Pressable
                key={option.id}
                onPress={() => setSelectedExam(option.id)}
                style={[
                  styles.option,
                  isSelected && styles.selectedOption,
                ]}
              >
                <View
                  style={[
                    styles.optionIcon,
                    isSelected && styles.selectedOptionIcon,
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={23}
                    color={isSelected ? "#FFFFFF" : "#8B98AD"}
                  />
                </View>

                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>
                    {option.title}
                  </Text>

                  <Text style={styles.optionSubtitle}>
                    {option.subtitle}
                  </Text>
                </View>

                <View
                  style={[
                    styles.radio,
                    isSelected && styles.selectedRadio,
                  ]}
                >
                  {isSelected && (
                    <View style={styles.radioDot} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Continue */}
        <View>
          <Pressable
            onPress={handleContinue}
            disabled={!selectedExam || loading}
            style={({ pressed }) => [
              styles.continueButton,
              (!selectedExam || loading) &&
                styles.disabledButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={["#4F8CFF", "#6C5CE7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.continueText}>
                    Continue
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#FFFFFF"
                  />
                </>
              )}
            </LinearGradient>
          </Pressable>

          <Text style={styles.footerText}>
            You can personalize more settings later.
          </Text>
        </View>

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 60,
    paddingBottom: 30,
    justifyContent: "space-between",
  },

  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  logo: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  logoText: {
    fontSize: 25,
    fontWeight: "800",
    color: "#111827",
  },

  brand: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 2,
  },

  headingContainer: {
    marginTop: 20,
  },

  stepBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(79,140,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(79,140,255,0.25)",
    marginBottom: 14,
  },

  stepText: {
    color: "#7EA7FF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 39,
    letterSpacing: -0.8,
  },

  subtitle: {
    color: "#9AA7BA",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },

  optionsContainer: {
    marginTop: 15,
  },

  sectionLabel: {
    color: "#7F8CA1",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginBottom: 12,
  },

  option: {
    minHeight: 76,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.055)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 11,
  },

  selectedOption: {
    borderColor: "#4F8CFF",
    backgroundColor: "rgba(79,140,255,0.11)",
  },

  optionIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    justifyContent: "center",
    alignItems: "center",
  },

  selectedOptionIcon: {
    backgroundColor: "#4F8CFF",
  },

  optionTextContainer: {
    flex: 1,
    marginLeft: 13,
  },

  optionTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  optionSubtitle: {
    color: "#8794A8",
    fontSize: 12,
    marginTop: 3,
  },

  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#68758A",
    justifyContent: "center",
    alignItems: "center",
  },

  selectedRadio: {
    borderColor: "#4F8CFF",
  },

  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#4F8CFF",
  },

  continueButton: {
    borderRadius: 16,
    overflow: "hidden",
  },

  continueGradient: {
    height: 58,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  continueText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  disabledButton: {
    opacity: 0.4,
  },

  buttonPressed: {
    opacity: 0.8,
  },

  footerText: {
    color: "#68758A",
    fontSize: 11,
    textAlign: "center",
    marginTop: 12,
  },
});
