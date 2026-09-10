'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MESSAGE_MAX, NAME_MAX } from '../lib/guestbook';

type Status = { kind: 'idle' | 'sending' } | { kind: 'done' | 'error'; message: string };

const MESSAGES: Record<string, string> = {
  name: '이름을 확인해 주세요.',
  message: '메시지를 확인해 주세요.',
  rate: '잠시 후 다시 시도해 주세요. 짧은 시간에 너무 많이 등록되었습니다.',
  unavailable: '지금은 등록할 수 없습니다. 잠시 후 다시 시도해 주세요.',
  rejected: '등록하지 못했습니다. 다시 시도해 주세요.',
};

/**
 * 시안 상단 한 줄 입력 폼: `이름` · `메시지를 남겨주세요` · `→`.
 *
 * 봇 대응 중 허니팟과 제출 시간 검사가 여기서 시작된다(docs/decisions.md C-4).
 * 둘 다 사용자가 체감하지 않는다 — 숨은 칸은 보이지 않고, 시간은 폼을 연 순간부터 잰다.
 */
export function GuestbookForm() {
  const router = useRouter();
  const openedAt = useRef(Date.now());
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status.kind === 'sending') return;
    setStatus({ kind: 'sending' });
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          message,
          website: honeypot,
          elapsedMs: Date.now() - openedAt.current,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; held?: boolean; reason?: string };
      if (!data.ok) {
        setStatus({ kind: 'error', message: MESSAGES[data.reason ?? 'rejected'] ?? MESSAGES.rejected });
        return;
      }
      setName('');
      setMessage('');
      openedAt.current = Date.now();
      setStatus({
        kind: 'done',
        message: data.held
          ? '등록되었습니다. 링크가 포함된 글은 확인 후 공개됩니다.'
          : '등록되었습니다. 고맙습니다.',
      });
      // 새 글은 항상 1페이지 맨 앞에 붙는다. 뒤 페이지에서 남겼다면 그리로 보내야
      // 방금 쓴 쪽지가 보인다.
      router.push('/guestbook');
      router.refresh();
    } catch {
      setStatus({ kind: 'error', message: MESSAGES.unavailable });
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-[781px]">
      <div className="flex items-end gap-4">
        <label className="flex-none">
          <span className="sr-only">이름</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={NAME_MAX}
            required
            autoComplete="off"
            placeholder="이름"
            className="w-[110px] border-0 border-b border-ds-text/40 bg-transparent pb-2 text-center font-heir text-[15px] text-ds-text outline-none placeholder:text-ds-text/40 focus:border-ds-key2"
          />
        </label>
        <label className="min-w-0 flex-1">
          <span className="sr-only">메시지</span>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={MESSAGE_MAX}
            required
            autoComplete="off"
            placeholder="메시지를 남겨주세요"
            className="w-full border-0 border-b border-ds-text/40 bg-transparent pb-2 text-center font-heir text-[15px] text-ds-text outline-none placeholder:text-ds-text/40 focus:border-ds-key2"
          />
        </label>
        <button
          type="submit"
          disabled={status.kind === 'sending'}
          aria-label="응원 남기기"
          className="flex-none cursor-pointer pb-2 font-heir text-[18px] text-ds-text transition-colors hover:text-ds-key2 disabled:opacity-40"
        >
          ›
        </button>
      </div>

      {/* 봇용 미끼. 사람에게는 보이지 않고 자동완성도 끈다. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {status.kind === 'done' && (
        <p role="status" className="mt-4 text-center font-heir text-[14px] text-ds-key2">
          {status.message}
        </p>
      )}
      {status.kind === 'error' && (
        <p role="alert" className="mt-4 text-center font-heir text-[14px] text-ds-text/70">
          {status.message}
        </p>
      )}
    </form>
  );
}
