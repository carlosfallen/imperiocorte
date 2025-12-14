// FILE: src/pages/api/admin/login.ts
import type { APIRoute } from 'astro';
import { Database } from '../../../lib/db';
import { verifyPassword, createAdminToken } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const body = await request.json() as { email: string; password: string };
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'E-mail e senha são obrigatórios' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = new Database(locals.runtime.env.DB);
    const admin = await db.getAdmin(email);

    if (!admin || !(await verifyPassword(password, admin.password_hash))) {
      return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = await createAdminToken(admin.id, locals.runtime.env.JWT_SECRET);
    
    cookies.set('admin_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

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