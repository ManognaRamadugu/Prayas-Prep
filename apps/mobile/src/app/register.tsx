
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert("Missing details", "Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Invalid password",
        "Password must be at least 6 characters long."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match", "Please enter the same password.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        Alert.alert("Registration failed", error.message);
        return;
      }

      if (data.session) {
        router.replace("/dashboard");
      } else {
        Alert.alert(
          "Registration successful 🎉",
          "Please check your email and confirm your account before logging in.",
          [
            {
              text: "Go to Login",
              onPress: () => router.replace("/login"),
            },
          ]
        );
      }
    } catch {
      Alert.alert(
        "Something went wrong",
        "Unable to create your account. Please try again."
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.content}>

          {/* Header */}
          <View>
            <View style={styles.brandContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>P</Text>
              </View>

              <Text style={styles.brand}>PRAYAS PREP</Text>
            </View>

            <View style={styles.headingContainer}>
              <Text style={styles.title}>Create your account.</Text>

              <Text style={styles.subtitle}>
                Start building your preparation journey.
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>

            {/* Full Name */}
            <Text style={styles.label}>FULL NAME</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#8B98AD"
                style={styles.inputIcon}
              />

              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#68758A"
                autoCapitalize="words"
                style={styles.input}
              />
            </View>

            {/* Email */}
            <Text style={styles.label}>EMAIL</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#8B98AD"
                style={styles.inputIcon}
              />

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#68758A"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            {/* Password */}
            <Text style={styles.label}>PASSWORD</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#8B98AD"
                style={styles.inputIcon}
              />

              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                placeholderTextColor="#68758A"
                secureTextEntry={!showPassword}
                style={styles.input}
              />

              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={21}
                  color="#8B98AD"
                />
              </Pressable>
            </View>

            {/* Confirm Password */}
            <Text style={styles.label}>CONFIRM PASSWORD</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#8B98AD"
                style={styles.inputIcon}
              />

              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                placeholderTextColor="#68758A"
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
              />

              <Pressable
                onPress={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                style={styles.eyeButton}
              >
                <Ionicons
                  name={
                    showConfirmPassword
                      ? "eye-outline"
                      : "eye-off-outline"
                  }
                  size={21}
                  color="#8B98AD"
                />
              </Pressable>
            </View>

            {/* Create Account */}
            <Pressable
              onPress={handleRegister}
              disabled={loading}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
            >
              <LinearGradient
                colors={["#4F8CFF", "#6C5CE7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Text>

                {!loading && (
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#FFFFFF"
                  />
                )}
              </LinearGradient>
            </Pressable>
          </View>

          {/* Login */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              Already have an account?
            </Text>

            <Pressable onPress={() => router.push("/login")}>
              <Text style={styles.loginLink}>Sign in</Text>
            </Pressable>
          </View>

        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  keyboardView: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 28,
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
    marginTop: 28,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1,
  },

  subtitle: {
    color: "#9AA7BA",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 9,
  },

  form: {
    marginTop: 16,
  },

  label: {
    color: "#9AA7BA",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.3,
    marginTop: 15,
    marginBottom: 8,
  },

  inputContainer: {
    height: 54,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    flexDirection: "row",
    alignItems: "center",
  },

  inputIcon: {
    marginLeft: 16,
  },

  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    paddingHorizontal: 12,
    height: "100%",
  },

  eyeButton: {
    paddingHorizontal: 15,
  },

  button: {
    marginTop: 23,
    borderRadius: 16,
    overflow: "hidden",
  },

  buttonGradient: {
    height: 57,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  buttonPressed: {
    opacity: 0.8,
  },

  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },

  loginText: {
    color: "#7F8CA1",
    fontSize: 14,
  },

  loginLink: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});