'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links: Array<{ href: string; label: string }> = [
  { href: '/', label: '대시보드' },
  { href: '/candidates', label: '키워드 후보' },
  { href: '/expand', label: '키워드 확장' },
  { href: '/analyze', label: '키워드 분석' },
  { href: '/track', label: '추적' },
  { href: '/ideas', label: 'AI 아이디어' },
  { href: '/settings', label: '설정' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <div
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(2,6,23,0.55)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>개인용 키워드 도구</div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="badge"
                style={{
                  borderColor: active ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.10)',
                  background: active ? 'rgba(34,197,94,0.12)' : 'rgba(2,6,23,0.35)',
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
