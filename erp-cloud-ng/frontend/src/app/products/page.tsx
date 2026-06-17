'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  barcode?: string;
  salePrice: number;
  costPrice: number;
  minStockLevel: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', barcode: '', salePrice: '', costPrice: '', minStockLevel: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/products', { params: { search } });
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function createProduct() {
    setSaving(true);
    try {
      await api.post('/products', {
        name: form.name,
        barcode: form.barcode || undefined,
        salePrice: Number(form.salePrice) || 0,
        costPrice: Number(form.costPrice) || 0,
        minStockLevel: Number(form.minStockLevel) || 0,
      });
      setForm({ name: '', barcode: '', salePrice: '', costPrice: '', minStockLevel: '' });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell>
      <div className="pg-header">
        <div>
          <div className="pg-title">
            <div className="title-ic">📦</div> إدارة المنتجات
          </div>
          <div className="pg-sub">{products.length} منتج</div>
        </div>
        <div className="btn-group">
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm((s) => !s)}>
            ➕ منتج جديد
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>
            إضافة منتج جديد
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">الاسم</label>
              <input className="form-ctrl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">الباركود</label>
              <input className="form-ctrl" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">سعر البيع</label>
              <input
                className="form-ctrl"
                type="number"
                value={form.salePrice}
                onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">سعر الشراء</label>
              <input
                className="form-ctrl"
                type="number"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">الحد الأدنى للمخزون</label>
              <input
                className="form-ctrl"
                type="number"
                value={form.minStockLevel}
                onChange={(e) => setForm({ ...form, minStockLevel: e.target.value })}
              />
            </div>
          </div>
          <button className="btn btn-primary" disabled={saving || !form.name} onClick={createProduct}>
            {saving ? <span className="spinner" /> : '💾 حفظ المنتج'}
          </button>
        </div>
      )}

      <div className="card">
        <div className="card-hdr">
          <input
            className="form-ctrl"
            style={{ maxWidth: 280 }}
            placeholder="🔍 بحث بالاسم أو الباركود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="spinner" />
        ) : !products.length ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <p>لا توجد منتجات بعد — أضف أول منتج للبدء</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>الصنف</th>
                <th>الباركود</th>
                <th>سعر البيع</th>
                <th>سعر الشراء</th>
                <th>الحد الأدنى</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{p.barcode || '—'}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 700 }}>{p.salePrice} ج</td>
                  <td>{p.costPrice} ج</td>
                  <td>{p.minStockLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  );
}
