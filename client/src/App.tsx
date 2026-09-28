import { Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { DocumentPage } from './pages/DocumentPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { Toaster } from './components/ui/sonner';
import { useDocumentHead } from './hooks/useDocumentHead';

const SOFTWARE_APPLICATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'DocIQ',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'DocIQ turns PDFs into searchable, chattable knowledge — upload a document and get instant summaries, key points, and AI-powered answers grounded in its content.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

function App() {
  useDocumentHead({
    title: 'DocIQ - AI-Powered PDF Intelligence',
    description:
      'Upload any PDF and get instant summaries, key points, and a chat assistant grounded in its content. No sign-up required to try it.',
    jsonLd: SOFTWARE_APPLICATION_JSON_LD,
  });

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="documents/:id" element={<DocumentPage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Routes>
      <Toaster position="bottom-right" />
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default App;
