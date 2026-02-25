'use client';

export default function Alert({ kind, title, children }: { kind: 'ok' | 'warn' | 'err'; title: string; children?: React.ReactNode }) {
  const cls = kind === 'ok' ? 'ok' : kind === 'warn' ? 'warn' : 'err';
  return (
    <div className={`card`} style={{ borderColor: kind === 'ok' ? 'rgba(34,197,94,0.35)' : kind === 'warn' ? 'rgba(251,191,36,0.35)' : 'rgba(239,68,68,0.35)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className={`badge ${cls}`}>{kind.toUpperCase()}</span>
        <div style={{ fontWeight: 800 }}>{title}</div>
      </div>
      {children ? <div className="muted" style={{ marginTop: 8, lineHeight: 1.5 }}>{children}</div> : null}
    </div>
  );
}
