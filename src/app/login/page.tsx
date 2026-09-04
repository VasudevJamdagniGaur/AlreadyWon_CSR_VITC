"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { getFirebaseAuth, isFirebaseClientConfigured } from "@/lib/firebase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Mode = "signin" | "register";

function mapFirebaseError(code?: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Sign in instead.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Unable to authenticate with Firebase. Please try again.";
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "register" ? "register" : "signin"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("demo@kellyos.ai");
  const [password, setPassword] = useState("demo123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(searchParams.get("mode") === "register" ? "register" : "signin");
  }, [searchParams]);

  async function establishSession(idToken: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Unable to create app session.");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!isFirebaseClientConfigured()) {
        setError("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* to .env");
        return;
      }

      // Dynamic imports avoid Webpack `__webpack_require__.n` crashes with firebase/auth
      const [{ signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile }, auth] =
        await Promise.all([import("firebase/auth"), getFirebaseAuth()]);

      if (mode === "register") {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim() });
        }
        const idToken = await cred.user.getIdToken();
        await establishSession(idToken);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        const idToken = await cred.user.getIdToken();
        await establishSession(idToken);
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: string }).code)
          : undefined;
      const message =
        err instanceof Error && !code ? err.message : mapFirebaseError(code);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="mb-2">
          <Link href="/" className="text-lg font-semibold text-navy-900">
            KELLYOS
          </Link>
        </div>
        <CardTitle>{mode === "signin" ? "Sign in" : "Register"}</CardTitle>
        <CardDescription>
          {mode === "signin"
            ? "Sign in with Firebase Authentication for KellyOS."
            : "Create a KellyOS account with Firebase Authentication."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="CSR Manager"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={6}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? mode === "signin"
                ? "Signing in..."
                : "Creating account..."
              : mode === "signin"
                ? "Enter KellyOS"
                : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              Need an account?{" "}
              <button
                type="button"
                className="font-medium text-navy-900 underline-offset-4 hover:underline"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="font-medium text-navy-900 underline-offset-4 hover:underline"
                onClick={() => {
                  setMode("signin");
                  setError("");
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
