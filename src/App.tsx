import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Users, LayoutDashboard, HeartPulse, Plus, CheckSquare, Wallet, Calendar as CalendarIcon, LogOut, User } from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { Contacts } from './pages/Contacts';
import { Tasks } from './pages/Tasks';
import { Budget } from './pages/Budget';
import { Calendar } from './pages/Calendar';
import { useReminders } from './hooks/useReminders';
import { CreateEntityModal } from './components/CreateEntityModal';
import { useUser } from './context/UserContext';

function AppContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentUser, logout } = useUser();
  useReminders();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const desktopNavStyle = (path: string): React.CSSProperties => ({
    color: isActive(path) ? 'var(--accent-color)' : 'var(--text-secondary)',
    textDecoration: 'none',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: isActive(path) ? 'var(--card-blue)' : 'transparent',
    padding: '10px 16px',
    borderRadius: '16px',
    transition: 'var(--transition)',
  });

  return (
    <>
      {/* ── Header ── */}
      <header
        className="glass-panel"
        style={{ padding: '0.875rem 1.25rem', margin: '0.75rem 1rem', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none', flexShrink: 0 }}
      >
        <h1 style={{ margin: 0, fontSize: '1.3rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <HeartPulse size={24} color="#f43f5e" />
          Family CRM
        </h1>

        {/* Desktop nav */}
        <nav className="header-nav-links">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{ background: 'var(--text-primary)', color: '#fff', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
            title="Добавяне"
          >
            <Plus size={22} />
          </button>
          <div style={{ width: '1px', height: '24px', background: 'var(--panel-border)', margin: '0 6px' }} />
          <Link to="/" style={desktopNavStyle('/')}><LayoutDashboard size={18} />Табло</Link>
          <Link to="/tasks" style={desktopNavStyle('/tasks')}><CheckSquare size={18} />Задачи</Link>
          <Link to="/contacts" style={desktopNavStyle('/contacts')}><Users size={18} />Хора</Link>
          <Link to="/calendar" style={desktopNavStyle('/calendar')}><CalendarIcon size={18} />Календар</Link>
          <Link to="/budget" style={desktopNavStyle('/budget')}><Wallet size={18} />Бюджет</Link>
          <div style={{ width: '1px', height: '24px', background: 'var(--panel-border)', margin: '0 6px' }} />
          {/* Current user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--card-pink)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {currentUser?.photoUrl
                ? <img src={currentUser.photoUrl} alt={currentUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <User size={16} color="#f43f5e" />
              }
            </div>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{currentUser?.name}</span>
            <button onClick={logout} title="Изход" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '4px', borderRadius: '8px' }}>
              <LogOut size={17} />
            </button>
          </div>
        </nav>
      </header>

      {/* ── Main content ── */}
      <main className="app-container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="*" element={<div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Страницата не е намерена.</div>} />
        </Routes>
      </main>

      {/* ── Mobile FAB ── */}
      <button
        className="mobile-fab"
        onClick={() => setIsModalOpen(true)}
        title="Добавяне"
      >
        <Plus size={26} />
      </button>

      {/* ── Bottom navigation (mobile only) ── */}
      <nav className="bottom-nav">
        <Link to="/" className={`bottom-nav-item${isActive('/') ? ' active' : ''}`}>
          <LayoutDashboard size={22} />
          Табло
        </Link>
        <Link to="/tasks" className={`bottom-nav-item${isActive('/tasks') ? ' active' : ''}`}>
          <CheckSquare size={22} />
          Задачи
        </Link>
        <Link to="/contacts" className={`bottom-nav-item${isActive('/contacts') ? ' active' : ''}`}>
          <Users size={22} />
          Хора
        </Link>
        <Link to="/calendar" className={`bottom-nav-item${isActive('/calendar') ? ' active' : ''}`}>
          <CalendarIcon size={22} />
          Календар
        </Link>
        <Link to="/budget" className={`bottom-nav-item${isActive('/budget') ? ' active' : ''}`}>
          <Wallet size={22} />
          Бюджет
        </Link>
      </nav>

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
