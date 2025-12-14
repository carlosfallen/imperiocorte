import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals, params }) => {
  try {
    const { id } = params;
    
    const hoursResult = await locals.runtime.env.DB
      .prepare('SELECT day_of_week, start_time, end_time FROM working_hours WHERE professional_id = ? AND is_active = 1')
      .bind(id)
      .all();

    const breaksResult = await locals.runtime.env.DB
      .prepare('SELECT day_of_week, start_time, end_time FROM breaks WHERE professional_id = ? AND is_active = 1')
      .bind(id)
      .all();

    return new Response(JSON.stringify({ 
      hours: hoursResult.results || [],
      breaks: breaksResult.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};