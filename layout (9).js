import './globals.css';
import { Literata, Figtree } from 'next/font/google';

const serif = Literata({ subsets: ['latin'], variable: '--font-serif', display: 'swap' });
const sans = Figtree({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata = {
  title: 'Abundra',
  description: 'Run your courses, community, and teaching business in one place.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
