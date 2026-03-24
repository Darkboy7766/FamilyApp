import React from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import type { EventRecord, Routine } from '../types';
import { format, parseISO } from 'date-fns';
import { Calendar, HeartPulse, Search, Bell, BookOpen, Smile, Music, Coffee } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { events, routines, people, loading } = useData();
  const currentMonth = format(new Date(), 'MM');
  const today = format(new Date(), 'EEE, MMM d');

  if (loading) return <div className="animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>Зареждане...</div>;

  const upcomingEvents = events.filter((e: EventRecord) => {
    if (!e.date) return false;
    try { return format(parseISO(e.date), 'MM') === currentMonth; } catch { return false; }
  }).sort((a: EventRecord, b: EventRecord) => {
    try { return format(parseISO(a.date!), 'dd').localeCompare(format(parseISO(b.date!), 'dd')); } catch { return 0; }
  });

  const getPersonName = (ids?: string[]) => {
    if (!ids || ids.length === 0) return '';
    const person = people.find(p => p.id === ids[0]);
    return person ? person.name : 'Някой';
  };

  const primaryUser = people[0]?.name || 'Гост';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
      
      {/* Header section mimicking the app */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--card-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            👦
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>{today}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{primaryUser}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Search size={24} color="var(--text-primary)" />
          <Bell size={24} color="var(--text-primary)" />
        </div>
      </div>

      {/* Tips & Guidance Section (Your Parenting Journey) */}
      <div style={{ 
        background: 'linear-gradient(135deg, #fad2ee 0%, #faebb4 100%)', 
        borderRadius: '24px', 
        padding: '2rem',
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)'
      }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: '#1e293b' }}>Пътешествие и Съвети<br />Стъпка по Стъпка</h2>
        <p style={{ color: '#475569', margin: 0, fontSize: '0.95rem', maxWidth: '80%' }}>
          Започнете деня с малки моменти. Опитайте днешния съвет когато имате спокойна минута.
        </p>
      </div>

      {/* Today's Plan Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.3rem', margin: 0 }}>План за Деня</h2>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Виж Всички {'>'}</span>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: '1rem' 
        }}>
          <div style={{ background: 'var(--card-pink)', borderRadius: '20px', padding: '1.5rem', minHeight: '140px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#fff', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Smile size={20} color="#f43f5e" /></div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2, color: '#1e293b' }}>Време за Игра и Учене</div>
          </div>
          <div style={{ background: 'var(--card-blue)', borderRadius: '20px', padding: '1.5rem', minHeight: '140px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#fff', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={20} color="#3b82f6" /></div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2, color: '#1e293b' }}>Нека Четем Заедно</div>
          </div>
          <div style={{ background: 'var(--card-yellow)', borderRadius: '20px', padding: '1.5rem', minHeight: '140px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#fff', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Music size={20} color="#eab308" /></div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2, color: '#1e293b' }}>Музика & Ритъм Днес</div>
          </div>
        </div>
      </div>

      {/* Routines & Events Details - using the original functionality but white cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <Card title={<div className="flex-center" style={{ gap: '0.5rem', justifyContent: 'flex-start' }}><HeartPulse size={20} color="var(--accent-color)" />Лекарства и Рутини</div>} variant="white">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {routines.length === 0 ? <p style={{ margin: 0 }}>Няма зададени рутини.</p> : routines.sort((a: Routine, b: Routine) => (a.time || '').localeCompare(b.time || '')).map((r: Routine) => (
              <div key={r.id} className="flex-between" style={{ padding: '1rem', background: '#f1f5f9', borderRadius: '16px', transition: 'var(--transition)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1e293b' }}>{r.medication}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>За: {getPersonName(r.personIds)}</div>
                </div>
                <div style={{ background: '#fff', padding: '6px 12px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  {r.time}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={<div className="flex-center" style={{ gap: '0.5rem', justifyContent: 'flex-start' }}><Calendar size={20} color="var(--accent-color)" />Предстоящи Събития</div>} variant="white">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {upcomingEvents.length === 0 ? <p style={{ margin: 0 }}>Няма събития.</p> : upcomingEvents.map((e: EventRecord) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f1f5f9', borderRadius: '16px' }}>
                <div style={{ background: 'var(--card-green)', width: 40, height: 40, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Coffee size={20} color="#059669" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1e293b' }}>{e.type}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {getPersonName(e.personIds)} • {e.date ? format(parseISO(e.date), 'dd.MM.yyyy') : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  );
};
