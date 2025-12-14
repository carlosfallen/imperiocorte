import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals, params }) => {
  try {
    const { id } = params;
    const result = await locals.runtime.env.DB
      .prepare('SELECT service_id FROM professional_services WHERE professional_id = ?')
      .bind(id)
      .all();

    return new Response(JSON.stringify({ 
      services: result.results?.map((r: any) => r.service_id) || []
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
