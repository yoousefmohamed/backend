'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';

interface CustomField {
  id: string;
  fieldName: string;
  fieldType: string;
  isRequired: boolean;
}

interface CustomEntity {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  fields: CustomField[];
}

const FIELD_TYPES = [
  { type: 'text', icon: '📝', label: 'نص قصير' },
  { type: 'number', icon: '🔢', label: 'رقم' },
  { type: 'date', icon: '📅', label: 'تاريخ' },
  { type: 'select', icon: '☑️', label: 'قائمة منسدلة' },
  { type: 'attachment', icon: '📎', label: 'مرفق' },
  { type: 'relation', icon: '🔗', label: 'ربط بجدول' },
  { type: 'checkbox', icon: '✅', label: 'صندوق اختيار' },
  { type: 'computed', icon: '🧮', label: 'حقل محسوب' },
];

export default function AppBuilderPage() {
  const [entities, setEntities] = useState<CustomEntity[]>([]);
  const [selected, setSelected] = useState<CustomEntity | null>(null);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/app-builder/entities');
      setEntities(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createEntity() {
    if (!newName.trim()) return;
    const slug = newName.trim().toLowerCase().replace(/\s+/g, '-');
    const { data } = await api.post('/app-builder/entities', { name: newName, slug, icon: '🧩' });
    setNewName('');
    await load();
    setSelected({ ...data, fields: [] });
  }

  async function addField(fieldType: string, label: string) {
    if (!selected) return;
    const { data } = await api.post(`/app-builder/entities/${selected.id}/fields`, {
      fieldName: label,
      fieldType,
      isRequired: false,
    });
    setSelected({ ...selected, fields: [...selected.fields, data] });
  }

  async function removeField(fieldId: string) {
    if (!selected) return;
    await api.delete(`/app-builder/fields/${fieldId}`);
    setSelected({ ...selected, fields: selected.fields.filter((f) => f.id !== fieldId) });
  }

  return (
    <Shell>
      <div className="pg-header">
        <div>
          <div className="pg-title">
            <div className="title-ic">🧩</div> App Builder
          </div>
          <div className="pg-sub">إنشاء شاشات وحقول مخصصة بدون الحاجة إلى البرمجة</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>
            📋 الشاشات المخصصة
          </div>
          <div className="form-group">
            <input
              className="form-ctrl"
              placeholder="اسم شاشة جديدة..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createEntity()}
            />
          </div>
          <button className="btn btn-purple btn-sm" style={{ width: '100%', justifyContent: 'center', marginBottom: 14 }} onClick={createEntity}>
            ➕ إنشاء شاشة
          </button>

          {loading ? (
            <div className="spinner" />
          ) : !entities.length ? (
            <div className="empty-state">
              <div className="empty-state-icon">🧩</div>
              <p>لا توجد شاشات مخصصة بعد</p>
            </div>
          ) : (
            entities.map((e) => (
              <div
                key={e.id}
                onClick={() => setSelected(e)}
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  marginBottom: 6,
                  background: selected?.id === e.id ? 'rgba(74,158,255,0.12)' : 'var(--bg3)',
                  color: selected?.id === e.id ? 'var(--blue)' : 'var(--text)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {e.icon} {e.name} <span style={{ color: 'var(--text-faint)', fontSize: '0.7rem' }}>({e.fields?.length || 0} حقل)</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          {!selected ? (
            <div className="empty-state">
              <div className="empty-state-icon">👈</div>
              <p>اختر شاشة من القائمة أو أنشئ شاشة جديدة لبدء إضافة الحقول</p>
            </div>
          ) : (
            <>
              <div className="card-title" style={{ marginBottom: 12 }}>
                🧩 {selected.name} — مكتبة الحقول
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 18 }}>
                {FIELD_TYPES.map((f) => (
                  <div
                    key={f.type}
                    onClick={() => addField(f.type, f.label)}
                    style={{
                      background: 'var(--bg3)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '11px 6px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>{f.icon}</div>
                    {f.label}
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--bg3)', border: '2px dashed var(--border2)', borderRadius: 12, padding: 16, minHeight: 160 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>
                  📋 شاشة: {selected.name}
                </div>
                {!selected.fields?.length ? (
                  <div className="empty-state">
                    <p>اضغط على حقل من المكتبة أعلاه لإضافته للشاشة</p>
                  </div>
                ) : (
                  selected.fields.map((field) => {
                    const meta = FIELD_TYPES.find((f) => f.type === field.fieldType);
                    return (
                      <div
                        key={field.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          background: 'var(--card2)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          padding: '9px 13px',
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {meta?.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{field.fieldName}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>نوع: {meta?.label}</div>
                        </div>
                        <button onClick={() => removeField(field.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}>
                          🗑️
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}
