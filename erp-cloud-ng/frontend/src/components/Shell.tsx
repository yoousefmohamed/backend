'use client';

import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { navSections } from './navConfig';
import styles from './Shell.module.css';

export default function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className={styles.shell}>
      <nav className={styles.nav}>
        <div className={styles['nav-brand']}>
          <div className={styles['brand-icon']}>☁️</div>
          ERP Cloud NG
        </div>
        <div className={styles['nav-right']}>
          {user?.company && <span className={styles['nav-store']}>{user.company}</span>}
          <button className="btn btn-primary btn-sm" onClick={() => router.push('/pos')}>
            🖥️ نقطة البيع
          </button>
          <div className={styles['nav-user']} onClick={logout} title="تسجيل الخروج">
            <span>👤</span>
            <span>{user?.fullName}</span>
            {user?.role && <span className="badge badge-purple">{user.role}</span>}
          </div>
        </div>
      </nav>

      <aside className={styles.sidebar}>
        {navSections.map((section) => (
          <div key={section.title}>
            <div className={styles['sb-sec-title']}>{section.title}</div>
            {section.items.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <div
                  key={item.id}
                  className={`${styles['sb-item']} ${active ? styles.active : ''}`}
                  onClick={() => router.push(item.href)}
                >
                  <div className={styles['sb-icon']}>{item.icon}</div>
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        ))}
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
