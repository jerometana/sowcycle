import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from "react-native";

// Tokens from the web app's src/app/globals.css (light theme).
export const color = {
  background: "#f5f5f5",
  card: "#ffffff",
  foreground: "#0a0a0a",
  primary: "#ec4899",
  primaryForeground: "#fafafa",
  secondary: "#f5f5f5",
  muted: "#f5f5f5",
  mutedForeground: "#737373",
  iconSquare: "#f3f4f6",
  border: "#e5e5e5",
  destructive: "#ef4444",
  gray600: "#4b5563",
  gray900: "#111827",
  amber: "#f59e0b",
  green: "#16a34a",
  orange: "#ea580c",
  blue: "#3b82f6",
  purple: "#a855f7",
} as const;

export const fonts = {
  "400": "IBMPlexSansThai_400Regular",
  "500": "IBMPlexSansThai_500Medium",
  "600": "IBMPlexSansThai_600SemiBold",
  "700": "IBMPlexSansThai_700Bold",
} as const;

const familyFor = (weight: TextStyle["fontWeight"]) => {
  if (weight === "bold" || weight === "700" || weight === 700 || weight === "800" || weight === 800) return fonts["700"];
  if (weight === "600" || weight === 600) return fonts["600"];
  if (weight === "500" || weight === 500) return fonts["500"];
  return fonts["400"];
};

// Custom fonts need one file per weight; fontWeight alone would fall back to a synthetic or system face.
export function Text({ style, ...props }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  return <RNText {...props} style={[s.text, style, { fontFamily: familyFor(flat.fontWeight), fontWeight: undefined }]} />;
}

export function TextInput({ style, ...props }: TextInputProps) {
  return <RNTextInput placeholderTextColor={color.mutedForeground} {...props} style={[s.input, style]} />;
}

const s = StyleSheet.create({
  text: { color: color.foreground, fontSize: 16 },
  input: { fontFamily: fonts["400"], color: color.foreground },
});
