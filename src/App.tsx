import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Users, LayoutDashboard, HeartPulse, Plus } from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { Contacts } from './pages/Contacts';
import { useReminders } from './hooks/useReminders';
import { CreateEntityModal } from './components/CreateEntityModal';

function AppContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  useReminders(); // Start automations
  const location = useLocation();

  const navLinkStyle = (path: string) => ({
    color: location.pathname === path ? 'var(--accent-color)' : 'var(--text-secondary)',
    textDecoration: 'none',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'var(--transition)',
    background: location.pathname === path ? 'var(--card-blue)' : 'transparent',
    padding: '10px 18px',
    borderRadius: '16px'
  });

  return (
    <>
      <header className="glass-panel" style={{ padding: '1rem 1.5rem', margin: '1rem 1.5rem', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <HeartPulse size={26} color="#f43f5e" />
          Family CRM
        </h1>
        <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button type="button" onClick={() => setIsModalOpen(true)} style={{ background: 'var(--text-primary)', color: '#fff', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }} title="Добавяне на нов запис">
            <Plus size={24} />
          </button>

          <div style={{ width: '1px', height: '24px', background: 'var(--panel-border)', margin: '0 8px' }} />

          <Link to="/" style={navLinkStyle('/')}>
            <LayoutDashboard size={18} />
            <span className="hide-on-mobile">Табло</span>
          </Link>
          <Link to="/contacts" style={navLinkStyle('/contacts')}>
            <Users size={18} />
            <span className="hide-on-mobile">Хора и Профили</span>
          </Link>
        </nav>
      </header>
      
      <main className="app-container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contacts" element={<Contacts />} />
        </Routes>
      </main>

      <CreateEntityModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
