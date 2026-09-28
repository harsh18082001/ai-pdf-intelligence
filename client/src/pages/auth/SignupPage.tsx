import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField } from '@/components/auth/FormField';
import { Button } from '@/components/ui/button';
import { useRegisterMutation } from '@/api/authApi';
import { useAuth } from '@/context/AuthContext';

export function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, { isLoading }] = useRegisterMutation();
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await register({ email, password, name: name || undefined }).unwrap();
      setUser(user);
      toast.success('Account created — check your inbox to verify your email.');
      navigate('/');
    } catch (error: any) {
      toast.error(error?.data?.error || 'Could not create account');
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      description="Any documents you've uploaded as a guest come with you."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-foreground hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Name (optional)" type="text" value={name} onChange={setName} required={false} />
        <FormField label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <FormField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        >
          <span className="text-xs text-muted-foreground">
            At least 10 characters, with uppercase, lowercase, and a number.
          </span>
        </FormField>
        <Button type="submit" className="mt-2" disabled={isLoading}>
          {isLoading ? 'Creating account…' : 'Sign up'}
        </Button>
      </form>
    </AuthLayout>
  );
}
