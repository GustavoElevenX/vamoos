import { SidebarProvider } from '@/components/layout/sidebar';
import { UserProvider } from '@/contexts/user-context';
import { Toaster } from 'sonner';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <SidebarProvider>{children}</SidebarProvider>
      <Toaster position="bottom-right" theme="dark" richColors />
    </UserProvider>
  );
}
