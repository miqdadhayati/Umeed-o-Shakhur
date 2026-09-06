import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkRateLimit,
  clientIp,
  generateOtp,
  hashCode,
  isValidEmail,
  isValidName,
  sendTeacherCodeToNgo
} from "@/lib/lms/gate";

export const dynamic = "force-dynamic";

const CODE_TTL_MINUTES = 15;

/**
 * Step 1 of teacher signup: ask for approval.
 *
 * Generates a code and emails it to the NGO's inbox. The applicant never
 * receives it — a human at the NGO has to recognise them and pass it on. That
 * human check is the actual security boundary; the code just carries it.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const fullName = String(body.fullName || "").trim();
  const email = String(body.email || "").trim().toLowerCase();

  if (!isValidName(fullName)) {
    return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Signup is not configured yet." }, { status: 503 });
  }

  // Two independent throttles. The per-email one stops one person spamming;
  // the global one stops a botnet burying a real request under a flood of
  // fake ones (the NGO inbox is the thing being protected here).
  const perEmail = await checkRateLimit(admin, "teacher_request_email", email, {
    limit: 3,
    windowSeconds: 3600
  });
  const perIp = await checkRateLimit(admin, "teacher_request_ip", clientIp(request), {
    limit: 5,
    windowSeconds: 3600
  });
  const global = await checkRateLimit(admin, "teacher_request_global", "all", {
    limit: 20,
    windowSeconds: 3600
  });

  if (!perEmail || !perIp || !global) {
    // Deliberately vague, and identical to the success shape below, so this
    // can't be used to probe whether a given email has already applied.
    return NextResponse.json({ ok: true });
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

  // Retire any earlier pending request for this email so only the newest code works.
  await admin
    .from("teacher_signup_requests")
    .update({ consumed_at: new Date().toISOString() })
    .eq("email", email)
    .is("consumed_at", null);

  const { error: insertError } = await admin.from("teacher_signup_requests").insert({
    email,
    full_name: fullName,
    code_hash: hashCode(code),
    expires_at: expiresAt.toISOString()
  });

  if (insertError) {
    return NextResponse.json({ error: "Could not start the request. Try again." }, { status: 500 });
  }

  try {
    await sendTeacherCodeToNgo({ applicantName: fullName, applicantEmail: email, code });
  } catch (error) {
    console.error("Teacher approval email failed:", error.message);
    return NextResponse.json(
      { error: "Could not reach the approvals inbox. Please contact the NGO directly." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
