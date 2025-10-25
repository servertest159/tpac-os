import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input validation schema
const eventDataSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  end_date: z.string().nullable().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)), 
    'Invalid end date format'
  ),
  location: z.string().min(1, 'Location is required').max(200, 'Location must be less than 200 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters'),
  max_participants: z.number().int().min(1).max(1000, 'Max participants must be between 1 and 1000'),
})

const roleRequirementSchema = z.object({
  role: z.string().min(1),
  quantity: z.number().int().min(1),
})

const requestSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  eventData: eventDataSchema,
  roleRequirements: z.array(roleRequirementSchema).optional(),
})

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client with the auth header (JWT now verified by config)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      console.error('Authentication failed - user not authenticated')
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validatedData = requestSchema.parse(body)
    const { eventId, eventData, roleRequirements } = validatedData

    console.log('Event update initiated')

    // Validate dates logic
    if (eventData.end_date) {
      const startDate = new Date(eventData.date)
      const endDate = new Date(eventData.end_date)
      if (endDate < startDate) {
        return new Response(
          JSON.stringify({ success: false, error: 'End date must be after start date' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Update the event (RLS will enforce that user is the creator)
    const { error: updateError } = await supabaseClient
      .from('events')
      .update({
        ...eventData,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)

    if (updateError) {
      console.error('Failed to update event')
      // Check if it's a permission error
      if (updateError.code === 'PGRST301' || updateError.message.includes('permission')) {
        return new Response(
          JSON.stringify({ success: false, error: 'You do not have permission to update this event' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw updateError
    }

    // Replace role requirements
    const { error: delError } = await supabaseClient
      .from('event_role_requirements')
      .delete()
      .eq('event_id', eventId)

    if (delError) {
      console.error('Failed to delete existing role requirements')
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
      const { error: insError } = await supabaseClient
        .from('event_role_requirements')
        .insert(requirements)

      if (insError) {
        console.error('Failed to insert role requirements')
        throw insError
      }

      console.log('Role requirements updated successfully')
    }

    return new Response(
      JSON.stringify({ success: true, eventId, message: 'Programme updated successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in update-event function:', error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation error',
          details: error.errors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        error: 'Failed to update programme', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
