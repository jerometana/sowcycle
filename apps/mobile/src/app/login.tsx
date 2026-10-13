import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Button } from "../components/ui";
import { supabase } from "../lib/supabase";
import { color, Text, TextInput } from "../theme";

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
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Image source={require("../../assets/logo.png")} style={s.logo} />
          <Text style={s.title}>Login to SowCycle</Text>
          <View style={s.field}>
            <Text style={s.label}>Email Address</Text>
            <TextInput
              style={s.input}
              placeholder="yourname@example.com"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              textContentType="emailAddress"
              keyboardType="email-address"
              returnKeyType="next"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <TextInput
              style={s.input}
              placeholder="Enter your password"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={signIn}
            />
          </View>
          {error && <Text style={s.error}>{error}</Text>}
          <Button title="Login" onPress={signIn} busy={busy} />
        </View>
        <Text style={s.terms}>By continuing, you agree to our Terms of Service and Privacy Policy</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.background },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 16, gap: 16 },
  card: { backgroundColor: color.card, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 32, gap: 16 },
  logo: { width: 64, height: 64, borderRadius: 16, alignSelf: "center" },
  title: { fontSize: 30, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  input: { borderWidth: 1, borderColor: color.border, borderRadius: 999, paddingHorizontal: 16, height: 44, fontSize: 16 },
  error: { color: color.destructive, textAlign: "center" },
  terms: { textAlign: "center", color: color.mutedForeground, fontSize: 13, paddingHorizontal: 24 },
});
