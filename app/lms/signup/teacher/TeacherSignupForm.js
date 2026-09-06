"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "@/app/lms/lms.module.css";

/**
 * Two steps in one component:
 *   request — name + email, which sends a code to the NGO office
 *   verify  — the code the office passed on, plus a password
 *
 * The applicant never receives the code by email; that is the point.
 */
export default function TeacherSignupForm() {
  const router = useRouter();
  const [step, setStep] = useState("request");
  const [form, setForm] = useState({ fullName: "", email: "", code: "", password: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function post(url, body) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).catch(() => null);

    if (!response) {
      return { ok: false, payload: { error: "Could not reach the server. Try again." } };
    }
    const payload = await response.json().catch(() => ({}));
    return { ok: response.ok, payload };
  }

  async function handleRequest(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const { ok, payload } = await post("/api/auth/teacher-request", {
      fullName: form.fullName,
      email: form.email
    });

    setBusy(false);

    if (!ok) {
      setError(payload.error || "Something went wrong. Please try again.");
      return;
    }
    setStep("verify");
  }

  async function handleVerify(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const { ok, payload } = await post("/api/auth/teacher-verify", {
      email: form.email,
      code: form.code,
      password: form.password
    });

    if (!ok) {
      setError(payload.error || "Something went wrong. Please try again.");
      setBusy(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password
    });

    if (signInError) {
      router.replace("/lms/login");
      return;
    }

    router.replace("/lms/teacher");
    router.refresh();
  }

  if (step === "verify") {
    return (
      <form onSubmit={handleVerify} noValidate>
        <p className={`${styles.alert} ${styles.alertInfo}`}>
          An approval code has been sent to the NGO office for <strong>{form.email}</strong>. Ask
          the office for the code, then enter it here. It expires in 15 minutes.
        </p>

        {error ? <p className={`${styles.alert} ${styles.alertError}`}>{error}</p> : null}

        <label className={styles.field}>
          <span className={styles.label}>Approval code</span>
          <input
            className={`${styles.input} ${styles.codeInput}`}
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            value={form.code}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, code: event.target.value.replace(/\D/g, "") }))
            }
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
          {busy ? "Checking…" : "Create teacher account"}
        </button>

        <p className={styles.switcher}>
          <button
            className={styles.linkBtn}
            type="button"
            onClick={() => {
              setStep("request");
              setError(null);
            }}
          >
            Start over
          </button>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequest} noValidate>
      {error ? <p className={`${styles.alert} ${styles.alertError}`}>{error}</p> : null}

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
        <span className={styles.label}>
          Email
          <span className={styles.hint}>You will sign in with this address.</span>
        </span>
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

      <button className={styles.submit} type="submit" disabled={busy}>
        {busy ? "Sending…" : "Request approval"}
      </button>
    </form>
  );
}
