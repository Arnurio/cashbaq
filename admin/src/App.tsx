import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { ToastProvider } from './components/Toast';
import Dashboard from './pages/Dashboard';
import Banks from './pages/Banks';
import Categories from './pages/Categories';
import Rates from './pages/Rates';
import Promos from './pages/Promos';
import Tips from './pages/Tips';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/banks" element={<Banks />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/rates" element={<Rates />} />
              <Route path="/promos" element={<Promos />} />
              <Route path="/tips" element={<Tips />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
