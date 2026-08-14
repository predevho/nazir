import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createServerClient } from '@/lib/supabase';
import { isBotUserAgent } from '@/lib/visitorGuard';

function hashIp(req: Request): string {
  const ip =
    req.headers.get('x-real-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  if (!ip) return '';
  const salt = process.env.VISIT_IP_SALT || 'nazir-visit';
  return createHash('sha256').update(`${ip}:${salt}`).digest('hex');
}

export async function POST(req: Request) {
  try {
    if (isBotUserAgent(req.headers.get('user-agent') ?? '')) {
      return new NextResponse(null, { status: 204 });
    }
    const { visitorId } = await req.json();
    if (typeof visitorId === 'string' && visitorId.length >= 8 && visitorId.length <= 64) {
      const supabase = createServerClient();
      if (supabase) {
        await supabase.rpc('record_visit', { p_visitor_id: visitorId, p_ip_hash: hashIp(req) });
      }
    }
  } catch {
    // 집계 실패는 무시(사용자 경험 우선)
  }
  return new NextResponse(null, { status: 204 });
}
