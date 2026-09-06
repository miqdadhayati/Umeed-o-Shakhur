"use client";

import { useState } from "react";
import styles from "@/components/ContactForm.module.css";

// Posts to Netlify Forms. Detection is handled by the static stub in
// public/__forms.html (App Router pages are not visible to Netlify's
// build-time form scanner, so the stub declares the fields instead).
const FORM_NAME = "contact";

function encode(data) {
  return Object.keys(data)
    .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
    .join("&");
}

export default function ContactForm() {
  const [status, setStatus] = useState("idle");
  const [values, setValues] = useState({
    name: "",
    email: "",
    interest: "General enquiry",
    message: "",
    "bot-field": "",
  });

  function update(event) {
    const next = { ...values };
    next[event.target.name] = event.target.value;
    setValues(next);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // Honeypot: if filled, silently treat as success and drop the submission.
    if (values["bot-field"]) {
      setStatus("success");
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode({ "form-name": FORM_NAME, ...values }),
      });

      if (response.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className={styles.success} role="status">
        <h3>Message received.</h3>
        <p>Thank you for reaching out. We read every message and will get back to you.</p>
      </div>
    );
  }

  return (
    <form
      name={FORM_NAME}
      method="POST"
      data-netlify="true"
      netlify-honeypot="bot-field"
      onSubmit={handleSubmit}
      className={styles.form}
    >
      <p className={styles.hidden} aria-hidden="true">
        <label>
          Do not fill this in:
          <input name="bot-field" value={values["bot-field"]} onChange={update} tabIndex={-1} autoComplete="off" />
        </label>
      </p>

      <div className={styles.field}>
        <label htmlFor="name">Your name</label>
        <input id="name" name="name" type="text" required value={values.name} onChange={update} />
      </div>

      <div className={styles.field}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required value={values.email} onChange={update} />
      </div>

      <div className={styles.field}>
        <label htmlFor="interest">I am writing about</label>
        <select id="interest" name="interest" value={values.interest} onChange={update}>
          <option>General enquiry</option>
          <option>Volunteering</option>
          <option>Partnership or sponsorship</option>
          <option>Media or press</option>
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" rows={5} required value={values.message} onChange={update} />
      </div>

      {status === "error" ? (
        <p className={styles.error} role="alert">
          Something went wrong sending your message. Please email us directly and we will pick it up.
        </p>
      ) : null}

      <button type="submit" className={styles.submit} disabled={status === "submitting"}>
        {status === "submitting" ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
