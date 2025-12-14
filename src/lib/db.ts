// FILE: src/lib/db.ts
import type { D1Database } from '@cloudflare/workers-types';
import type { User, Admin, Service, Professional, Appointment, AppointmentWithDetails, ServiceCategory, WorkingHours, Break, AppointmentItem } from './types';
import { generateId } from './auth';

export class Database {
  constructor(private db: D1Database) {}

  async getUser(phone: string): Promise<User | null> {
    const result = await this.db.prepare('SELECT * FROM users WHERE phone = ?').bind(phone).first<User>();
    return result || null;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();
    return result || null;
  }

  async createUser(data: { name: string; phone: string; email?: string }): Promise<User> {
    const id = generateId('user');
    const now = Math.floor(Date.now() / 1000);
    await this.db
      .prepare('INSERT INTO users (id, name, phone, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, data.name, data.phone, data.email || null, now, now)
      .run();
    return { id, ...data, created_at: now, updated_at: now };
  }

  async updateUser(id: string, data: Partial<User>): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
    const values = fields.map(k => data[k as keyof User]);
    const sql = `UPDATE users SET ${fields.map(f => `${f} = ?`).join(', ')}, updated_at = ? WHERE id = ?`;
    await this.db.prepare(sql).bind(...values, now, id).run();
  }

  async getAdmin(email: string): Promise<Admin | null> {
    const result = await this.db.prepare('SELECT * FROM admins WHERE email = ?').bind(email).first<Admin>();
    return result || null;
  }

  async getAdminById(id: string): Promise<Admin | null> {
    const result = await this.db.prepare('SELECT * FROM admins WHERE id = ?').bind(id).first<Admin>();
    return result || null;
  }

  async getCategories(): Promise<ServiceCategory[]> {
    const result = await this.db.prepare('SELECT * FROM service_categories ORDER BY display_order ASC').all<ServiceCategory>();
    return result.results || [];
  }

  async getCategoryBySlug(slug: string): Promise<ServiceCategory | null> {
    const result = await this.db.prepare('SELECT * FROM service_categories WHERE slug = ?').bind(slug).first<ServiceCategory>();
    return result || null;
  }

  async getServices(filters?: { categoryId?: string; isFeatured?: boolean; isActive?: boolean }): Promise<Service[]> {
    let sql = 'SELECT * FROM services WHERE 1=1';
    const params: any[] = [];

    if (filters?.categoryId) {
      sql += ' AND category_id = ?';
      params.push(filters.categoryId);
    }
    if (filters?.isFeatured !== undefined) {
      sql += ' AND is_featured = ?';
      params.push(filters.isFeatured ? 1 : 0);
    }
    if (filters?.isActive !== undefined) {
      sql += ' AND is_active = ?';
      params.push(filters.isActive ? 1 : 0);
    }

    sql += ' ORDER BY name ASC';

    const result = await this.db.prepare(sql).bind(...params).all<Service>();
    return result.results || [];
  }

  async getServiceById(id: string): Promise<Service | null> {
    const result = await this.db.prepare('SELECT * FROM services WHERE id = ?').bind(id).first<Service>();
    return result || null;
  }

  async getServiceBySlug(slug: string): Promise<Service | null> {
    const result = await this.db.prepare('SELECT * FROM services WHERE slug = ?').bind(slug).first<Service>();
    return result || null;
  }

  async getProfessionals(activeOnly: boolean = true): Promise<Professional[]> {
    let sql = 'SELECT * FROM professionals';
    if (activeOnly) sql += ' WHERE is_active = 1';
    sql += ' ORDER BY name ASC';
    const result = await this.db.prepare(sql).all<Professional>();
    return result.results || [];
  }

  async getProfessionalById(id: string): Promise<Professional | null> {
    const result = await this.db.prepare('SELECT * FROM professionals WHERE id = ?').bind(id).first<Professional>();
    return result || null;
  }

  async getProfessionalsByService(serviceId: string): Promise<Professional[]> {
    const sql = `
      SELECT p.* FROM professionals p
      INNER JOIN professional_services ps ON ps.professional_id = p.id
      WHERE ps.service_id = ? AND p.is_active = 1
      ORDER BY p.name ASC
    `;
    const result = await this.db.prepare(sql).bind(serviceId).all<Professional>();
    return result.results || [];
  }

