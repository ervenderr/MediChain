import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { apiHelpers } from "../lib/api";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "./AppNavigator";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleLogout = async () => {
    await apiHelpers.clearToken();
    navigation.navigate("Auth");
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Welcome to MediChain</Text>
      <Text variant="bodyLarge">Mobile App Home Screen</Text>
      <Button mode="outlined" onPress={handleLogout} style={styles.button}>
        Logout
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  button: {
    marginTop: 20,
  },
});
