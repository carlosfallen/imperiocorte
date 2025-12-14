/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    user?: {
      id: string;
      name: string;
      phone: string;
      email?: string;
    };
    admin?: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }
}

interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  JWT_SECRET: string;
  WHATSAPP_NUMBER: string;
  SALON_NAME: string;
}