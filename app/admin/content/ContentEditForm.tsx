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
          <legend className="font-display text-xl text-gold mb-2">{section.title}</legend>
          {section.fields.map((f) => (
            <label key={f.key} className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] tracking-[0.12em] text-paper/60">{f.label}</span>
              {f.multiline ? (
                <textarea
                  name={f.key}
                  defaultValue={values[f.key] ?? ''}
                  rows={3}
                  className="px-3.5 py-2.5 bg-velvet border border-gold/25 rounded-sm text-paper text-sm focus:border-gold/60 outline-none resize-y"
                />
              ) : (
                <input
                  type="text"
                  name={f.key}
                  defaultValue={values[f.key] ?? ''}
                  className="min-h-[44px] px-3.5 bg-velvet border border-gold/25 rounded-sm text-paper text-sm focus:border-gold/60 outline-none"
                />
              )}
            </label>
          ))}
        </fieldset>
      ))}
      <div className="flex items-center gap-4 sticky bottom-0 bg-stage/90 backdrop-blur py-4">
        <button
          type="submit"
          disabled={pending}
          className="min-h-[48px] px-6 bg-gold text-ink font-body font-medium rounded-sm hover:bg-gold-soft transition-colors disabled:opacity-60"
        >
          {pending ? '저장 중…' : '저장'}
        </button>
        {state.message && <span className={`text-sm ${state.ok ? 'text-gold' : 'text-red-400'}`}>{state.message}</span>}
      </div>
    </form>
  );
}
