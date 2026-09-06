import "server-only";
import crypto from "node:crypto";

/**
 * Shared plumbing for the two signup gates: throttling, code generation,
 * constant-time verification, and the notification email to the NGO.
 */

// ---------------------------------------------------------------------------
// Codes
// ---------------------------------------------------------------------------

// Excludes 0/O/1/I/L — these get read aloud in a room and written on a board.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateJoinCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

/** Six digits, uniformly distributed (rejection sampling, no modulo bias). */
export function generateOtp() {
  let value;
  do {
    value = crypto.randomBytes(4).readUInt32BE(0);
  } while (value >= 4294967290); // largest multiple of 10 below 2^32
  return String(value % 1000000).padStart(6, "0");
}

export function hashCode(code) {
  return crypto.createHash("sha256").update(String(code).trim()).digest("hex");
}

/** Timing-safe comparison, so a wrong code leaks nothing about the right one. */
export function verifyCode(candidate, storedHash) {
  const a = Buffer.from(hashCode(candidate), "hex");
  const b = Buffer.from(String(storedHash || ""), "hex");
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// Throttling
// ---------------------------------------------------------------------------

/**
 * Fixed-window counter kept in Postgres (so it survives redeploys and is shared
 * across serverless instances, unlike an in-memory map).
 *
 * Returns true when the caller is allowed to proceed.
 */
export async function checkRateLimit(admin, bucket, identifier, { limit, windowSeconds }) {
  const key = String(identifier || "unknown").toLowerCase().slice(0, 160);
  const now = new Date();

  const { data: existing } = await admin
    .from("rate_limits")
    .select("count, window_start")
    .eq("bucket", bucket)
    .eq("identifier", key)
    .maybeSingle();

  const windowExpired =
    !existing || now.getTime() - new Date(existing.window_start).getTime() > windowSeconds * 1000;

  if (windowExpired) {
    await admin
      .from("rate_limits")
      .upsert(
        { bucket, identifier: key, count: 1, window_start: now.toISOString() },
        { onConflict: "bucket,identifier" }
      );
    return true;
  }

  if (existing.count >= limit) {
    return false;
  }

  await admin
    .from("rate_limits")
    .update({ count: existing.count + 1 })
    .eq("bucket", bucket)
    .eq("identifier", key);

  return true;
}

/** Best-effort client IP, used only as a throttling key. */
export function clientIp(request) {
  const forwarded = request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("x-forwarded-for");
  if (!forwarded) {
    return "unknown";
  }
  return forwarded.split(",")[0].trim();
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function isValidEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function isValidName(value) {
  return typeof value === "string" && value.trim().length >= 2 && value.trim().length <= 80;
}

/**
 * Password floor. Length does far more work than character-class rules, and
 * complexity requirements push people toward writing passwords down — a real
 * risk when accounts are set up on shared phones.
 */
export function passwordProblem(value) {
  if (typeof value !== "string" || value.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (value.length > 200) {
    return "Password is too long.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

/**
 * Sends the teacher approval code to the NGO's own inbox — never to the person
 * applying. Whoever reads that inbox decides whether they recognise the
 * applicant before passing the code on.
 *
 * With no RESEND_API_KEY configured the code is logged server-side instead, so
 * local development works without an email provider. That fallback refuses to
 * run in production.
 */
export async function sendTeacherCodeToNgo({ applicantName, applicantEmail, code }) {
  const to = process.env.NGO_APPROVAL_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!to) {
    throw new Error("NGO_APPROVAL_EMAIL is not set.");
  }

  const subject = `Teacher access request — ${applicantName}`;
  const text = [
    `${applicantName} <${applicantEmail}> has asked for a teacher account on the Umeed o Shakhur LMS.`,
    "",
    `Approval code: ${code}`,
    "",
    "Only give this code to them if you recognise this person as one of our teachers.",
    "It expires in 15 minutes and works once.",
    "",
    "If you do not recognise them, ignore this email. Nothing happens without the code."
  ].join("\n");

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "RESEND_API_KEY and RESEND_FROM_EMAIL must be set in production so approval codes can be delivered."
      );
    }
    console.info(`\n[dev] Teacher approval code for ${applicantEmail}: ${code}\n`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from, to: [to], subject, text, reply_to: applicantEmail })
  });

  if (!response.ok) {
    throw new Error(`Approval email failed to send (${response.status}).`);
  }
}
