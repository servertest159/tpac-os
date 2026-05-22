import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0"
import { canMutateOperationalData, resolveAccessCodeRole } from "../_shared/accessCode.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface DeleteEventRequest {
  accessCode: string | number
  eventIds: string[]
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

    const body: DeleteEventRequest = await req.json()
    const { accessCode, eventIds } = body

    const resolved = await resolveAccessCodeRole(supabase, accessCode)
    if (!resolved.ok) {
      return jsonBody({ success: false, error: resolved.error })
    }

    if (!canMutateOperationalData(resolved.role)) {
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

    const failed: { id: string; error: string }[] = []
    let deletedCount = 0

    for (const id of ids) {
      const { error: delErr } = await supabase.from("events").delete().eq("id", id)
      if (delErr) failed.push({ id, error: delErr.message })
      else deletedCount++
    }

    return jsonBody({ success: true, deletedCount, failed })
  } catch (e) {
    console.error("delete-event error:", e)
    const message = e instanceof Error ? e.message : "Unexpected error deleting programmes"
    return jsonBody({ success: false, error: message })
  }
})
