export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  preferences?: string;
  notes?: string;
  created_at: number;
  updated_at: number;
}

export interface Admin {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  created_at: number;
  updated_at: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  display_order: number;
  created_at: number;
  updated_at: number;
}

export interface Service {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  duration_minutes: number;
  price: number;
  cover_image?: string;
  notes?: string;
  is_featured: number;
  is_active: number;
  created_at: number;
  updated_at: number;
}

export interface Professional {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  avatar?: string;
  is_active: number;
  created_at: number;
  updated_at: number;
}

export interface WorkingHours {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: number;
}

export interface Break {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: number;
}

export interface Appointment {
  id: string;
  user_id: string;
  professional_id?: string;
  date: string;
  start_time: string;
  total_duration: number;
  total_price: number;
  status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado' | 'nao_compareceu';
  source: string;
  client_notes?: string;
  admin_notes?: string;
  created_at: number;
  updated_at: number;
}

export interface AppointmentItem {
  id: string;
  appointment_id: string;
  service_id: string;
  service_name: string;
  duration_minutes: number;
  price: number;
  display_order: number;
}

export interface AppointmentWithDetails extends Appointment {
  user_name: string;
  user_phone: string;
  professional_name?: string;
  items: AppointmentItem[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export type AppointmentPayload = {
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
