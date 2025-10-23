import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { TextInput, Button, Text, Card } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "./AppNavigator";
import { apiClient, apiHelpers } from "../lib/api";
import { API_CONFIG } from "../lib/constants";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password || (!email && !phone)) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.LOGIN, {
        email: email || undefined,
        phoneNumber: phone || undefined,
        password,
        // No hCaptcha for mobile
      });

      // Store token
      await apiHelpers.setToken(response.data.token);
      Alert.alert("Success", "Logged in successfully");
      navigation.navigate("Main");
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Login to MediChain" />
        <Card.Content>
          <TextInput
            label="Email (optional)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <Text style={styles.orText}>OR</Text>
          <TextInput
            label="Phone Number (optional)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.input}
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Login
          </Button>
          <Button
            mode="text"
            onPress={() => navigation.navigate("Register")}
            style={styles.button}
          >
            Don't have an account? Register
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  card: {
    padding: 10,
  },
  input: {
    marginBottom: 10,
  },
  orText: {
    textAlign: "center",
    marginVertical: 10,
    fontSize: 16,
  },
  button: {
    marginTop: 10,
  },
});
