import type { Request, Response, NextFunction } from 'express';
import env from '@config/env';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

interface IMaintenanceCache {
  enabled: boolean;
  type: 'marquee' | 'fullscreen';
  message: string;
}

let cachedSettings: IMaintenanceCache | null = null;
let lastFetch = 0;
const CACHE_TTL = 10_000; // 10 seconds

async function getMaintenanceSettings(): Promise<IMaintenanceCache> {
  const now = Date.now();
  if (cachedSettings && now - lastFetch < CACHE_TTL) {
    return cachedSettings;
  }

  try {
    const MaintenanceSettings = mongoose.models.MaintenanceSettings;
    if (MaintenanceSettings) {
      const settings = await MaintenanceSettings.findOne().lean() as IMaintenanceCache | null;
      if (settings) {
        cachedSettings = settings;
        lastFetch = now;
        return settings;
      }
    }
  } catch {
    // DB not available, fall through to env
  }

  return {
    enabled: env.MAINTENANCE_MODE,
    type: 'fullscreen',
    message: env.MAINTENANCE_MESSAGE,
  };
}

function isAdminRequest(req: Request): boolean {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, env.JWT_SECRET) as { role?: string };
    return decoded.role === 'admin';
  } catch {
    return false;
  }
}

export async function maintenanceMode(req: Request, res: Response, next: NextFunction): Promise<void> {
  const path = req.path;

  // Always allow: health, metrics, docs, auth/login/signup, public maintenance endpoint
  if (
    path.startsWith('/health') ||
    path === '/metrics' ||
    path.startsWith('/api-docs') ||
    path.startsWith('/api/auth') ||
    path === '/api/signup' ||
    path.includes('/public/maintenance') ||
    path.includes('/admin/login')
  ) {
    return next();
  }

  const settings = await getMaintenanceSettings();

  if (!settings.enabled) {
    return next();
  }

  // Fullscreen mode — block everyone except admin users
  if (settings.type === 'fullscreen') {
    // Admin bypass — let authenticated admins through
    if (isAdminRequest(req)) {
      res.setHeader('X-Maintenance-Mode', 'bypass');
      return next();
    }

    res.status(503).json({
      success: false,
      message: settings.message || env.MAINTENANCE_MESSAGE,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        details: 'The application is currently under maintenance. Please try again later.',
      },
    });
    return;
  }

  // Marquee mode — let requests through, frontend handles display
  res.setHeader('X-Maintenance-Mode', 'marquee');
  res.setHeader('X-Maintenance-Message', encodeURIComponent(settings.message || ''));

  next();
}

// Call after admin updates maintenance settings
export function bustMaintenanceCache(): void {
  cachedSettings = null;
  lastFetch = 0;
}
