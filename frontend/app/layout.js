import './globals.css';
import { AuthProvider } from '@/lib/authContext';

export const metadata = {
  title: 'Insurance Renewal Management Portal',
  description: 'Manage client policies, track renewals, and automate alerts',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
