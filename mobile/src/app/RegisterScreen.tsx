import React, { useState } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import { TextInput, Button, Text, Card } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "./AppNavigator";
import { apiClient } from "../lib/api";
import { API_CONFIG } from "../lib/constants";

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Register"
>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [form, setForm] = useState({
    email: "",
    phoneNumber: "",
    password: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    bloodType: "",
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (
      !form.password ||
      !form.firstName ||
      !form.lastName ||
      (!form.email && !form.phoneNumber)
    ) {
      Alert.alert("Error", "Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.REGISTER, {
        ...form,
        dateOfBirth: new Date(form.dateOfBirth),
        // No hCaptcha for mobile
      });

      Alert.alert("Success", "Account created successfully");
      navigation.navigate("Login");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Register for MediChain" />
        <Card.Content>
          <TextInput
            label="Email (optional)"
            value={form.email}
            onChangeText={(value) => updateForm("email", value)}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <Text style={styles.orText}>OR</Text>
          <TextInput
            label="Phone Number (optional)"
            value={form.phoneNumber}
            onChangeText={(value) => updateForm("phoneNumber", value)}
            keyboardType="phone-pad"
            style={styles.input}
          />
          <TextInput
            label="First Name *"
            value={form.firstName}
            onChangeText={(value) => updateForm("firstName", value)}
            style={styles.input}
          />
          <TextInput
            label="Last Name *"
            value={form.lastName}
            onChangeText={(value) => updateForm("lastName", value)}
            style={styles.input}
          />
          <TextInput
            label="Date of Birth (YYYY-MM-DD)"
            value={form.dateOfBirth}
            onChangeText={(value) => updateForm("dateOfBirth", value)}
            placeholder="1990-01-01"
            style={styles.input}
          />
          <TextInput
            label="Blood Type"
            value={form.bloodType}
            onChangeText={(value) => updateForm("bloodType", value)}
            style={styles.input}
          />
          <TextInput
            label="Password *"
            value={form.password}
            onChangeText={(value) => updateForm("password", value)}
            secureTextEntry
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Register
          </Button>
          <Button
            mode="text"
            onPress={() => navigation.navigate("Login")}
            style={styles.button}
          >
            Already have an account? Login
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  card: {
    margin: 20,
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
