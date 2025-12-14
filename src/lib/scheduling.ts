// FILE: src/lib/scheduling.ts
import type { TimeSlot } from './types';

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function generateTimeSlots(
  workStart: string,
  workEnd: string,
  breaks: Array<{ start_time: string; end_time: string }>,
  existingAppointments: Array<{ start_time: string; total_duration: number }>,
  serviceDuration: number,
  bufferTime: number = 15
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startMinutes = timeToMinutes(workStart);
  const endMinutes = timeToMinutes(workEnd);
  const slotDuration = 30;

  for (let time = startMinutes; time < endMinutes; time += slotDuration) {
    const slotTime = minutesToTime(time);
    const slotEndTime = time + serviceDuration;

    let available = true;

    if (slotEndTime > endMinutes) {
      available = false;
    }

    for (const breakPeriod of breaks) {
      const breakStart = timeToMinutes(breakPeriod.start_time);
      const breakEnd = timeToMinutes(breakPeriod.end_time);
      if (time < breakEnd && slotEndTime > breakStart) {
        available = false;
        break;
      }
    }

    for (const appointment of existingAppointments) {
      const apptStart = timeToMinutes(appointment.start_time);
      const apptEnd = apptStart + appointment.total_duration + bufferTime;
      if (time < apptEnd && slotEndTime > apptStart) {
        available = false;
        break;
      }
    }

    slots.push({ time: slotTime, available });
  }

  return slots;
}

export function isValidAppointmentTime(
  date: string,
  time: string,
  minAdvanceHours: number
): boolean {
  const now = new Date();
  const appointmentDate = new Date(`${date}T${time}`);
  const hoursUntil = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntil >= minAdvanceHours;
}

export function formatAppointmentForWhatsApp(appointment: {
  user_name: string;
  date: string;
  start_time: string;
  total_duration: number;
  total_price: number;
  professional_name?: string;
  source: string;
  client_notes?: string;
  items: Array<{ service_name: string; price: number }>;
}): string {
  const dateFormatted = new Date(appointment.date).toLocaleDateString('pt-BR');
  const services = appointment.items.map(item => `• ${item.service_name} - R$ ${item.price.toFixed(2)}`).join('\n');

  let message = `🎯 *NOVO AGENDAMENTO*\n\n`;
  message += `👤 *Cliente:* ${appointment.user_name}\n`;
  message += `📅 *Data:* ${dateFormatted}\n`;
  message += `🕐 *Horário:* ${appointment.start_time}\n`;
  message += `⏱️ *Duração:* ${appointment.total_duration} minutos\n\n`;

  if (appointment.professional_name) {
    message += `💇 *Profissional:* ${appointment.professional_name}\n\n`;
  }

  message += `*Serviços:*\n${services}\n\n`;
  message += `💰 *Total:* R$ ${appointment.total_price.toFixed(2)}\n`;
  message += `📍 *Origem:* ${appointment.source}\n`;

  if (appointment.client_notes) {
    message += `📝 *Observações:* ${appointment.client_notes}\n`;
  }

  return message;
}

export function generateICSFile(appointment: {
  date: string;
  start_time: string;
  total_duration: number;
  items: Array<{ service_name: string }>;
}): string {
  const start = new Date(`${appointment.date}T${appointment.start_time}`);
  const end = new Date(start.getTime() + appointment.total_duration * 60000);

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const services = appointment.items.map(i => i.service_name).join(', ');

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Império Corte//Agendamento//PT
BEGIN:VEVENT
UID:${Date.now()}@imperiocorte.com.br
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:Império Corte - ${services}
DESCRIPTION:Agendamento confirmado
LOCATION:Império Corte
END:VEVENT
END:VCALENDAR`;
}