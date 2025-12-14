import type { APIRoute } from 'astro';
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
      bio?: string;
      is_active?: number;
      services?: string[];
      workingHours?: any[];
      breaks?: any[];
    };

    const id = generateId('prof');
    const now = Math.floor(Date.now() / 1000);
    
    const slug = body.name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    await locals.runtime.env.DB
      .prepare('INSERT INTO professionals (id, name, slug, bio, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, body.name, slug, body.bio || null, body.is_active ?? 1, now, now)
      .run();

    // Insert services
    if (body.services && body.services.length > 0) {
      for (const serviceId of body.services) {
        await locals.runtime.env.DB
          .prepare('INSERT INTO professional_services (professional_id, service_id) VALUES (?, ?)')
          .bind(id, serviceId)
          .run();
      }
    }

    // Insert working hours
    if (body.workingHours && body.workingHours.length > 0) {
      for (const hour of body.workingHours) {
        await locals.runtime.env.DB
          .prepare('INSERT INTO working_hours (id, professional_id, day_of_week, start_time, end_time, is_active) VALUES (?, ?, ?, ?, ?, 1)')
          .bind(generateId('wh'), id, hour.day_of_week, hour.start_time, hour.end_time)
          .run();
      }
    }

    // Insert breaks
    if (body.breaks && body.breaks.length > 0) {
      for (const brk of body.breaks) {
        await locals.runtime.env.DB
          .prepare('INSERT INTO breaks (id, professional_id, day_of_week, start_time, end_time, is_active) VALUES (?, ?, ?, ?, ?, 1)')
          .bind(generateId('brk'), id, brk.day_of_week, brk.start_time, brk.end_time)
          .run();
      }
    }

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
