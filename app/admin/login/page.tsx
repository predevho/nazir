'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.');
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  return (
    <section className="max-w-[400px] mx-auto px-5 py-[clamp(48px,9vw,88px)]">
      <p className="font-mono text-[11px] tracking-[0.2em] text-gold mb-3">ADMIN</p>
      <h1 className="font-display font-bold text-[clamp(26px,6vw,34px)] text-paper mb-8">관리자 로그인</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] tracking-[0.14em] text-paper/60">이메일</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-[48px] px-3.5 bg-velvet border border-gold/25 rounded-sm text-paper focus:border-gold/60 outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] tracking-[0.14em] text-paper/60">비밀번호</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-[48px] px-3.5 bg-velvet border border-gold/25 rounded-sm text-paper focus:border-gold/60 outline-none"
          />
        </label>
        {error && <p className="text-[13px] text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="min-h-[52px] bg-gold text-ink font-body font-medium rounded-sm hover:bg-gold-soft transition-colors disabled:opacity-60"
        >
          {loading ? '로그인 중…' : '로그인'}
        </button>
      </form>
    </section>
  );
}
