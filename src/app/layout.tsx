import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Student Seminar Feedback & Topic Wishlist',
  description: 'Share your opinion on our workshops and suggest topics for upcoming senior-junior tech seminars.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
        {children}
      </body>
    </html>
  );
}
