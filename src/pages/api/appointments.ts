// FILE: src/pages/api/appointments.ts
import type { APIRoute } from 'astro';
import { Database } from '../../lib/db';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json() as {
      clientName: string;
      clientPhone: string;
      clientEmail?: string;
      professionalId?: string;
      date: string;
      time: string;
      services: string[];
      source?: string;
      notes?: string;
    };
    const { clientName, clientPhone, clientEmail, professionalId, date, time, services, source, notes } = body;

    if (!clientName || !clientPhone || !date || !time || !services || services.length === 0) {
      return new Response(JSON.stringify({ error: 'Campos obrigatórios faltando' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = new Database(locals.runtime.env.DB);

    let user = await db.getUser(clientPhone);
    if (!user) {
      user = await db.createUser({
        name: clientName,
        phone: clientPhone,
        email: clientEmail
      });
    }

    const servicesList = await Promise.all(
      services.map((id: string) => db.getServiceById(id))
    );

    const totalDuration = servicesList.reduce((sum, s) => sum + (s?.duration_minutes || 0), 0);
    const totalPrice = servicesList.reduce((sum, s) => sum + (s?.price || 0), 0);

    const appointmentId = await db.createAppointment({
      userId: user.id,
      professionalId: professionalId || undefined,
      date,
      startTime: time,
      totalDuration,
      totalPrice,
      source: source || 'direto',
      clientNotes: notes,
      items: servicesList.filter(Boolean).map(s => ({
        serviceId: s!.id,
        serviceName: s!.name,
        duration: s!.duration_minutes,
        price: s!.price
      }))
    });

    return new Response(JSON.stringify({ success: true, appointmentId }), {
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