  async getWorkingHours(professionalId: string, dayOfWeek: number): Promise<WorkingHours[]> {
    const sql = 'SELECT * FROM working_hours WHERE professional_id = ? AND day_of_week = ? AND is_active = 1';
    const result = await this.db.prepare(sql).bind(professionalId, dayOfWeek).all<WorkingHours>();
    return result.results || [];
  }

  async getBreaks(professionalId: string, dayOfWeek: number): Promise<Break[]> {
    const sql = 'SELECT * FROM breaks WHERE professional_id = ? AND day_of_week = ? AND is_active = 1';
    const result = await this.db.prepare(sql).bind(professionalId, dayOfWeek).all<Break>();
    return result.results || [];
  }

  async getAppointmentsByDate(professionalId: string | null, date: string): Promise<Appointment[]> {
    let sql = 'SELECT * FROM appointments WHERE date = ? AND status != ?';
    const params: any[] = [date, 'cancelado'];

    if (professionalId) {
      sql += ' AND professional_id = ?';
      params.push(professionalId);
    }

    const result = await this.db.prepare(sql).bind(...params).all<Appointment>();
    return result.results || [];
  }

  async createAppointment(data: {
    userId: string;
    professionalId?: string;
    date: string;
    startTime: string;
    totalDuration: number;
    totalPrice: number;
    source: string;
    clientNotes?: string;
    items: Array<{ serviceId: string; serviceName: string; duration: number; price: number }>;
  }): Promise<string> {
    const appointmentId = generateId('appt');
    const now = Math.floor(Date.now() / 1000);
    const status = 'pendente';

    await this.db
      .prepare(`
        INSERT INTO appointments (id, user_id, professional_id, date, start_time, total_duration, total_price, status, source, client_notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        appointmentId,
        data.userId,
        data.professionalId || null,
        data.date,
        data.startTime,
        data.totalDuration,
        data.totalPrice,
        status,
        data.source,
        data.clientNotes || null,
        now,
        now
      )
      .run();

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const itemId = generateId('item');
      await this.db
        .prepare(`
          INSERT INTO appointment_items (id, appointment_id, service_id, service_name, duration_minutes, price, display_order)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(itemId, appointmentId, item.serviceId, item.serviceName, item.duration, item.price, i)
        .run();
    }

    return appointmentId;
  }

  async getAppointmentById(id: string): Promise<AppointmentWithDetails | null> {
    const appointment = await this.db
      .prepare(`
        SELECT a.*, u.name as user_name, u.phone as user_phone, p.name as professional_name
        FROM appointments a
        INNER JOIN users u ON u.id = a.user_id
        LEFT JOIN professionals p ON p.id = a.professional_id
        WHERE a.id = ?
      `)
      .bind(id)
      .first<AppointmentWithDetails>();

    if (!appointment) return null;

    const items = await this.db
      .prepare('SELECT * FROM appointment_items WHERE appointment_id = ? ORDER BY display_order ASC')
      .bind(id)
      .all<AppointmentItem>();

    appointment.items = items.results || [];
    return appointment;
  }

  async getUserAppointments(userId: string, status?: string): Promise<AppointmentWithDetails[]> {
    let sql = `
      SELECT a.*, u.name as user_name, u.phone as user_phone, p.name as professional_name
      FROM appointments a
      INNER JOIN users u ON u.id = a.user_id
      LEFT JOIN professionals p ON p.id = a.professional_id
      WHERE a.user_id = ?
    `;
    const params: any[] = [userId];

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY a.date DESC, a.start_time DESC';

    const result = await this.db.prepare(sql).bind(...params).all<AppointmentWithDetails>();
    const appointments = result.results || [];

    for (const appointment of appointments) {
      const items = await this.db
        .prepare('SELECT * FROM appointment_items WHERE appointment_id = ? ORDER BY display_order ASC')
        .bind(appointment.id)
        .all<AppointmentItem>();
      appointment.items = items.results || [];
    }

    return appointments;
  }

