import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { TextInput, Button, Text, Card, Menu } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api";
import { API_CONFIG } from "../lib/constants";

const categories = [
  "allergy",
  "medication",
  "condition",
  "lab_result",
  "vaccination",
  "procedure",
  "appointment",
];

export default function AddHealthRecordScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    category: "",
    content: "",
    dateRecorded: "",
  });
  const [showMenu, setShowMenu] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return apiClient.post(API_CONFIG.ENDPOINTS.HEALTH_RECORDS, {
        Title: data.title,
        Category: data.category,
        Content: data.content,
        DateRecorded: data.dateRecorded ? new Date(data.dateRecorded) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthRecords"] });
      Alert.alert("Success", "Record added successfully");
      navigation.goBack();
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to add record"
      );
    },
  });

  const handleSubmit = () => {
    if (!form.title || !form.category || !form.content) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    createMutation.mutate(form);
  };

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Add Health Record" />
        <Card.Content>
          <TextInput
            label="Title *"
            value={form.title}
            onChangeText={(value) => updateForm("title", value)}
            style={styles.input}
          />
          <Menu
            visible={showMenu}
            onDismiss={() => setShowMenu(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setShowMenu(true)}
                style={styles.input}
              >
                {form.category || "Select Category *"}
              </Button>
            }
          >
            {categories.map((cat) => (
              <Menu.Item
                key={cat}
                onPress={() => {
                  updateForm("category", cat);
                  setShowMenu(false);
                }}
                title={cat.replace("_", " ")}
              />
            ))}
          </Menu>
          <TextInput
            label="Content *"
            value={form.content}
            onChangeText={(value) => updateForm("content", value)}
            multiline
            numberOfLines={4}
            style={styles.input}
          />
          <TextInput
            label="Date Recorded (YYYY-MM-DD)"
            value={form.dateRecorded}
            onChangeText={(value) => updateForm("dateRecorded", value)}
            placeholder="Optional"
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={createMutation.isPending}
            disabled={createMutation.isPending}
            style={styles.button}
          >
            Add Record
          </Button>
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={styles.button}
          >
            Cancel
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
  button: {
    marginTop: 10,
  },
});
