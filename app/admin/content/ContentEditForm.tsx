'use client';
import { useActionState } from 'react';
import { ADMIN_SECTIONS } from '@/lib/adminFields';
import { saveContent, type SaveState } from './actions';

const initial: SaveState = { ok: false, message: '' };

export function ContentEditForm({ values }: { values: Record<string, string> }) {
  const [state, formAction, pending] = useActionState(saveContent, initial);
  return (
    <form action={formAction} className="flex flex-col gap-10">
      {ADMIN_SECTIONS.map((section) => (
        <fieldset key={section.title} className="flex flex-col gap-4 border-0 m-0 p-0">
          <legend className="font-heir text-xl text-ds-key2">{section.title}</legend>
          {/*
            이 묶음이 어느 화면으로 나가는지 밝힌다. 칸 이름만 보고는 `조회수 안내 문구`가
            어느 페이지의 어느 자리인지 알 수 없어, 고치고 나서 사이트를 뒤져 확인해야 했다.
          */}
          <p className="-mt-1 mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ds-text/45">
            <span>나오는 곳</span>
            {section.where.map((w) => (
              <a
                key={w.path + w.label}
                href={w.path}
                target="_blank"
                rel="noopener"
                className="underline decoration-ds-text/25 underline-offset-4 hover:text-ds-key2"
              >
                {w.label} ↗
              </a>
            ))}
          </p>
          {section.fields.map((f) => (
            <label key={f.key} className="flex flex-col gap-1.5">
              <span className="text-[11px] tracking-[0.12em] text-ds-text/60">{f.label}</span>
              {f.multiline ? (
                <textarea
                  name={f.key}
                  defaultValue={values[f.key] ?? ''}
                  rows={3}
                  className="px-3.5 py-2.5 bg-ds-panel border border-ds-key2/25 rounded-sm text-ds-text text-sm focus:border-ds-key2/60 outline-none resize-y"
                />
              ) : (
                <input
                  type="text"
                  name={f.key}
                  defaultValue={values[f.key] ?? ''}
                  className="min-h-[44px] px-3.5 bg-ds-panel border border-ds-key2/25 rounded-sm text-ds-text text-sm focus:border-ds-key2/60 outline-none"
                />
              )}
            </label>
          ))}
        </fieldset>
      ))}
      <div className="flex items-center gap-4 sticky bottom-0 bg-ds-bg/90 backdrop-blur py-4">
        <button
          type="submit"
          disabled={pending}
          className="min-h-[48px] px-6 bg-ds-key2 text-ds-key1 font-medium rounded-sm hover:opacity-90 transition-colors disabled:opacity-60"
        >
          {pending ? '저장 중…' : '저장'}
        </button>
        {state.message && <span className={`text-sm ${state.ok ? 'text-ds-key2' : 'text-red-400'}`}>{state.message}</span>}
      </div>
    </form>
  );
}
