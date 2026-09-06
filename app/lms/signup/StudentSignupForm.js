"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "@/app/lms/lms.module.css";

export default function StudentSignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ joinCode: "", fullName: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch("/api/auth/student-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    }).catch(() => null);

    if (!response) {
      setError("Could not reach the server. Check your connection and try again.");
      setBusy(false);
      return;
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.error || "Something went wrong. Please try again.");
      setBusy(false);
      return;
    }

    // The account exists but the browser has no session yet — sign in so the
    // student lands straight in the portal instead of at a second form.
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password
    });

    if (signInError) {
      router.replace("/lms/login");
      return;
    }

    router.replace("/lms/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error ? <p className={`${styles.alert} ${styles.alertError}`}>{error}</p> : null}

      <label className={styles.field}>
        <span className={styles.label}>
          Class code
          <span className={styles.hint}>The code your teacher read out at camp.</span>
        </span>
        <input
          className={`${styles.input} ${styles.codeInput}`}
          name="joinCode"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={10}
          required
          value={form.joinCode}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, joinCode: event.target.value.toUpperCase() }))
          }
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Your full name</span>
        <input
          className={styles.input}
          name="fullName"
          autoComplete="name"
          required
          value={form.fullName}
          onChange={update("fullName")}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Email</span>
        <input
          className={styles.input}
          type="email"
          name="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={update("email")}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>
          Choose a password
          <span className={styles.hint}>At least 8 characters.</span>
        </span>
        <input
          className={styles.input}
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={form.password}
          onChange={update("password")}
        />
      </label>

      <button className={styles.submit} type="submit" disabled={busy}>
        {busy ? "Joining…" : "Join class"}
      </button>
    </form>
  );
}
