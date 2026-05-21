import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface ArchiveEventsRequest {
  accessCode: string | number
  eventIds: string[]
  /** true = archive (set archived_at); false = restore (clear archived_at) */
  archive: boolean
}

/** Must stay in sync with create-event / update-event / delete-event maps. */
const validAccessCodes = {
  938271: "President",
  472839: "Vice-President",
  615204: "Honorary Secretary",
  307198: "Honorary Assistant Secretary",
  529746: "Honorary Treasurer",
  184302: "Honorary Assistant Treasurer",
  763910: "Training Head (General)",
  920458: "Training Head (Land)",
  381207: "Training Head (Water)",
  640193: "Training Head (Welfare)",
  859321: "Quartermaster",
  712496: "Assistant Quarter Master",
  530984: "Publicity Head",
  298374: "First Assistant Publicity Head",
  476213: "Second Assistant Publicity Head",
  888888: "Member",
} as const

type AccessRole = (typeof validAccessCodes)[keyof typeof validAccessCodes]

const jsonBody = (
  payload: Record<string, unknown>,
  status = 200,
) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    )

    const body: ArchiveEventsRequest = await req.json()
    const { accessCode, eventIds, archive } = body

    const codeKey = String(accessCode ?? "").trim()
    const numericKey = Number(codeKey)
    const role: AccessRole | undefined =
      (validAccessCodes as Record<string, AccessRole>)[codeKey] ??
      validAccessCodes[numericKey as keyof typeof validAccessCodes]

    if (!role) {
      return jsonBody({ success: false, error: "Invalid access code" })
    }

    const ids = Array.isArray(eventIds)
      ? eventIds.filter((id): id is string => typeof id === "string" && id.length > 0)
      : []

    if (ids.length === 0) {
      return jsonBody({ success: false, error: "No programme IDs provided." })
    }

    if (typeof archive !== "boolean") {
      return jsonBody({ success: false, error: "Missing archive flag." })
    }

    const archived_at = archive ? new Date().toISOString() : null

    const { error } = await supabase
      .from("events")
      .update({ archived_at })
      .in("id", ids)

    if (error) throw error

    return jsonBody({
      success: true,
      updatedCount: ids.length,
      archive,
    })
  } catch (e) {
    console.error("archive-events error:", e)
    const message = e instanceof Error ? e.message : "Unexpected error updating programmes"
    return jsonBody({ success: false, error: message })
  }
})
