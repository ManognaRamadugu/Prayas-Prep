import React, { useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing details", "Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert("Login failed", error.message);
        return;
      }

      router.replace("/onboarding");
    } catch (error) {
      Alert.alert("Something went wrong", "Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

          {/* Brand */}
          <View style={styles.brandContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>P</Text>
            </View>

            <Text style={styles.brand}>PRAYAS PREP</Text>
          </View>

          {/* Heading */}
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Welcome back.</Text>

            <Text style={styles.subtitle}>
              Continue your preparation journey.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>

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
                style={styles.input}
              />
            </View>

            {/* Password */}
            <Text style={[styles.label, styles.passwordLabel]}>
              PASSWORD
            </Text>

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
                placeholder="Enter your password"
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

            {/* Forgot password */}
            <Pressable style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            {/* Login button */}
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <LinearGradient
                colors={["#4F8CFF", "#6C5CE7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginGradient}
              >
                <Text style={styles.loginText}>
                  {loading ? "Signing in..." : "Sign In"}
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

          {/* Register */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>
              Don't have an account?
            </Text>

            <Pressable onPress={() => router.push("/register")}>
              <Text style={styles.registerLink}>Create account</Text>
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
    paddingTop: 70,
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
    marginTop: 30,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
  },

  subtitle: {
    color: "#9AA7BA",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
  },

  form: {
    marginTop: 20,
  },

  label: {
    color: "#9AA7BA",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.3,
    marginBottom: 9,
  },

  passwordLabel: {
    marginTop: 20,
  },

  inputContainer: {
    height: 58,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    flexDirection: "row",
    alignItems: "center",
  },

  inputIcon: {
    marginLeft: 17,
  },

  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    paddingHorizontal: 13,
    height: "100%",
  },

  eyeButton: {
    paddingHorizontal: 16,
  },

  forgotButton: {
    alignSelf: "flex-end",
    marginTop: 13,
  },

  forgotText: {
    color: "#7EA7FF",
    fontSize: 13,
    fontWeight: "600",
  },

  loginButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: "hidden",
  },

  loginGradient: {
    height: 58,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  loginText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  buttonPressed: {
    opacity: 0.8,
  },

  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },

  registerText: {
    color: "#7F8CA1",
    fontSize: 14,
  },

  registerLink: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});