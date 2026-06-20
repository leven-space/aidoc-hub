import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';

export const SHARE_GRANT_COOKIE = 'shareGrant';

function getShareCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  };
}

function readCookie(req: Request, name: string): string | null {
  const cookieHeader = req?.headers?.cookie;
  if (!cookieHeader) return null;
  const entry = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!entry) return null;
  return decodeURIComponent(entry.slice(name.length + 1));
}

export function setShareGrantCookie(
  res: Response,
  jwtService: JwtService,
  shareToken: string,
) {
  const grant = jwtService.sign({ shareToken }, { expiresIn: '24h' });
  res.cookie(SHARE_GRANT_COOKIE, grant, getShareCookieOptions());
}

export function hasValidShareGrant(
  req: Request,
  jwtService: JwtService,
  shareToken: string,
): boolean {
  const grant = readCookie(req, SHARE_GRANT_COOKIE);
  if (!grant) return false;
  try {
    const payload = jwtService.verify<{ shareToken: string }>(grant);
    return payload.shareToken === shareToken;
  } catch {
    return false;
  }
}

export function clearShareGrantCookie(res: Response) {
  res.clearCookie(SHARE_GRANT_COOKIE, { path: '/' });
}
