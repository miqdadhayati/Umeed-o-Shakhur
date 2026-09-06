"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import styles from "@/app/lms/lms.module.css";

function SubmitButton({ label, inline }) {
  const { pending } = useFormStatus();
  return (
    <button
      className={`${styles.submit} ${inline ? styles.inlineSubmit : ""}`}
      type="submit"
      disabled={pending}
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

/**
 * Wraps a Server Action with inline success/error feedback.
 *
 * The form posts natively, so it still works if the JavaScript bundle hasn't
 * loaded — only the status message needs the client.
 */
export default function ActionForm({ action, label, children, inline = false, successText }) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction}>
      {state?.error ? <p className={`${styles.alert} ${styles.alertError}`}>{state.error}</p> : null}
      {state?.ok && successText ? (
        <p className={`${styles.alert} ${styles.alertSuccess}`}>{successText}</p>
      ) : null}
      {children}
      <SubmitButton label={label} inline={inline} />
    </form>
  );
}
