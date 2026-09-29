import './globals.css';
import { cookies } from 'next/headers';
import Header from '../components/Header';
import Footer from '../components/StoreFooter';
import { verifySession } from '../lib/auth';

export const metadata = {
  title: 'Mimo Kids Store',
  description: 'Loja online com papelaria, mochilas e brinquedos para rotina escolar e presentes.',
};

export default async function RootLayout({ children }) {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_session')?.value;
  const session = token ? await verifySession(token) : null;
  const isAdmin = !!session?.role && session.role === 'ADMIN';

  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col">
        <Header isAdmin={isAdmin} />
        <main className="container flex-1 py-6 sm:py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
