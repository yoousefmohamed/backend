'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './login.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const [companyId, setCompanyId] = useState('11111111-1111-1111-1111-111111111111');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(companyId, username, password);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'بيانات الدخول غير صحيحة');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles['login-wrap']}>
      <div className={styles['login-card']}>
        <div className={styles['login-brand']}>☁️ ERP Cloud NG</div>
        <div className={styles['login-sub']}>تسجيل الدخول إلى نظام إدارة الأعمال السحابي</div>

        {error && <div className={styles['login-error']}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">معرّف الشركة</label>
            <input
              className="form-ctrl"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              placeholder="company-id"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">اسم المستخدم</label>
            <input
              className="form-ctrl"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">كلمة المرور</label>
            <input
              className="form-ctrl"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button className="btn btn-primary login-submit" type="submit" disabled={submitting}>
            {submitting ? <span className="spinner" /> : '🔐 تسجيل الدخول'}
          </button>
        </form>

        <div className={styles['login-hint']}>
          الشركة التجريبية مهيأة من بيانات seed.sql — استخدم المستخدم admin بعد ضبط كلمة المرور
        </div>
      </div>
    </div>
  );
}
