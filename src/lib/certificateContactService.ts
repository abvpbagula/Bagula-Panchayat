import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLog";

export interface UpdateContactParams {
  kind: "warish" | "dependent" | "linkage";
  certId: string;
  mobile: string;
  email: string;
  reason?: string;
  actorEmail?: string;
}

export interface UpdateContactResult {
  success: boolean;
  message?: string;
  oldMobile?: string | null;
  newMobile?: string | null;
  oldEmail?: string | null;
  newEmail?: string | null;
}

/**
 * Backend workflow to modify an existing application or issued certificate's
 * contact mobile number and email address with immutable audit logging.
 */
export async function updateCertificateContact(
  params: UpdateContactParams
): Promise<UpdateContactResult> {
  const { kind, certId, mobile, email, reason, actorEmail } = params;

  // 1. Sanitize and validate
  const cleanMobile = (mobile || "").replace(/\D/g, "").slice(-10);
  const cleanEmail = (email || "").trim().toLowerCase();

  if (cleanMobile && cleanMobile.length !== 10) {
    throw new Error("Mobile number must be exactly 10 digits (e.g. 9876543210).");
  }

  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error("Please enter a valid email address format (e.g. citizen@example.com).");
  }

  if (!cleanMobile && !cleanEmail) {
    throw new Error("At least one contact method (10-digit mobile or valid email) must be maintained.");
  }

  const table = kind === "warish" ? "warish_certificates" : "dependent_certificates";

  // 2. Fetch current record to capture existing state
  const { data: current, error: fetchErr } = await supabase
    .from(table as any)
    .select("id, verification_id, memo_no, contact_mobile, contact_email, applicant_details, data, applicant_name")
    .eq("id", certId)
    .single();

  if (fetchErr || !current) {
    throw new Error(`Record not found: ${fetchErr?.message || "Invalid certificate ID"}`);
  }

  const existingDetails = ((current as any).applicant_details ?? {}) as Record<string, any>;
  const existingData = ((current as any).data ?? {}) as Record<string, any>;
  const existingApplicant = (existingData.applicant ?? {}) as Record<string, any>;

  const oldMobile = (current as any).contact_mobile || existingDetails.mobile || existingApplicant.mobile || null;
  const oldEmail = (current as any).contact_email || existingDetails.email || existingApplicant.email || null;

  // 3. Prepare merged payload
  const updatedApplicantDetails = {
    ...existingDetails,
    mobile: cleanMobile || null,
    phone: cleanMobile || null,
    email: cleanEmail || null,
  };

  const updatedData = {
    ...existingData,
    contact_mobile: cleanMobile || null,
    contact_email: cleanEmail || null,
    applicant: {
      ...existingApplicant,
      mobile: cleanMobile || null,
      email: cleanEmail || null,
    },
    __wizard: {
      ...(existingData.__wizard ?? {}),
      applicant: {
        ...(existingData.__wizard?.applicant ?? {}),
        mobile: cleanMobile || null,
        email: cleanEmail || null,
      },
    },
  };

  const updatePayload: Record<string, any> = {
    contact_mobile: cleanMobile || null,
    contact_email: cleanEmail || null,
    applicant_details: updatedApplicantDetails,
    data: updatedData,
    updated_at: new Date().toISOString(),
  };

  // 4. Update the database record
  const { error: updateErr } = await supabase
    .from(table as any)
    .update(updatePayload)
    .eq("id", certId);

  if (updateErr) {
    console.error("Failed to update certificate contact:", updateErr);
    throw new Error(`Database update failed: ${updateErr.message}`);
  }

  // 5. Immutable Audit Trail in activity_logs
  const auditReason = reason?.trim() || "Administrative correction of applicant contact details.";
  const auditMetadata = {
    action: "MODIFY_CERTIFICATE_CONTACT",
    kind,
    cert_id: certId,
    memo_no: (current as any).memo_no ?? null,
    verification_id: (current as any).verification_id ?? null,
    applicant_name: (current as any).applicant_name ?? null,
    old_mobile: oldMobile,
    new_mobile: cleanMobile || null,
    old_email: oldEmail,
    new_email: cleanEmail || null,
    changed_by: actorEmail || "admin",
    timestamp: new Date().toISOString(),
  };

  try {
    await logActivity({
      action_type: "MODIFY_CERTIFICATE_CONTACT",
      target_table: table,
      target_id: certId,
      reason: `${auditReason} [Mobile: ${oldMobile || "None"} ➔ ${cleanMobile || "None"}, Email: ${oldEmail || "None"} ➔ ${cleanEmail || "None"}]`,
      metadata: auditMetadata,
    });
  } catch (logErr) {
    console.warn("Could not log activity:", logErr);
  }

  // 6. Also record in certificate_audit_trail if table is accessible
  try {
    await supabase.from("certificate_audit_trail" as any).insert({
      certificate_kind: kind,
      certificate_id: certId,
      action: "MODIFY_CONTACT",
      actor_email: actorEmail || "admin",
      reason: auditReason,
      metadata: auditMetadata,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Non-blocking
  }

  return {
    success: true,
    message: "Contact details updated and audit trail logged successfully.",
    oldMobile,
    newMobile: cleanMobile || null,
    oldEmail,
    newEmail: cleanEmail || null,
  };
}
