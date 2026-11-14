import React, { createContext, useContext, useState } from "react";
import { DARK_THEME, LIGHT_THEME, type AppTheme } from "@/lib/theme";

interface ThemeContextValue {
  theme: AppTheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: LIGHT_THEME,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);

  return (
    <ThemeContext.Provider
      value={{
        theme: dark ? DARK_THEME : LIGHT_THEME,
        toggleTheme: () => setDark((d) => !d),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
