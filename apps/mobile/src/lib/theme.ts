export const LIGHT_THEME = {
  isDark: false,
  primary: "#101B62",
  secondary: "#6038ED",
  accent: "#19B99A",
  background: "#F7F8FC",
  card: "#FFFFFF",
  text: "#101B62",
  muted: "#64748B",
  border: "#E2E8F0",
  danger: "#EF4444",
};

export const DARK_THEME = {
  isDark: true,
  primary: "#734FF1",
  secondary: "#6038ED",
  accent: "#19B99A",
  background: "#090D24",
  card: "#11173B",
  text: "#F8FAFC",
  muted: "#94A3B8",
  border: "#232C5C",
  danger: "#F87171",
};

export type AppTheme = typeof LIGHT_THEME;
