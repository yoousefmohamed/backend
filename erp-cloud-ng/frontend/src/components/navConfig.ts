export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  permissionModule?: string;
  badge?: { text: string; color: string };
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: 'عام',
    items: [
      { id: 'dashboard', label: 'لوحة التحكم', icon: '📊', href: '/dashboard' },
      { id: 'pos', label: 'نقطة البيع', icon: '🖥️', href: '/pos', permissionModule: 'sales' },
    ],
  },
  {
    title: 'المخزون',
    items: [
      { id: 'products', label: 'المنتجات', icon: '📦', href: '/products', permissionModule: 'products' },
      { id: 'warehouses', label: 'المخازن', icon: '🏪', href: '/warehouses', permissionModule: 'products' },
      { id: 'production', label: 'الإنتاج', icon: '🏭', href: '/production', permissionModule: 'production' },
      { id: 'purchases', label: 'فواتير الشراء', icon: '🚚', href: '/purchases', permissionModule: 'purchases' },
    ],
  },
  {
    title: 'المبيعات',
    items: [
      { id: 'sales', label: 'الفواتير', icon: '📋', href: '/sales', permissionModule: 'sales' },
      { id: 'customers', label: 'العملاء والموردون', icon: '👥', href: '/customers', permissionModule: 'customers' },
    ],
  },
  {
    title: 'المالية',
    items: [
      { id: 'treasury', label: 'الخزنة والبنوك', icon: '🏦', href: '/treasury', permissionModule: 'treasury' },
      { id: 'expenses', label: 'المصروفات', icon: '🧾', href: '/expenses', permissionModule: 'treasury' },
      { id: 'accounting', label: 'الحسابات', icon: '⚖️', href: '/accounting', permissionModule: 'reports' },
      { id: 'reports', label: 'التقارير', icon: '📈', href: '/reports', permissionModule: 'reports' },
    ],
  },
  {
    title: 'إدارة',
    items: [
      { id: 'users', label: 'المستخدمون والصلاحيات', icon: '🛡️', href: '/users', permissionModule: 'users' },
      { id: 'branches', label: 'الفروع والشركات', icon: '🏬', href: '/branches' },
      { id: 'app-builder', label: 'App Builder', icon: '🧩', href: '/app-builder' },
      { id: 'settings', label: 'الإعدادات', icon: '⚙️', href: '/settings' },
    ],
  },
];
