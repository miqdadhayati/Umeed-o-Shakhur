import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkRateLimit,
  clientIp,
  isValidEmail,
  isValidName,
  passwordProblem
} from "@/lib/lms/gate";

export const dynamic = "force-dynamic";

/**
 * Student signup, gated by a class join code.
 *
 * The role is hard-coded to 'student' here. There is no code path in this
 * route that can produce a teacher, so a crafted request body cannot escalate.
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
  const password = String(body.password || "");
  const joinCode = String(body.joinCode || "").trim().toUpperCase();

  if (!isValidName(fullName)) {
    return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  const pwProblem = passwordProblem(password);
  if (pwProblem) {
    return NextResponse.json({ error: pwProblem }, { status: 400 });
  }
  if (!/^[A-Z0-9]{6,10}$/.test(joinCode)) {
    return NextResponse.json({ error: "That class code doesn't look right." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Signup is not configured yet." }, { status: 503 });
  }

  // Throttle by IP so a wrong-code guessing loop is not viable. The code space
  // is 31^6 (~887 million), and 10 tries an hour makes brute force hopeless.
  const ipAllowed = await checkRateLimit(admin, "student_signup_ip", clientIp(request), {
    limit: 10,
    windowSeconds: 3600
  });
  if (!ipAllowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait an hour and try again." },
      { status: 429 }
    );
  }

  // Validate and consume the code in a single atomic statement, so two people
  // signing up at once cannot both claim the last seat.
  const { data: classId, error: redeemError } = await admin.rpc("redeem_join_code", {
    code: joinCode
  });

  if (redeemError) {
    return NextResponse.json({ error: "Could not check that code. Try again." }, { status: 500 });
  }
  if (!classId) {
    return NextResponse.json(
      { error: "That class code is not valid, has expired, or is full. Ask your teacher for a new one." },
      { status: 403 }
    );
  }

  // Everything past this point has a claimed seat, so failures must give it back.
  const releaseSeat = async () => {
    await admin.rpc("release_join_code_seat", { target_class: classId }).catch(() => {});
  };

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    // Already gated by the join code, so we don't add an email round-trip that
    // many students would struggle to complete.
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (createError) {
    await releaseSeat();
    const duplicate = /already|exists|registered/i.test(createError.message || "");
    return NextResponse.json(
      {
        error: duplicate
          ? "An account with this email already exists. Try signing in instead."
          : "Could not create the account. Please try again."
      },
      { status: duplicate ? 409 : 500 }
    );
  }

  const userId = created.user.id;

  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: userId, full_name: fullName, role: "student" });

  if (profileError) {
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    await releaseSeat();
    return NextResponse.json({ error: "Could not finish signup. Please try again." }, { status: 500 });
  }

  const { error: memberError } = await admin
    .from("class_members")
    .insert({ class_id: classId, profile_id: userId });

  if (memberError) {
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    await releaseSeat();
    return NextResponse.json({ error: "Could not join the class. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
