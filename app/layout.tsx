import './global.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CAS Simulator',
  description: 'Practice CAS exam scenarios with instant GPT feedback',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
