import React from 'react';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { CreateEntityModal } from '../components/CreateEntityModal';
import type { EditData } from '../components/CreateEntityModal';
import type { Expense } from '../types';
import { parseISO, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { bg } from 'date-fns/locale';
import { Wallet, Trash2, Pencil, TrendingDown } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  'Храна':        '#fef9c3',
  'Сметки':       '#dbeafe',
  'Здраве':       '#fce7f3',
  'Транспорт':    '#d1fae5',
  'Развлечение':  '#ede9fe',
  'Друго':        '#f1f5f9',
};
const CATEGORY_TEXT: Record<string, string> = {
  'Храна':        '#a16207',
  'Сметки':       '#1d4ed8',
  'Здраве':       '#be185d',
  'Транспорт':    '#065f46',
  'Развлечение':  '#6d28d9',
  'Друго':        '#475569',
};

export const Budget: React.FC = () => {
  const { expenses, people, deleteExpense, loading } = useData();
  const { currentUser } = useUser();
  const { addToast } = useToast();
  const [editData, setEditData] = React.useState<EditData | undefined>();

  const now = new Date();

  if (loading) return (
    <div className="animate-fade-in" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
      Зареждане...
    </div>
  );

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const myExpenses = expenses.filter((e: Expense) => e.paidById === currentUser?.id);

  const thisMonthExpenses = myExpenses.filter((e: Expense) => {
    if (!e.date) return false;
    try { return isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd }); }
    catch { return false; }
  });

  const totalMonth = thisMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const byCategory = thisMonthExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const sorted = [...myExpenses].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });

  const getPersonName = (id?: string) => {
    if (!id) return '';
    return people.find(p => p.id === id)?.name ?? '';
  };

  const monthLabel = format(now, 'MMMM yyyy', { locale: bg });

  return (
    <>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '1rem' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Wallet size={26} color="#059669" />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>Бюджет</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, textTransform: 'capitalize' }}>{monthLabel}</div>
          </div>
        </div>

        {/* ── This month summary ── */}
        <Card variant="white" title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingDown size={18} color="var(--accent-color)" />
            Разходи за месеца
          </div>
        }>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {totalMonth.toFixed(2)} лв.
            </div>

            {Object.keys(byCategory).length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Няма разходи за {monthLabel}.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(byCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, amt]) => (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        background: CATEGORY_COLORS[cat] ?? '#f1f5f9',
                        color: CATEGORY_TEXT[cat] ?? '#475569',
                        padding: '2px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap',
                      }}>{cat}</span>
                      <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.round((amt / totalMonth) * 100)}%`, background: CATEGORY_TEXT[cat] ?? '#94a3b8', borderRadius: 3, transition: 'width 0.4s' }} />
                      </div>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{amt.toFixed(2)} лв.</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </Card>

        {/* ── All expenses ── */}
        <Card variant="white" title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wallet size={18} color="var(--accent-color)" />
            Всички разходи
          </div>
        }>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {sorted.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Няма записани разходи.</p>
            ) : sorted.map((e: Expense) => {
              const personName = getPersonName(e.paidById);
              return (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '14px' }}>
                  <div style={{
                    background: CATEGORY_COLORS[e.category] ?? '#f1f5f9',
                    borderRadius: '12px', width: 38, height: 38, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 700, color: CATEGORY_TEXT[e.category] ?? '#475569',
                    textAlign: 'center', padding: '2px',
                  }}>
                    {e.category.slice(0, 4)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{e.amount.toFixed(2)} лв.</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {e.date ? format(parseISO(e.date), 'd MMM yyyy', { locale: bg }) : ''}
                      {personName ? ` • ${personName}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                    <button
                      onClick={() => setEditData({ tab: 'expense', id: e.id, amount: e.amount, category: e.category, date: e.date, paidById: e.paidById ?? '' })}
                      style={iconBtn} title="Редактирай"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Изтрий разход от ${e.amount.toFixed(2)} лв.?`)) return;
                        const ok = await deleteExpense(e.id);
                        if (!ok) addToast('Грешка при изтриване.', 'error');
                      }}
                      style={{ ...iconBtn, color: 'var(--danger-color)' }} title="Изтрий"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

      </div>

      <CreateEntityModal isOpen={!!editData} onClose={() => setEditData(undefined)} editData={editData} />
    </>
  );
};

const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--text-secondary)', display: 'flex', padding: '5px', borderRadius: '7px',
};
