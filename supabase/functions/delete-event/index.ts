import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface DeleteEventRequest {
  accessCode: string | number
  eventIds: string[]
}

/** Must stay in sync with create-event / update-event maps. */
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

    const body: DeleteEventRequest = await req.json()
    const { accessCode, eventIds } = body

    const codeKey = String(accessCode ?? "").trim()
    const numericKey = Number(codeKey)
    const role: AccessRole | undefined =
      (validAccessCodes as Record<string, AccessRole>)[codeKey] ??
      validAccessCodes[numericKey as keyof typeof validAccessCodes]

    if (!role) {
      return jsonBody({ success: false, error: "Invalid access code" })
    }

    if (role === "Member") {
      return jsonBody({
        success: false,
        error:
          "Members cannot delete programmes. Ask a committee lead (e.g. President, Quartermaster, or Training Heads).",
      })
    }

    const ids = Array.isArray(eventIds)
      ? eventIds.filter((id): id is string => typeof id === "string" && id.length > 0)
      : []

    if (ids.length === 0) {
      return jsonBody({ success: false, error: "No programme IDs provided." })
    }

    const { error: delError } = await supabase.from("events").delete().in("id", ids)
    if (delError) throw delError

    return jsonBody({ success: true, deletedCount: ids.length })
  } catch (e) {
    console.error("delete-event error:", e)
    const message = e instanceof Error ? e.message : "Unexpected error deleting programmes"
    return jsonBody({ success: false, error: message })
  }
})
