import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField } from '@/components/auth/FormField';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertCircle } from 'lucide-react';
import { useResetPasswordMutation } from '@/api/authApi';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const navigate = useNavigate();

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <EmptyState
          icon={AlertCircle}
          title="Invalid reset link"
          description="This password reset link is missing or malformed."
          action={
            <Button asChild>
              <Link to="/forgot-password">Request a new link</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await resetPassword({ token, password }).unwrap();
      toast.success('Password reset — log in with your new password.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error?.data?.error || 'This reset link is invalid or has expired.');
    }
  };

  return (
    <AuthLayout title="Set a new password" description="Choose a strong password for your account.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          label="New password"
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
          {isLoading ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
