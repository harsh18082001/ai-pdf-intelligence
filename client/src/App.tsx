import { Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { DocumentPage } from './pages/DocumentPage';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="documents/:id" element={<DocumentPage />} />
        </Route>
      </Routes>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default App;
