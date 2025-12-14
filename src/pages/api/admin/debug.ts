// FILE: src/pages/api/admin/debug.ts
import type { APIRoute } from 'astro';
import { Database } from '../../../lib/db';
import bcrypt from 'bcryptjs';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = new Database(locals.runtime.env.DB);
    const admin = await db.getAdmin('admin@imperiocorte.com');
    
    if (!admin) {
      return new Response(JSON.stringify({ 
        error: 'Admin not found',
        message: 'Nenhum admin encontrado com este email'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const testPassword = 'admin123';
    const isValid = await bcrypt.compare(testPassword, admin.password_hash);

    return new Response(JSON.stringify({ 
      found: true,
      email: admin.email,
      name: admin.name,
      hash: admin.password_hash,
      testPassword: testPassword,
      passwordMatches: isValid,
      message: isValid ? 'Senha correta!' : 'Senha incorreta - hash não corresponde'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};