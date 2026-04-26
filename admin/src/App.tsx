import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AuthGuard from './components/AuthGuard';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Banks from './pages/Banks';
import Rates from './pages/Rates';
import Promos from './pages/Promos';
import Tips from './pages/Tips';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Checklist from './pages/Checklist';

function AdminShell() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/banks" element={<Banks />} />
          <Route path="/rates" element={<Rates />} />
          <Route path="/promos" element={<Promos />} />
          <Route path="/tips" element={<Tips />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/checklist" element={<Checklist />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <AuthGuard>
              <AdminShell />
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
