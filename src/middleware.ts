// FILE: src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { verifyUserToken, verifyAdminToken } from './lib/auth';
import { Database } from './lib/db';

export const onRequest = defineMiddleware(async (context, next) => {
  const runtime = context.locals.runtime;
  const db = new Database(runtime.env.DB);

  const userToken = context.cookies.get('user_token')?.value;
  if (userToken) {
    const userId = await verifyUserToken(userToken, runtime.env.JWT_SECRET);
    if (userId) {
      const user = await db.getUserById(userId);
      if (user) {
        context.locals.user = {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email
        };
      }
    }
  }

  const adminToken = context.cookies.get('admin_token')?.value;
  if (adminToken) {
    const adminId = await verifyAdminToken(adminToken, runtime.env.JWT_SECRET);
    if (adminId) {
      const admin = await db.getAdminById(adminId);
      if (admin) {
        context.locals.admin = {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        };
      }
    }
  }

  if (context.url.pathname.startsWith('/cliente') && !context.locals.user) {
    return context.redirect('/login');
  }

  if (
    context.url.pathname.startsWith('/admin') && 
    !context.url.pathname.startsWith('/admin/login') &&
    !context.url.pathname.startsWith('/api/admin/login') &&
    !context.locals.admin
  ) {
    return context.redirect('/admin/login');
  }

  return next();
});