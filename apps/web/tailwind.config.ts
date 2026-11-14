import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#101B62",
          50: "#EEF1FA",
          100: "#D7DDF4",
          600: "#1D2C87",
          700: "#162371",
          800: "#101B62",
          900: "#0A1142",
          950: "#060B2B",
        },
        purple: {
          DEFAULT: "#6038ED",
          50: "#F3EFFE",
          100: "#E4DCFD",
          500: "#734FF1",
          600: "#6038ED",
          700: "#4E24D6",
        },
        teal: {
          DEFAULT: "#19B99A",
          50: "#E8FBF7",
          500: "#19B99A",
          600: "#129C81",
        },
        campus: {
          bg: "#F7F8FC",
          surface: "#FFFFFF",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        campus: "0 10px 30px -12px rgba(16, 27, 98, 0.10)",
        "campus-lg": "0 20px 50px -15px rgba(16, 27, 98, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
