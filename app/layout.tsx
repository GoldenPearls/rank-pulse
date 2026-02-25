import './globals.css';
import type { Metadata } from 'next';
import Nav from './components/Nav';

export const metadata: Metadata = {
  title: '개인용 키워드 도구',
  description: '네이버 블로그/키워드 분석 · 개인용 대시보드',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Nav />
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
