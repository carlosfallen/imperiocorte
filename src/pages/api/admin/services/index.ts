import type { APIRoute } from 'astro';
import { Database } from '../../../../lib/db';
import { generateId } from '../../../../lib/auth';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.admin) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as {
      name: string;
      category_id: string;
      description?: string;
      duration_minutes: number;
      price: number;
      notes?: string;
      is_featured?: number;
      is_active?: number;
    };

    const db = new Database(locals.runtime.env.DB);
    const id = generateId('srv');
    const now = Math.floor(Date.now() / 1000);
    
    const slug = body.name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    await locals.runtime.env.DB
      .prepare(`
        INSERT INTO services (id, category_id, name, slug, description, duration_minutes, price, notes, is_featured, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        body.category_id,
        body.name,
        slug,
        body.description || null,
        body.duration_minutes,
        body.price,
        body.notes || null,
        body.is_featured || 0,
        body.is_active ?? 1,
        now,
        now
      )
      .run();

    return new Response(JSON.stringify({ success: true, id }), {
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