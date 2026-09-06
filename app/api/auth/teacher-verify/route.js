import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkRateLimit,
  clientIp,
  isValidEmail,
  passwordProblem,
  verifyCode
} from "@/lib/lms/gate";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;

/**
 * Step 2 of teacher signup: redeem the approval code.
 *
 * Role 'teacher' is only ever reachable through this route, and only with a
 * code that was emailed to the NGO's own inbox.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const code = String(body.code || "").trim();
  const password = String(body.password || "");

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "The approval code is six digits." }, { status: 400 });
  }
  const pwProblem = passwordProblem(password);
  if (pwProblem) {
    return NextResponse.json({ error: pwProblem }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Signup is not configured yet." }, { status: 503 });
  }

  const ipAllowed = await checkRateLimit(admin, "teacher_verify_ip", clientIp(request), {
    limit: 15,
    windowSeconds: 3600
  });
  if (!ipAllowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait an hour and try again." },
      { status: 429 }
    );
  }

  const { data: pending } = await admin
    .from("teacher_signup_requests")
    .select("id, full_name, code_hash, expires_at, attempts")
    .eq("email", email)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // One message for every failure mode below, so a caller can't distinguish
  // "no request exists" from "wrong code" from "expired".
  const rejection = NextResponse.json(
    { error: "That code is not valid or has expired. Ask the NGO to send a new one." },
    { status: 403 }
  );

  if (!pending) {
    return rejection;
  }
  if (new Date(pending.expires_at) < new Date()) {
    return rejection;
  }
  if (pending.attempts >= MAX_ATTEMPTS) {
    return rejection;
  }

  if (!verifyCode(code, pending.code_hash)) {
    await admin
      .from("teacher_signup_requests")
      .update({ attempts: pending.attempts + 1 })
      .eq("id", pending.id);
    return rejection;
  }

  // Burn the code before creating the account. If account creation then fails,
  // the applicant has to request a fresh code — the safe direction to fail in,
  // because it can never leave a still-valid code lying around.
  const { data: consumed } = await admin
    .from("teacher_signup_requests")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", pending.id)
    .is("consumed_at", null)
    .select("id")
    .maybeSingle();

  if (!consumed) {
    // Another request consumed it first — a replay.
    return rejection;
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: pending.full_name }
  });

  if (createError) {
    const duplicate = /already|exists|registered/i.test(createError.message || "");
    return NextResponse.json(
      {
        error: duplicate
          ? "An account with this email already exists. Try signing in instead."
          : "Could not create the account. Please request a new code."
      },
      { status: duplicate ? 409 : 500 }
    );
  }

  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: created.user.id, full_name: pending.full_name, role: "teacher" });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
    return NextResponse.json(
      { error: "Could not finish signup. Please request a new code." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
