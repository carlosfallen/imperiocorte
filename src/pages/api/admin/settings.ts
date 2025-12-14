import type { APIRoute } from 'astro';
import { Database } from '../../../lib/db';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.admin) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const settings = await request.json() as Record<string, string>;
    const db = new Database(locals.runtime.env.DB);

    for (const [key, value] of Object.entries(settings)) {
      await db.updateSetting(key, value);
    }

    return new Response(JSON.stringify({ success: true }), {
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