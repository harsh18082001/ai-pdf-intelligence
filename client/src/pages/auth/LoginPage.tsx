import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField } from '@/components/auth/FormField';
import { Button } from '@/components/ui/button';
import { useLoginMutation } from '@/api/authApi';
import { useAuth } from '@/context/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await login({ email, password }).unwrap();
      setUser(user);
      toast.success('Welcome back');
      navigate('/');
    } catch (error: any) {
      toast.error(error?.data?.error || 'Invalid email or password');
    }
  };

  return (
    <AuthLayout
      title="Log in"
      description="Your guest documents will merge into your account automatically."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-medium text-foreground hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <FormField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        >
          <Link to="/forgot-password" className="self-end text-xs text-muted-foreground hover:underline">
            Forgot password?
          </Link>
        </FormField>
        <Button type="submit" className="mt-2" disabled={isLoading}>
          {isLoading ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
