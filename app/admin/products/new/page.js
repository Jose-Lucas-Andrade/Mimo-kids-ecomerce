import { cookies } from 'next/headers';
import { verifySession } from '../../../../lib/auth';
import ProductForm from './ProductForm';

export default async function NewProduct({ searchParams }){
  const token = cookies().get('admin_session')?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || session.role !== 'ADMIN') return <div>Acesso negado.</div>;

  return <ProductForm hasError={Boolean(searchParams?.error)} />;
}
