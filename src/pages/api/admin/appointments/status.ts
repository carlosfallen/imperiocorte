// FILE: src/pages/api/admin/appointments/status.ts
import type { APIRoute } from 'astro';
import { Database } from '../../../../lib/db';

export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.admin) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as { 
      appointmentId: string; 
      status: string; 
      adminNotes?: string 
    };
    const { appointmentId, status, adminNotes } = body;

    if (!appointmentId || !status) {
      return new Response(JSON.stringify({ error: 'Dados inválidos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = new Database(locals.runtime.env.DB);
    await db.updateAppointmentStatus(appointmentId, status, adminNotes);

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