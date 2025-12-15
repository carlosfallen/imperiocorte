import type { APIRoute } from 'astro';
import { Database } from '../../../lib/db';
import { verifyPassword, createAdminToken } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'E-mail e senha são obrigatórios' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = new Database(locals.runtime.env.DB);
    const admin = await db.getAdmin(email);

    if (!admin) {
      return new Response(JSON.stringify({ error: 'E-mail não encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isPasswordValid = await verifyPassword(password, admin.password_hash);

    if (!isPasswordValid) {
      return new Response(JSON.stringify({ error: 'Senha incorreta' }), {
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
