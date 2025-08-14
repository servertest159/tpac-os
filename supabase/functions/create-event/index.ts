import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateEventRequest {
  accessCode: string
  eventData: {
    title: string
    date: string
    end_date?: string
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
  123456: 'President',
  654321: 'Vice-President', 
  111111: 'Secretary',
  222222: 'Treasurer',
  333333: 'Safety-Officer',
  444444: 'Training-Officer',
  555555: 'Logistics-Officer',
  666666: 'Welfare-Officer',
  777777: 'Publicity-Officer',
  888888: 'Member'
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

    const { accessCode, eventData, roleRequirements }: CreateEventRequest = await req.json()

    // Validate access code
    if (!validAccessCodes[accessCode as keyof typeof validAccessCodes]) {
      return new Response(
        JSON.stringify({ error: 'Invalid access code' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Creating event with access code:', accessCode)
    console.log('Event data:', eventData)

    // Create the event (using service role to bypass RLS)
    const { data: newEvent, error: eventError } = await supabase
      .from('events')
      .insert([{
        ...eventData,
        creator_id: null, // No specific user since it's created via access code
        status: 'active',
        updated_at: new Date().toISOString()
      }])
      .select('id')
      .single()

    if (eventError) {
      console.error('Error creating event:', eventError)
      throw eventError
    }

    console.log('Event created:', newEvent)

    // Add role requirements if any
    if (roleRequirements && roleRequirements.length > 0 && newEvent) {
      const requirements = roleRequirements
        .filter(r => r.role && r.quantity > 0)
        .map(r => ({
          event_id: newEvent.id,
          role: r.role,
          quantity: Number(r.quantity)
        }))

      if (requirements.length > 0) {
        const { error: requirementsError } = await supabase
          .from('event_role_requirements')
          .insert(requirements)

        if (requirementsError) {
          console.error('Error creating role requirements:', requirementsError)
          throw requirementsError
        }

        console.log('Role requirements created:', requirements)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventId: newEvent.id,
        message: 'Programme created successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in create-event function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create programme',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})