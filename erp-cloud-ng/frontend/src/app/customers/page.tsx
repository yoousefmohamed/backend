'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';

interface Partner {
  id: string;
  name: string;
  phone?: string;
  partnerType: 'customer' | 'supplier';
  creditLimit: number;
  currentBalance: number;
}

export default function CustomersPage() {
  const [tab, setTab] = useState<'customer' | 'supplier'>('customer');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', creditLimit: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/partners', { params: { type: tab } });
      setPartners(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function createPartner() {
    setSaving(true);
    try {
      await api.post('/partners', {
        name: form.name,
        phone: form.phone || undefined,
        partnerType: tab,
        creditLimit: Number(form.creditLimit) || 0,
      });
      setForm({ name: '', phone: '', creditLimit: '' });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  const totalDebt = partners.reduce((s, p) => s + Number(p.currentBalance), 0);

  return (
    <Shell>
      <div className="pg-header">
        <div>
          <div className="pg-title">
            <div className="title-ic">👥</div> العملاء والموردون
          </div>
          <div className="pg-sub">
            {partners.length} {tab === 'customer' ? 'عميل' : 'مورد'} — إجمالي الأرصدة: {totalDebt.toLocaleString()} ج
          </div>
        </div>
        <div className="btn-group">
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm((s) => !s)}>
            ➕ {tab === 'customer' ? 'عميل جديد' : 'مورد جديد'}
          </button>
        </div>
      </div>

      <div className="btn-group" style={{ marginBottom: 16 }}>
        <button className={tab === 'customer' ? 'btn btn-blue btn-sm' : 'btn btn-ghost btn-sm'} onClick={() => setTab('customer')}>
          العملاء
        </button>
        <button className={tab === 'supplier' ? 'btn btn-blue btn-sm' : 'btn btn-ghost btn-sm'} onClick={() => setTab('supplier')}>
          الموردون
        </button>
      </div>

      {showForm && (
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">الاسم</label>
              <input className="form-ctrl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">الهاتف</label>
              <input className="form-ctrl" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">حد الائتمان</label>
              <input
                className="form-ctrl"
                type="number"
                value={form.creditLimit}
                onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
              />
            </div>
          </div>
          <button className="btn btn-primary" disabled={saving || !form.name} onClick={createPartner}>
            {saving ? <span className="spinner" /> : '💾 حفظ'}
          </button>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="spinner" />
        ) : !partners.length ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>لا يوجد {tab === 'customer' ? 'عملاء' : 'موردون'} بعد</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الهاتف</th>
                <th>حد الائتمان</th>
                <th>الرصيد المستحق</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>{p.phone || '—'}</td>
                  <td>{p.creditLimit} ج</td>
                  <td style={{ color: Number(p.currentBalance) > 0 ? 'var(--red)' : 'var(--green)', fontWeight: 700 }}>
                    {p.currentBalance} ج
                  </td>
                  <td>
                    {Number(p.currentBalance) > 0 ? (
                      <span className="badge badge-orange">مستحق</span>
                    ) : (
                      <span className="badge badge-green">مسدد</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  );
}
