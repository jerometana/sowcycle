import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    setBusy(false);
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.card}>
        <Text style={s.title}>SowCycle</Text>
        <TextInput
          style={s.input}
          placeholder="อีเมล"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          textContentType="emailAddress"
          returnKeyType="next"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={s.input}
          placeholder="รหัสผ่าน"
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={signIn}
        />
        {error && <Text style={s.error}>{error}</Text>}
        <Pressable
          style={({ pressed }) => [s.button, pressed && { opacity: 0.8 }]}
          onPress={signIn}
          disabled={busy}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>เข้าสู่ระบบ</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: "center", backgroundColor: "#f5f5f4", padding: 24 },
  card: { gap: 12 },
  title: { fontSize: 32, fontWeight: "700", textAlign: "center", marginBottom: 16 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  error: { color: "#dc2626", textAlign: "center" },
  button: {
    backgroundColor: "#ec4899",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
});
