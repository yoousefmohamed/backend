'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';

interface Treasury {
  id: string;
  name: string;
  treasuryType: string;
  currentBalance: number;
}

interface Transaction {
  id: string;
  transactionType: string;
  amount: number;
  description?: string;
  createdAt: string;
}

export default function TreasuryPage() {
  const [treasuries, setTreasuries] = useState<Treasury[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'in' | 'out'>('in');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/treasury');
      setTreasuries(data);
      if (data.length && !selected) setSelected(data[0].id);
    } finally {
      setLoading(false);
    }
  }

  async function loadTransactions(treasuryId: string) {
    const { data } = await api.get(`/treasury/${treasuryId}/transactions`);
    setTransactions(data);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (selected) loadTransactions(selected);
  }, [selected]);

  async function submitTransaction() {
    if (!selected || !amount) return;
    setSubmitting(true);
    try {
      await api.post('/treasury/transaction', {
        treasuryId: selected,
        transactionType: type,
        amount: Number(amount),
        description,
      });
      setAmount('');
      setDescription('');
      load();
      loadTransactions(selected);
    } finally {
      setSubmitting(false);
    }
  }

  const totalBalance = treasuries.reduce((s, t) => s + Number(t.currentBalance), 0);

  return (
    <Shell>
      <div className="pg-header">
        <div>
          <div className="pg-title">
            <div className="title-ic">🏦</div> الخزنة والبنوك
          </div>
          <div className="pg-sub">إجمالي الأرصدة: {totalBalance.toLocaleString()} ج</div>
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
            {treasuries.map((t) => (
              <div
                key={t.id}
                className="card"
                style={{
                  cursor: 'pointer',
                  textAlign: 'center',
                  borderColor: selected === t.id ? 'var(--blue)' : undefined,
                }}
                onClick={() => setSelected(t.id)}
              >
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--green)', marginBottom: 6 }}>
                  {Number(t.currentBalance).toLocaleString()} ج
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {t.treasuryType === 'cash' ? '🏦' : '🏛️'} {t.name}
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>
              💸 حركة جديدة
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">النوع</label>
                <select className="form-ctrl" value={type} onChange={(e) => setType(e.target.value as 'in' | 'out')}>
                  <option value="in">إيداع</option>
                  <option value="out">صرف</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">المبلغ</label>
                <input className="form-ctrl" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">البيان</label>
                <input className="form-ctrl" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
            <button className="btn btn-primary" disabled={submitting || !amount} onClick={submitTransaction}>
              {submitting ? <span className="spinner" /> : '💾 تسجيل الحركة'}
            </button>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>
              📜 آخر الحركات
            </div>
            {!transactions.length ? (
              <div className="empty-state">
                <div className="empty-state-icon">🏦</div>
                <p>لا توجد حركات بعد</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>البيان</th>
                    <th>النوع</th>
                    <th>المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{new Date(tx.createdAt).toLocaleString('ar-EG')}</td>
                      <td>{tx.description || '—'}</td>
                      <td>
                        {tx.transactionType === 'in' ? (
                          <span className="badge badge-green">إيداع</span>
                        ) : (
                          <span className="badge badge-red">صرف</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: tx.transactionType === 'in' ? 'var(--green)' : 'var(--red)' }}>
                        {tx.amount} ج
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </Shell>
  );
}
