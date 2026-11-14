import React from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";

export default function IndexScreen() {
  const { session, loading } = useAuth();
  const { theme } = useAppTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.secondary} />
      </View>
    );
  }

  return <Redirect href={session ? "/(tabs)/home" : "/(auth)/login"} />;
}
