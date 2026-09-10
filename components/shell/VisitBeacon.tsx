'use client';
import { useEffect, useRef } from 'react';
import { getOrCreateVisitorId } from '@/lib/visits';

/** 공개 페이지 로드 시 1회 방문 비콘 전송. 실패는 조용히 무시. */
export function VisitBeacon() {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const { id, setCookie } = getOrCreateVisitorId(document.cookie, () => crypto.randomUUID());
    if (setCookie) document.cookie = setCookie;
    fetch('/api/visit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ visitorId: id }),
      keepalive: true,
    }).catch(() => {});
  }, []);
  return null;
}
