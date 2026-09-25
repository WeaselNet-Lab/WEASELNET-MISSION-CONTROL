"use client";

import { useState } from "react";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setPending(false);
    if (!response.ok) {
      setError("Sign-in failed. There is no default password and no open registration.");
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next") || "/";
    window.location.href = next.startsWith("/") ? next : "/";
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-16">
      <p className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase">WeaselNet</p>
      <h1 className="font-heading mt-2 text-4xl">Sign in</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        One owner. The account is created with the local provision command. Nothing here is a public account.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <label className="field-label">
          Username
          <input className="field-select" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
        </label>
        <label className="field-label">
          Password
          <input className="field-select" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
          {pending ? "Checking…" : "Enter Mission Control"}
        </button>
      </form>
    </main>
  );
}
