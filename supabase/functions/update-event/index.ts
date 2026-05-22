import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { resolveAccessCodeRole } from "../_shared/accessCode.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ItineraryItemInput {
  day: number
  time?: string | null
  activity: string
  location?: string | null
}

interface UpdateEventRequest {
  accessCode: string | number
  eventId: string
  eventData: {
    title: string
    date: string
    end_date?: string | null
    location: string
    description: string
    max_participants: number
  }
  roleRequirements: Array<{
    role: string
    quantity: number
  }>
  itineraryItems?: ItineraryItemInput[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { accessCode, eventId, eventData, roleRequirements }: UpdateEventRequest = await req.json()

    const resolved = await resolveAccessCodeRole(supabase, accessCode)
    if (!resolved.ok) {
      return new Response(
        JSON.stringify({ success: false, error: resolved.error }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    console.log('Updating event via access code:', { role: resolved.role, eventId })

    // Update the event (using service role to bypass RLS)
    const { error: updateError } = await supabase
      .from('events')
      .update({
        ...eventData,
        max_participants: Number(eventData.max_participants),
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)

    if (updateError) {
      console.error('Error updating event:', updateError)
      throw updateError
    }

    // Replace role requirements
    const { error: delError } = await supabase
      .from('event_role_requirements')
      .delete()
      .eq('event_id', eventId)

    if (delError) {
      console.error('Error deleting existing role requirements:', delError)
      throw delError
    }

    const requirements = (roleRequirements || [])
      .filter((r) => r.role && Number(r.quantity) > 0)
      .map((r) => ({
        event_id: eventId,
        role: r.role,
        quantity: Number(r.quantity),
      }))

    if (requirements.length > 0) {
      const { error: insError } = await supabase
        .from('event_role_requirements')
        .insert(requirements)

      if (insError) {
        console.error('Error inserting role requirements:', insError)
        throw insError
      }
    }

    const { error: delItError } = await supabase
      .from('itinerary_items')
      .delete()
      .eq('trip_id', eventId)
    if (delItError) {
      console.error('Error clearing itinerary:', delItError)
      throw delItError
    }

    const itRows = (itineraryItems || [])
      .filter((r) => r.activity && String(r.activity).trim().length > 0)
      .map((r) => ({
        trip_id: eventId,
        day: Math.max(1, Math.floor(Number(r.day) || 1)),
        time: r.time && String(r.time).trim() ? String(r.time).trim() : null,
        activity: String(r.activity).trim(),
        location: r.location && String(r.location).trim() ? String(r.location).trim() : null,
      }))
    if (itRows.length > 0) {
      const { error: itInsError } = await supabase.from('itinerary_items').insert(itRows)
      if (itInsError) {
        console.error('Error inserting itinerary items:', itInsError)
        throw itInsError
      }
    }

    return new Response(
      JSON.stringify({ success: true, eventId, message: 'Programme updated successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in update-event function:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to update programme', details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})