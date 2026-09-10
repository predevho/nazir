'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MESSAGE_MAX, NAME_MAX } from '@/lib/guestbook';
import { Chevron } from '@/components/ui/Chevron';

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
      {/*
        시안은 781 폭 한 줄이다. 그 비율을 390 화면에 그대로 두면 메시지 칸이 167px 밖에
        남지 않아 쓴 글이 보이지 않으므로, sm 미만에서는 세로로 쌓는다.

        입력 글자는 모바일에서 16px이다. 15px 이하면 iOS 사파리가 포커스할 때
        화면을 확대해 버리고, 확대된 상태로 남아 이후 스크롤이 어긋난다.
      */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-4">
        <label className="sm:flex-none">
          <span className="sr-only">이름</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={NAME_MAX}
            required
            autoComplete="off"
            placeholder="이름"
            className="w-full border-0 border-b border-ds-text/40 bg-transparent pb-2 text-center font-heir text-[16px] text-ds-text outline-none placeholder:text-ds-text/40 focus:border-ds-key2 sm:w-[110px] sm:text-[15px]"
          />
        </label>
        <label className="min-w-0 sm:flex-1">
          <span className="sr-only">메시지</span>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={MESSAGE_MAX}
            required
            autoComplete="off"
            placeholder="메시지를 남겨주세요"
            className="w-full border-0 border-b border-ds-text/40 bg-transparent pb-2 text-center font-heir text-[16px] text-ds-text outline-none placeholder:text-ds-text/40 focus:border-ds-key2 sm:text-[15px]"
          />
        </label>
        <button
          type="submit"
          disabled={status.kind === 'sending'}
          aria-label="응원 남기기"
          className="tap-target flex h-11 w-full flex-none cursor-pointer items-center justify-center gap-2 rounded border border-ds-key2/50 font-heir text-[16px] text-ds-text transition-colors hover:text-ds-key2 disabled:opacity-40 sm:h-auto sm:w-auto sm:rounded-none sm:border-0 sm:pb-2 sm:text-[18px]"
        >
          {/* 한 줄 폼에서는 시안대로 화살표만, 쌓였을 때는 무엇을 누르는지 글자로 밝힌다. */}
          <span className="sm:hidden">응원 남기기</span>
          <Chevron dir="right" />
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
