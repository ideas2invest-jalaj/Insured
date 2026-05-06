import '../globals.css';
import { AuthProvider } from '@/lib/authContext';

export const metadata = {
  title: 'Login - Insurance Renewal Portal',
  description: 'Login to your account',
};

export default function AuthLayout({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <AuthProvider>{children}</AuthProvider>
    </div>
  );
}
