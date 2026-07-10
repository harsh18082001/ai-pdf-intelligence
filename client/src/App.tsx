import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { DocumentPage } from './pages/DocumentPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="documents/:id" element={<DocumentPage />} />
      </Route>
    </Routes>
  );
}

export default App;
