import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { visitorId } = await req.json();
    if (typeof visitorId === 'string' && visitorId.length >= 8 && visitorId.length <= 64) {
      const supabase = createServerClient();
      if (supabase) await supabase.rpc('record_visit', { p_visitor_id: visitorId });
    }
  } catch {
    // 집계 실패는 무시(사용자 경험 우선)
  }
  return new NextResponse(null, { status: 204 });
}
