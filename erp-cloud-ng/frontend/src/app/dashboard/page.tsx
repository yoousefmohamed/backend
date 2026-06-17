'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import styles from './dashboard.module.css';

interface Summary {
  todaySales: number;
  todayInvoiceCount: number;
  treasuryBalance: number;
  lowStockCount: number;
  lowStockItems: { name: string; quantity: number; min_stock_level: number }[];
  totalCustomerDebt: number;
  topDebtors: { name: string; currentBalance: number }[];
}

function fmt(n: number) {
  return new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n || 0);
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const { data } = await api.get('/dashboard/summary');
      setSummary(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const socket = getSocket();
    socket.on('sale:created', load);
    socket.on('notification:new', load);
    return () => {
      socket.off('sale:created', load);
      socket.off('notification:new', load);
    };
  }, []);

  return (
    <Shell>
      <div className="pg-header">
        <div>
          <div className="pg-title">
            <div className="title-ic">📊</div> لوحة التحكم
          </div>
          <div className="pg-sub">نظرة عامة على أداء الشركة — تحديث لحظي</div>
        </div>
        <div className="btn-group">
          <button className="btn btn-ghost btn-sm" onClick={load}>
            🔄 تحديث
          </button>
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : (
        <>
          <div className={styles['stats-grid']}>
            <div className={styles['stat-card']}>
              <div className={styles['stat-label']}>مبيعات اليوم</div>
              <div className={`${styles['stat-val']} ${styles.green}`}>{fmt(summary?.todaySales || 0)} ج</div>
              <div className={styles['stat-ic']}>📈</div>
            </div>
            <div className={styles['stat-card']}>
              <div className={styles['stat-label']}>عدد الفواتير اليوم</div>
              <div className={`${styles['stat-val']} ${styles.blue}`}>{summary?.todayInvoiceCount || 0}</div>
              <div className={styles['stat-ic']}>🧾</div>
            </div>
            <div className={styles['stat-card']}>
              <div className={styles['stat-label']}>رصيد الخزائن</div>
              <div className={`${styles['stat-val']} ${styles.purple}`}>{fmt(summary?.treasuryBalance || 0)} ج</div>
              <div className={styles['stat-ic']}>🏦</div>
            </div>
            <div className={styles['stat-card']}>
              <div className={styles['stat-label']}>ديون العملاء</div>
              <div className={`${styles['stat-val']} ${styles.red}`}>{fmt(summary?.totalCustomerDebt || 0)} ج</div>
              <div className={styles['stat-ic']}>⚠️</div>
            </div>
            <div className={styles['stat-card']}>
              <div className={styles['stat-label']}>أصناف منخفضة المخزون</div>
              <div className={`${styles['stat-val']} ${styles.orange}`}>{summary?.lowStockCount || 0}</div>
              <div className={styles['stat-ic']}>📦</div>
            </div>
          </div>

          <div className={styles['grid-2']}>
            <div className="card">
              <div className="card-hdr">
                <div className="card-title">🔔 تنبيهات المخزون</div>
                <span className="badge badge-orange">{summary?.lowStockItems?.length || 0}</span>
              </div>
              {!summary?.lowStockItems?.length ? (
                <div className="empty-state">
                  <div className="empty-state-icon">✅</div>
                  <p>كل المنتجات في المستوى الطبيعي من المخزون</p>
                </div>
              ) : (
                summary.lowStockItems.map((item, i) => (
                  <div key={i} className="alert-item warning">
                    📦 {item.name} — {item.quantity} وحدة (الحد الأدنى {item.min_stock_level})
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <div className="card-hdr">
                <div className="card-title">👥 أعلى العملاء بالديون</div>
              </div>
              {!summary?.topDebtors?.length ? (
                <div className="empty-state">
                  <div className="empty-state-icon">✅</div>
                  <p>لا توجد ديون مستحقة على العملاء حاليًا</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>العميل</th>
                      <th>الرصيد المستحق</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.topDebtors.map((c, i) => (
                      <tr key={i}>
                        <td>{c.name}</td>
                        <td style={{ color: 'var(--red)', fontWeight: 700 }}>{fmt(c.currentBalance)} ج</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </Shell>
  );
}
