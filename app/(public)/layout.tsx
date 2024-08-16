import LoginSignButton from '../../components/login-signup-button';
import { validateRequest } from '@/app/auth/auth';
import { redirect } from 'next/navigation';

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, session } = await validateRequest();
  console.log("===========");
  console.log(user, session);
  if (user && session) {
    redirect('/dashboard');
  }
  return (
    <div>
      <div className="border-b border-gray-100 bg-white">
        <div className="container mx-auto flex max-w-7xl items-center justify-end p-4">
          <div className="flex items-center space-x-4">
            <LoginSignButton></LoginSignButton>
          </div>
        </div>
      </div>

      <main className="container mx-auto flex max-w-7xl justify-center">
        {children}
      </main>
    </div>
  );
}
