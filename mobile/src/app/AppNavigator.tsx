import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import LoginScreen from "./LoginScreen";
import RegisterScreen from "./RegisterScreen";
import HomeScreen from "./HomeScreen";
import HealthRecordsScreen from "./HealthRecordsScreen";
import AddHealthRecordScreen from "./AddHealthRecordScreen";

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  HealthRecords: undefined;
  HealthRecordsList: undefined;
  AddHealthRecord: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="HealthRecords" component={HealthRecordsStack} />
    </Tab.Navigator>
  );
}

function HealthRecordsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HealthRecordsList"
        component={HealthRecordsScreen}
        options={{ title: "Health Records" }}
      />
      <Stack.Screen
        name="AddHealthRecord"
        component={AddHealthRecordScreen}
        options={{ title: "Add Record" }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Auth"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Auth" component={AuthStack} />
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
