'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usernameToEmail } from '@/lib/adminUsername';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    setLoading(false);
    if (error) {
      setError('로그인에 실패했습니다. 아이디와 비밀번호를 확인해 주세요.');
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  return (
    <section className="max-w-[400px] mx-auto px-5 py-[clamp(48px,9vw,88px)]">
      <p className="text-[11px] tracking-[0.2em] text-ds-key2 mb-3">ADMIN</p>
      <h1 className="font-heir font-bold text-[clamp(26px,6vw,34px)] text-ds-text mb-8">관리자 로그인</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] tracking-[0.14em] text-ds-text/60">아이디</span>
          <input
            type="text"
            required
            autoComplete="username"
            autoCapitalize="none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="min-h-[48px] px-3.5 bg-ds-panel border border-ds-key2/25 rounded-sm text-ds-text focus:border-ds-key2/60 outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] tracking-[0.14em] text-ds-text/60">비밀번호</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-[48px] px-3.5 bg-ds-panel border border-ds-key2/25 rounded-sm text-ds-text focus:border-ds-key2/60 outline-none"
          />
        </label>
        {error && <p className="text-[13px] text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="min-h-[52px] bg-ds-key2 text-ds-key1 font-medium rounded-sm hover:opacity-90 transition-colors disabled:opacity-60"
        >
          {loading ? '로그인 중…' : '로그인'}
        </button>
      </form>
    </section>
  );
}
