import type { APIRoute } from 'astro';

export const PATCH: APIRoute = async ({ request, locals, params }) => {
  try {
    if (!locals.admin) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    const body = await request.json() as any;
    const now = Math.floor(Date.now() / 1000);

    const fields = Object.keys(body).filter(k => k !== 'id');
    const values = fields.map(k => body[k]);
    const sql = `UPDATE services SET ${fields.map(f => `${f} = ?`).join(', ')}, updated_at = ? WHERE id = ?`;

    await locals.runtime.env.DB.prepare(sql).bind(...values, now, id).run();

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

export const DELETE: APIRoute = async ({ locals, params }) => {
  try {
    if (!locals.admin) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    await locals.runtime.env.DB.prepare('DELETE FROM services WHERE id = ?').bind(id).run();

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