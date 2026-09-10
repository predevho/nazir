export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="border-b border-ds-key2/15 px-5 py-4">
        <span className="font-heir text-lg text-ds-key2">나지르</span>
        <span className="font-mono text-[10px] tracking-[0.2em] text-ds-text/40 ml-2">ADMIN</span>
      </div>
      {children}
    </div>
  );
}
