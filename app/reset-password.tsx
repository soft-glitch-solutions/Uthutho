import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{ access_token?: string }>();
  const tokenFromParams = params.access_token || null;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Track if we have a valid session (web) or token (mobile)
  const [hasBrowserSession, setHasBrowserSession] = useState(false);
  const [availableToken, setAvailableToken] = useState<string | null>(null);

  // --- On mount: handle Supabase web reset flow ---
  useEffect(() => {
    const handleWebSession = async () => {
      if (Platform.OS === "web") {
        try {
          console.log("[ResetPassword] Running web session flow...");
          const { data, error } = await supabase.auth.getSessionFromUrl({
            storeSession: true,
          });
          if (error) {
            console.error("[ResetPassword] Web session error:", error.message);
          } else if (data?.session) {
            console.log("[ResetPassword] Web session established ✅");
            setHasBrowserSession(true);
          }
        } catch (err) {
          console.error("[ResetPassword] Web getSessionFromUrl failed:", err);
        }
      } else {
        // On mobile, store token from deep link
        if (tokenFromParams) {
          console.log("[ResetPassword] Mobile token detected ✅", tokenFromParams);
          setAvailableToken(tokenFromParams);
        }
      }
    };

    handleWebSession();
  }, [tokenFromParams]);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (Platform.OS === "web") {
        // ✅ Web: Supabase already has session from URL
        if (!hasBrowserSession) {
          Alert.alert("Error", "No active reset session. Try the link again.");
          return;
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      } else {
        // ✅ Mobile: Pass the token manually
        if (!availableToken) {
          Alert.alert("Error", "No reset token found. Try again.");
          return;
        }
        const { error } = await supabase.auth.updateUser(
          { password },
          { accessToken: availableToken }
        );
        if (error) throw error;
      }

      Alert.alert("Success", "Password updated successfully.");
      router.replace("/auth");
    } catch (err: any) {
      console.error("[ResetPassword] Error:", err.message);
      Alert.alert("Error", err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  // Fallback UI if no session or token
  if (Platform.OS === "web" && !hasBrowserSession) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          No reset token or session detected. If you clicked the link in an email, 
          try opening it directly in your browser or request a new reset email.
        </Text>
        <TouchableOpacity onPress={() => router.replace("/auth")}>
          <Text style={styles.loginLink}>← Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (Platform.OS !== "web" && !availableToken) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          Invalid or missing reset token. Please request a new password reset email.
        </Text>
        <TouchableOpacity onPress={() => router.replace("/auth")}>
          <Text style={styles.loginLink}>← Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Enter your new password:</Text>
      <TextInput
        style={styles.input}
        placeholder="New Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Reset Password" onPress={handleResetPassword} />
      )}
      <TouchableOpacity onPress={() => router.replace("/auth")}>
        <Text style={styles.loginLink}>← Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  loginLink: {
    marginTop: 16,
    textAlign: "center",
    color: "#1ea2b1",
    fontWeight: "500",
  },
});
