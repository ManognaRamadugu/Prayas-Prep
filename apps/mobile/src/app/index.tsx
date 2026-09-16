import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Dimensions,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function WelcomeScreen() {
  return (
    <LinearGradient
      colors={["#0B1020", "#111A35", "#172554"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>

          {/* Brand */}
          <View style={styles.brandContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>P</Text>
            </View>

            <Text style={styles.brandName}>PRAYAS PREP</Text>
            <Text style={styles.tagline}>
              Learn. Practice. Achieve.
            </Text>
          </View>

          {/* Main message */}
          <View style={styles.hero}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>YOUR JOURNEY STARTS HERE</Text>
            </View>

            <Text style={styles.title}>
              Prepare smarter.
              {"\n"}
              <Text style={styles.titleAccent}>Achieve more.</Text>
            </Text>

            <Text style={styles.description}>
              A focused preparation experience designed to help you
              learn consistently, practice effectively, and reach your goals.
            </Text>
          </View>

          {/* Bottom section */}
          <View style={styles.bottom}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.buttonText}>Get Started</Text>
              <Text style={styles.arrow}>→</Text>
            </Pressable>

            <View style={styles.features}>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>Learn</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.feature}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>Practice</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.feature}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>Achieve</Text>
              </View>
            </View>

            <Text style={styles.footer}>
              Built for ambitious learners
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },

  brandContainer: {
    alignItems: "center",
    paddingTop: 28,
  },

  logo: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  logoText: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111A35",
  },

  brandName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 3,
  },

  tagline: {
    color: "#AAB4D0",
    fontSize: 12,
    marginTop: 6,
    letterSpacing: 1,
  },

  hero: {
    alignItems: "center",
    marginTop: -20,
  },

  badge: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.07)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 22,
  },

  badgeText: {
    color: "#C7D2FE",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
  },

  title: {
    color: "#FFFFFF",
    fontSize: width > 380 ? 39 : 34,
    lineHeight: width > 380 ? 47 : 42,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -1,
  },

  titleAccent: {
    color: "#A5B4FC",
  },

  description: {
    color: "#B8C1D9",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    marginTop: 20,
    maxWidth: 340,
  },

  bottom: {
    paddingBottom: 22,
    alignItems: "center",
  },

  button: {
    width: "100%",
    height: 58,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },

  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },

  buttonText: {
    color: "#111A35",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  arrow: {
    color: "#111A35",
    fontSize: 22,
    fontWeight: "600",
    marginLeft: 10,
  },

  features: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
  },

  feature: {
    flexDirection: "row",
    alignItems: "center",
  },

  featureIcon: {
    color: "#A5B4FC",
    fontSize: 13,
    fontWeight: "800",
    marginRight: 5,
  },

  featureText: {
    color: "#C8D0E5",
    fontSize: 12,
    fontWeight: "600",
  },

  divider: {
    width: 1,
    height: 13,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 12,
  },

  footer: {
    color: "#7783A3",
    fontSize: 10,
    marginTop: 18,
    letterSpacing: 0.5,
  },
});