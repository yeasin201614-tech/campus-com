import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider, useAppTheme } from "@/context/ThemeContext";

function RootNavigator() {
  const { theme } = useAppTheme();

  return (
    <>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="notices" options={{ headerShown: true, title: "Notice Board" }} />
        <Stack.Screen name="marketplace" options={{ headerShown: true, title: "Marketplace" }} />
        <Stack.Screen name="groups/index" options={{ headerShown: true, title: "Campus Groups" }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: true, title: "Chat" }} />
        <Stack.Screen name="notifications" options={{ headerShown: true, title: "Notifications" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
