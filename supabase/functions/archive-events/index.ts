import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0"
import { resolveAccessCodeRole } from "../_shared/accessCode.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface ArchiveEventsRequest {
  accessCode: string | number
  eventIds: string[]
  archive: boolean
}

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

    const resolved = await resolveAccessCodeRole(supabase, accessCode)
    if (!resolved.ok) {
      return jsonBody({ success: false, error: resolved.error })
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
