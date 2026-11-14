import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useAppTheme } from "@/context/ThemeContext";

export function BrandLogo({ size = 40, showTagline = false }: { size?: number; showTagline?: boolean }) {
  const { theme } = useAppTheme();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Path
          d="M32 17L52 24.5V41.5C52 48.2 43.2 55 32 59C20.8 55 12 48.2 12 41.5V24.5L32 17Z"
          fill="#101B62"
        />
        <Path
          d="M39.5 32.5C38.4 30.1 35.8 28.6 32.6 28.6C27.9 28.6 24.4 32.1 24.4 36.8C24.4 41.5 27.9 45 32.6 45C36 45 38.7 43.4 39.8 40.8L44.6 42.6C42.7 47.2 38.2 50 32.5 50C24.8 50 19.2 44.5 19.2 36.8C19.2 29.1 24.8 23.6 32.5 23.6C38.1 23.6 42.5 26.3 44.4 30.6L39.5 32.5Z"
          fill="#FFFFFF"
        />
        <Path d="M32 5L55 14L32 23L9 14L32 5Z" fill="#6038ED" />
        <Path d="M13 15.5V26" stroke="#19B99A" strokeWidth={2.6} strokeLinecap="round" />
        <Circle cx="13" cy="27.5" r={2.2} fill="#19B99A" />
      </Svg>

      <View>
        <Text style={{ fontSize: 20, fontWeight: "800", color: theme.text }}>
          Campus<Text style={{ color: "#6038ED" }}>.com</Text>
        </Text>
        {showTagline && (
          <Text style={{ fontSize: 11, color: theme.muted }}>
            Connect • Collaborate • Grow
          </Text>
        )}
      </View>
    </View>
  );
}
