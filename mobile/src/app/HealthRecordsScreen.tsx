import React from "react";
import { View, StyleSheet, FlatList, Alert } from "react-native";
import { Text, Button, Card, FAB, ActivityIndicator } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api";
import { API_CONFIG } from "../lib/constants";

interface HealthRecord {
  RecordID: string;
  Title: string;
  Category: string;
  Content: string;
  DateRecorded: string;
  CreatedAt: string;
  Files: any[];
}

export default function HealthRecordsScreen() {
  const navigation = useNavigation();

  const {
    data: records,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["healthRecords"],
    queryFn: async () => {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.HEALTH_RECORDS);
      return response.data as HealthRecord[];
    },
  });

  const renderRecord = ({ item }: { item: HealthRecord }) => (
    <Card style={styles.card} onPress={() => handleRecordPress(item)}>
      <Card.Title title={item.Title} subtitle={item.Category} />
      <Card.Content>
        <Text variant="bodyMedium">{item.Content.substring(0, 100)}...</Text>
        <Text variant="bodySmall" style={styles.date}>
          {new Date(item.DateRecorded || item.CreatedAt).toLocaleDateString()}
        </Text>
      </Card.Content>
    </Card>
  );

  const handleRecordPress = (record: HealthRecord) => {
    // TODO: Navigate to detail/edit screen
    Alert.alert("Record", record.Title);
  };

  const handleAddRecord = () => {
    navigation.navigate("AddHealthRecord" as never);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>Error loading records</Text>
        <Button onPress={() => refetch()}>Retry</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={records}
        renderItem={renderRecord}
        keyExtractor={(item) => item.RecordID}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text>No health records found</Text>
            <Button onPress={handleAddRecord}>Add Your First Record</Button>
          </View>
        }
      />
      <FAB icon="plus" onPress={handleAddRecord} style={styles.fab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  list: {
    padding: 10,
  },
  card: {
    marginBottom: 10,
  },
  date: {
    marginTop: 5,
    color: "#666",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
