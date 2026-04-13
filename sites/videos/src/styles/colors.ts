// Observatory color theme — dark mode
export const dark = {
  bg: "#0a0a0a",
  bgCard: "#141414",
  bgTerminal: "#1a1a1a",
  border: "#2a2a2a",
  borderLight: "#333",
  amber: "#e0af40",
  cyan: "#5bbcd6",
  green: "#7dcea0",
  textPrimary: "#f0f0f0",
  textSecondary: "#999",
  textMuted: "#666",
  textDim: "#444",
  terminalGreen: "#7dcea0",
  terminalAmber: "#e0af40",
  terminalCyan: "#5bbcd6",
  terminalRed: "#e06c75",
  terminalWhite: "#abb2bf",
} as const;

// Observatory color theme — light mode (hybrid: light bg, dark terminals)
export const light = {
  bg: "#F9FAFB",
  bgCard: "#FFFFFF",
  bgTerminal: "#1a1a1a", // terminals stay dark
  border: "#E5E7EB",
  borderLight: "#D1D5DB",
  amber: "#C4961E", // slightly deeper for light-bg contrast
  cyan: "#2A8FA8", // deeper cyan for readability
  green: "#4BA376", // deeper green
  textPrimary: "#1C2433",
  textSecondary: "#4B5568",
  textMuted: "#6B7280",
  textDim: "#9CA3AF",
  terminalGreen: "#7dcea0",
  terminalAmber: "#e0af40",
  terminalCyan: "#5bbcd6",
  terminalRed: "#e06c75",
  terminalWhite: "#abb2bf",
} as const;

// Default export — dark mode (backwards compatible)
export const colors = dark;
