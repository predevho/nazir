import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createReadClient } from '@/lib/supabase/read';
import { isBotUserAgent } from '@/lib/visitorGuard';
import { checkSubmission } from '@/lib/guestbook';

/** 방문자 집계와 같은 방식으로 IP를 해시해 둔다. 원본 IP는 저장하지 않는다. */
function hashIp(req: Request): string {
  const ip =
    req.headers.get('x-real-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  if (!ip) return '';
  const salt = process.env.VISIT_IP_SALT || 'nazir-visit';
  return createHash('sha256').update(`${ip}:${salt}`).digest('hex');
}

export async function POST(req: Request) {
  if (isBotUserAgent(req.headers.get('user-agent') ?? '')) {
    return NextResponse.json({ ok: false, reason: 'bot' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: 'body' }, { status: 400 });
  }

  const check = checkSubmission({
    name: body.name,
    message: body.message,
    honeypot: body.website,
    elapsedMs: body.elapsedMs,
  });
  if (!check.ok) {
    // 허니팟·너무 빠른 제출은 봇이다. 무엇에 걸렸는지 알려주면 우회를 도와주는 셈이라
    // 사용자에게는 일반 오류로만 응답한다.
    const quiet = check.reason === 'honeypot' || check.reason === 'tooFast';
    return NextResponse.json(
      { ok: false, reason: quiet ? 'rejected' : check.reason },
      { status: 400 },
    );
  }

  const supabase = createReadClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, reason: 'unavailable' }, { status: 503 });
  }

  const { data, error } = await supabase.rpc('submit_guestbook_entry', {
    p_name: String(body.name).trim(),
    p_message: String(body.message).trim(),
    p_ip_hash: hashIp(req),
  });
  if (error) {
    return NextResponse.json({ ok: false, reason: 'unavailable' }, { status: 503 });
  }

  const result = (data ?? {}) as { ok?: boolean; held?: boolean; reason?: string };
  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason ?? 'rejected' }, { status: 400 });
  }
  return NextResponse.json({ ok: true, held: result.held === true });
}
