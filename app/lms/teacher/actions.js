"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateJoinCode } from "@/lib/lms/gate";

/**
 * Teacher console mutations.
 *
 * Every one of these runs through the RLS-bound client, under the signed-in
 * user's identity. A student who managed to POST to one of these actions would
 * be rejected by the database policy, not by a check written here — so there is
 * no role check to forget.
 */

function fail(message) {
  return { error: message };
}

function text(formData, field, max) {
  return String(formData.get(field) || "").trim().slice(0, max);
}

/** Null class_id means the item is visible to everyone. */
function classIdOrNull(formData) {
  const raw = String(formData.get("classId") || "");
  return raw && raw !== "all" ? raw : null;
}

export async function createClassAction(_prevState, formData) {
  const name = text(formData, "name", 80);
  if (name.length < 2) {
    return fail("Give the class a name.");
  }

  const maxUsesRaw = String(formData.get("maxUses") || "").trim();
  const maxUses = maxUsesRaw ? Number.parseInt(maxUsesRaw, 10) : null;
  if (maxUsesRaw && (!Number.isFinite(maxUses) || maxUses < 1 || maxUses > 1000)) {
    return fail("Seat limit must be a number between 1 and 1000.");
  }

  const daysRaw = String(formData.get("expiresDays") || "").trim();
  const days = daysRaw ? Number.parseInt(daysRaw, 10) : null;
  if (daysRaw && (!Number.isFinite(days) || days < 1 || days > 365)) {
    return fail("Expiry must be between 1 and 365 days.");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return fail("Your session expired. Sign in again.");
  }

  // The unique constraint on join_code makes a collision a hard error rather
  // than a silent duplicate, so retry a few times before giving up.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error } = await supabase.from("classes").insert({
      name,
      join_code: generateJoinCode(6),
      max_uses: maxUses,
      expires_at: days ? new Date(Date.now() + days * 86400000).toISOString() : null,
      created_by: user.id
    });

    if (!error) {
      revalidatePath("/lms/teacher");
      return { ok: true };
    }
    if (error.code !== "23505") {
      return fail("Could not create the class.");
    }
  }

  return fail("Could not generate a unique code. Please try again.");
}

export async function rotateCodeAction(_prevState, formData) {
  const classId = String(formData.get("classId") || "");
  if (!classId) {
    return fail("Missing class.");
  }

  const supabase = await createClient();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error } = await supabase
      .from("classes")
      .update({ join_code: generateJoinCode(6), uses: 0 })
      .eq("id", classId);

    if (!error) {
      revalidatePath("/lms/teacher");
      return { ok: true };
    }
    if (error.code !== "23505") {
      return fail("Could not change the code.");
    }
  }

  return fail("Could not generate a unique code. Please try again.");
}

export async function toggleClassAction(_prevState, formData) {
  const classId = String(formData.get("classId") || "");
  const active = String(formData.get("active") || "") === "true";

  const supabase = await createClient();
  const { error } = await supabase.from("classes").update({ active: !active }).eq("id", classId);

  if (error) {
    return fail("Could not update the class.");
  }
  revalidatePath("/lms/teacher");
  return { ok: true };
}

export async function postAnnouncementAction(_prevState, formData) {
  const title = text(formData, "title", 140);
  const body = text(formData, "body", 4000);

  if (title.length < 2 || body.length < 1) {
    return fail("Announcements need a title and a message.");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("announcements").insert({
    title,
    body,
    class_id: classIdOrNull(formData),
    created_by: user?.id ?? null
  });

  if (error) {
    return fail("Could not post the announcement.");
  }
  revalidatePath("/lms/teacher");
  revalidatePath("/lms/dashboard");
  return { ok: true };
}

export async function postAssignmentAction(_prevState, formData) {
  const title = text(formData, "title", 140);
  const instructions = text(formData, "instructions", 4000);
  const dueOn = String(formData.get("dueOn") || "").trim();

  if (title.length < 2 || instructions.length < 1) {
    return fail("Assignments need a title and instructions.");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("assignments").insert({
    title,
    instructions,
    due_on: dueOn || null,
    class_id: classIdOrNull(formData),
    created_by: user?.id ?? null
  });

  if (error) {
    return fail("Could not post the assignment.");
  }
  revalidatePath("/lms/teacher");
  revalidatePath("/lms/dashboard");
  return { ok: true };
}

export async function postResourceAction(_prevState, formData) {
  const title = text(formData, "title", 140);
  const description = text(formData, "description", 500);
  const url = text(formData, "url", 2000);

  if (title.length < 2) {
    return fail("Give the book or link a title.");
  }
  if (!/^https?:\/\//i.test(url)) {
    return fail("The link must start with http:// or https://");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("resources").insert({
    title,
    description: description || null,
    url,
    class_id: classIdOrNull(formData),
    created_by: user?.id ?? null
  });

  if (error) {
    return fail("Could not add the resource.");
  }
  revalidatePath("/lms/teacher");
  revalidatePath("/lms/dashboard");
  return { ok: true };
}