  async getAllAppointments(filters?: { status?: string; startDate?: string; endDate?: string }): Promise<AppointmentWithDetails[]> {
    let sql = `
      SELECT a.*, u.name as user_name, u.phone as user_phone, p.name as professional_name
      FROM appointments a
      INNER JOIN users u ON u.id = a.user_id
      LEFT JOIN professionals p ON p.id = a.professional_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.status) {
      sql += ' AND a.status = ?';
      params.push(filters.status);
    }
    if (filters?.startDate) {
      sql += ' AND a.date >= ?';
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      sql += ' AND a.date <= ?';
      params.push(filters.endDate);
    }

    sql += ' ORDER BY a.date DESC, a.start_time DESC';

    const result = await this.db.prepare(sql).bind(...params).all<AppointmentWithDetails>();
    const appointments = result.results || [];

    for (const appointment of appointments) {
      const items = await this.db
        .prepare('SELECT * FROM appointment_items WHERE appointment_id = ? ORDER BY display_order ASC')
        .bind(appointment.id)
        .all<AppointmentItem>();
      appointment.items = items.results || [];
    }

    return appointments;
  }

  async updateAppointmentStatus(id: string, status: string, adminNotes?: string): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    let sql = 'UPDATE appointments SET status = ?, updated_at = ?';
    const params: any[] = [status, now];

    if (adminNotes !== undefined) {
      sql += ', admin_notes = ?';
      params.push(adminNotes);
    }

    sql += ' WHERE id = ?';
    params.push(id);

    await this.db.prepare(sql).bind(...params).run();
  }

  async cancelAppointment(id: string, isAdmin: boolean = false): Promise<boolean> {
    const appointment = await this.getAppointmentById(id);
    if (!appointment) return false;

    const now = new Date();
    const appointmentDate = new Date(`${appointment.date}T${appointment.start_time}`);
    const hoursUntil = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (!isAdmin) {
      const maxCancelHours = await this.getSetting('max_cancel_hours');
      if (hoursUntil < parseInt(maxCancelHours || '24')) {
        return false;
      }
    }

    await this.updateAppointmentStatus(id, 'cancelado');
    return true;
  }

  async getSetting(key: string): Promise<string | null> {
    const result = await this.db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>();
    return result?.value || null;
  }

  async updateSetting(key: string, value: string): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    await this.db
      .prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)')
      .bind(key, value, now)
      .run();
  }

  async getReports(startDate: string, endDate: string) {
    const appointmentsBySource = await this.db
      .prepare('SELECT source, COUNT(*) as count FROM appointments WHERE date >= ? AND date <= ? GROUP BY source')
      .bind(startDate, endDate)
      .all<{ source: string; count: number }>();

    const appointmentsByStatus = await this.db
      .prepare('SELECT status, COUNT(*) as count FROM appointments WHERE date >= ? AND date <= ? GROUP BY status')
      .bind(startDate, endDate)
      .all<{ status: string; count: number }>();

    const topServices = await this.db
      .prepare(`
        SELECT ai.service_name, COUNT(*) as count
        FROM appointment_items ai
        INNER JOIN appointments a ON a.id = ai.appointment_id
        WHERE a.date >= ? AND a.date <= ?
        GROUP BY ai.service_name
        ORDER BY count DESC
        LIMIT 10
      `)
      .bind(startDate, endDate)
      .all<{ service_name: string; count: number }>();

    const topProfessionals = await this.db
      .prepare(`
        SELECT p.name, COUNT(*) as count
        FROM appointments a
        INNER JOIN professionals p ON p.id = a.professional_id
        WHERE a.date >= ? AND a.date <= ? AND a.professional_id IS NOT NULL
        GROUP BY p.name
        ORDER BY count DESC
        LIMIT 10
      `)
      .bind(startDate, endDate)
      .all<{ name: string; count: number }>();

    const revenue = await this.db
      .prepare('SELECT SUM(total_price) as total FROM appointments WHERE date >= ? AND date <= ? AND status = ?')
      .bind(startDate, endDate, 'concluido')
      .first<{ total: number }>();

    return {
      bySource: appointmentsBySource.results || [],
      byStatus: appointmentsByStatus.results || [],
      topServices: topServices.results || [],
      topProfessionals: topProfessionals.results || [],
      revenue: revenue?.total || 0
    };
  }
}
