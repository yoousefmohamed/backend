-- ============================================================
-- ERP Cloud NG — Seed Data (Permissions Catalog + Demo Company)
-- ============================================================

-- Permission catalog (module x action)
INSERT INTO permissions (module, action, description) VALUES
('products','view','عرض المنتجات'),('products','create','إضافة منتج'),('products','update','تعديل منتج'),('products','delete','حذف منتج'),('products','reports','تقارير المنتجات'),
('sales','view','عرض المبيعات'),('sales','create','إنشاء فاتورة بيع'),('sales','update','تعديل فاتورة'),('sales','delete','حذف فاتورة'),('sales','reports','تقارير المبيعات'),
('purchases','view','عرض المشتريات'),('purchases','create','إنشاء فاتورة شراء'),('purchases','update','تعديل فاتورة شراء'),('purchases','delete','حذف فاتورة شراء'),('purchases','reports','تقارير المشتريات'),
('customers','view','عرض العملاء'),('customers','create','إضافة عميل'),('customers','update','تعديل عميل'),('customers','delete','حذف عميل'),('customers','reports','كشوف حساب العملاء'),
('treasury','view','عرض الخزنة'),('treasury','create','إيداع/صرف'),('treasury','update','تعديل حركة خزنة'),('treasury','delete','حذف حركة'),('treasury','reports','تقارير الخزنة'),
('production','view','عرض الإنتاج'),('production','create','أمر إنتاج جديد'),('production','update','تعديل أمر إنتاج'),('production','delete','حذف أمر إنتاج'),('production','reports','تقارير الإنتاج'),
('reports','view','عرض التقارير'),('reports','create','إنشاء تقرير مخصص'),('reports','update','تعديل تقرير'),('reports','delete','حذف تقرير'),('reports','reports','تصدير التقارير'),
('users','view','عرض المستخدمين'),('users','create','إضافة مستخدم'),('users','update','تعديل مستخدم'),('users','delete','حذف مستخدم'),('users','reports','تقارير المستخدمين')
ON CONFLICT (module, action) DO NOTHING;

-- Demo company
INSERT INTO companies (id, name, commercial_register, default_currency, default_language)
VALUES ('11111111-1111-1111-1111-111111111111', 'شركة النور للتجارة', '1234567890', 'EGP', 'ar');

INSERT INTO branches (id, company_id, name, is_main_branch)
VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'الفرع الرئيسي - القاهرة', true);

-- Roles
INSERT INTO roles (id, company_id, name, code, is_system_role) VALUES
('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'مدير النظام', 'admin', true),
('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', 'مدير الفرع', 'manager', true),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'المحاسب', 'accountant', true),
('33333333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-111111111111', 'الكاشير', 'cashier', true),
('33333333-3333-3333-3333-333333333335', '11111111-1111-1111-1111-111111111111', 'مدير المخزن', 'store_manager', true),
('33333333-3333-3333-3333-333333333336', '11111111-1111-1111-1111-111111111111', 'موظف الإنتاج', 'production', true);

-- Admin role gets ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333331', id FROM permissions;

-- Cashier: sales view/create, products view, customers view/create
INSERT INTO role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333334', id FROM permissions
WHERE (module='sales' AND action IN ('view','create'))
   OR (module='products' AND action='view')
   OR (module='customers' AND action IN ('view','create'));

-- Default admin user (password: Admin@123 — bcrypt hash placeholder, replace via API on first run)
INSERT INTO users (id, company_id, branch_id, role_id, full_name, username, email, password_hash)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333331',
  'محمد المدير',
  'admin',
  'admin@erpcloudng.com',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
);

-- Default warehouse
INSERT INTO warehouses (id, company_id, branch_id, name, code)
VALUES ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'المخزن الرئيسي', 'WH-001');

-- Default treasury
INSERT INTO treasuries (id, company_id, branch_id, name, treasury_type, current_balance)
VALUES ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'الخزنة الرئيسية', 'cash', 0);

-- Default unit
INSERT INTO units (id, company_id, name, symbol)
VALUES ('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'قطعة', 'PC');
