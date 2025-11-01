import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdateEventRequest {
  accessCode: string
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
}

const validAccessCodes = {
  938271: 'President',
  472839: 'Vice-President',
  615204: 'Honorary Secretary',
  307198: 'Honorary Assistant Secretary',
  529746: 'Honorary Treasurer',
  184302: 'Honorary Assistant Treasurer',
  763910: 'Training Head (General)',
  920458: 'Training Head (Land)',
  381207: 'Training Head (Water)',
  640193: 'Training Head (Welfare)',
  859321: 'Quartermaster',
  712496: 'Assistant Quarter Master',
  530984: 'Publicity Head',
  298374: 'First Assistant Publicity Head',
  476213: 'Second Assistant Publicity Head',
  888888: 'Member',
} as const

type AccessRole = typeof validAccessCodes[keyof typeof validAccessCodes]

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

    // Validate access code (tolerant to string/number; always return 200 with success=false on invalid)
    const codeKey = String(accessCode ?? '').trim()
    const role: AccessRole | undefined = (validAccessCodes as Record<string, AccessRole>)[codeKey] ?? (validAccessCodes as any)[Number(codeKey)]
    if (!role) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid access code' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Updating event via access code:', { role, eventId })

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

    return new Response(
      JSON.stringify({ success: true, eventId, message: 'Programme updated successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in update-event function:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to update programme', details: (error as any)?.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})