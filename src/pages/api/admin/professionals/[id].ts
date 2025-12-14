import type { APIRoute } from 'astro';
import { generateId } from '../../../../lib/auth';

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

    // Update basic info
    await locals.runtime.env.DB
      .prepare('UPDATE professionals SET name = ?, bio = ?, is_active = ?, updated_at = ? WHERE id = ?')
      .bind(body.name, body.bio || null, body.is_active ?? 1, now, id)
      .run();

    // Update services
    if (body.services) {
      await locals.runtime.env.DB.prepare('DELETE FROM professional_services WHERE professional_id = ?').bind(id).run();
      for (const serviceId of body.services) {
        await locals.runtime.env.DB
          .prepare('INSERT INTO professional_services (professional_id, service_id) VALUES (?, ?)')
          .bind(id, serviceId)
          .run();
      }
    }

    // Update working hours
    if (body.workingHours) {
      await locals.runtime.env.DB.prepare('DELETE FROM working_hours WHERE professional_id = ?').bind(id).run();
      for (const hour of body.workingHours) {
        await locals.runtime.env.DB
          .prepare('INSERT INTO working_hours (id, professional_id, day_of_week, start_time, end_time, is_active) VALUES (?, ?, ?, ?, ?, 1)')
          .bind(generateId('wh'), id, hour.day_of_week, hour.start_time, hour.end_time)
          .run();
      }
    }

    // Update breaks
    if (body.breaks) {
      await locals.runtime.env.DB.prepare('DELETE FROM breaks WHERE professional_id = ?').bind(id).run();
      for (const brk of body.breaks) {
        await locals.runtime.env.DB
          .prepare('INSERT INTO breaks (id, professional_id, day_of_week, start_time, end_time, is_active) VALUES (?, ?, ?, ?, ?, 1)')
          .bind(generateId('brk'), id, brk.day_of_week, brk.start_time, brk.end_time)
          .run();
      }
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

export const DELETE: APIRoute = async ({ locals, params }) => {
  try {
    if (!locals.admin) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    await locals.runtime.env.DB.prepare('DELETE FROM professionals WHERE id = ?').bind(id).run();

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