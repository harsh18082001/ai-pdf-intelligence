import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { useVerifyEmailMutation } from '@/api/authApi';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [verifyEmail] = useVerifyEmailMutation();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) {
      setStatus('error');
      return;
    }
    verifyEmail({ token })
      .unwrap()
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token, verifyEmail]);

  return (
    <AuthLayout title="Email verification" description="">
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        {status === 'verifying' && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Verifying your email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="h-8 w-8 text-success" />
            <p className="text-sm">Your email is verified.</p>
            <Button asChild className="mt-2">
              <Link to="/">Go to DocIQ</Link>
            </Button>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              This verification link is invalid or has expired.
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
