import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { LoginForm } from '@/components/admin/LoginForm';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user?.role === 'editor') {
    redirect('/admin/dashboard');
  }

  return (
    <div className="admin-login admin-body-login">
      <LoginForm />
    </div>
  );
}
