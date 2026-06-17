'use client';

import { useEffect, useMemo, useState } from 'react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
import styles from './pos.module.css';

interface Product {
  id: string;
  name: string;
  salePrice: number;
  barcode?: string;
}

interface CartLine {
  product: Product;
  qty: number;
}

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [warehouseId, setWarehouseId] = useState('55555555-5555-5555-5555-555555555555');
  const [treasuryId, setTreasuryId] = useState('66666666-6666-6666-6666-666666666666');
  const [submitting, setSubmitting] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function loadProducts() {
    const { data } = await api.get('/products', { params: { search } });
    setProducts(data);
  }

  useEffect(() => {
    const t = setTimeout(loadProducts, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev[product.id];
      return {
        ...prev,
        [product.id]: { product, qty: existing ? existing.qty + 1 : 1 },
      };
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) => {
      const line = prev[productId];
      if (!line) return prev;
      const newQty = line.qty + delta;
      const next = { ...prev };
      if (newQty <= 0) {
        delete next[productId];
      } else {
        next[productId] = { ...line, qty: newQty };
      }
      return next;
    });
  }

  const subtotal = useMemo(
    () => Object.values(cart).reduce((sum, l) => sum + l.product.salePrice * l.qty, 0),
    [cart],
  );

  async function checkout(paymentMethod: 'cash' | 'credit' | 'installment') {
    if (!Object.keys(cart).length) return;
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/sales', {
        warehouseId,
        treasuryId,
        paymentMethod,
        items: Object.values(cart).map((l) => ({
          productId: l.product.id,
          unitPrice: l.product.salePrice,
          quantity: l.qty,
        })),
      });
      setLastInvoice(data.invoiceNumber);
      setCart({});
    } catch (err: any) {
      setError(err?.response?.data?.message || 'حدث خطأ أثناء إتمام عملية البيع');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Shell>
      <div className="pg-header">
        <div>
          <div className="pg-title">
            <div className="title-ic">🖥️</div> نقطة البيع
          </div>
          <div className="pg-sub">{lastInvoice ? `آخر فاتورة: ${lastInvoice} ✅` : 'جاهز لاستقبال عملية بيع جديدة'}</div>
        </div>
      </div>

      {error && <div className="alert-item danger">{error}</div>}

      <div className={styles['pos-topbar']}>
        <input
          className={`form-ctrl ${styles['pos-search-big']}`}
          placeholder="🔍 ابحث عن منتج بالاسم أو الباركود..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles['pos-body']}>
        <div className={styles['pos-left']}>
          <div className={styles['pos-prods']}>
            {products.map((p) => (
              <div key={p.id} className={styles['prod-card']} onClick={() => addToCart(p)}>
                <div className={styles['pc-name']}>{p.name}</div>
                <div className={styles['pc-price']}>{p.salePrice} ج</div>
              </div>
            ))}
            {!products.length && (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <div className="empty-state-icon">📦</div>
                <p>لا توجد منتجات مطابقة للبحث</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles['pos-right']}>
          <div className={styles['pos-cart-hdr']}>
            🛒 السلة
            <span className="badge badge-blue">{Object.values(cart).reduce((s, l) => s + l.qty, 0)} أصناف</span>
          </div>
          <div className={styles['pos-cart-items']}>
            {Object.values(cart).map((line) => (
              <div key={line.product.id} className={styles['cart-row']}>
                <div className={styles['cr-name']}>{line.product.name}</div>
                <div className={styles['cr-qty']}>
                  <button onClick={() => changeQty(line.product.id, -1)}>−</button>
                  <span>{line.qty}</span>
                  <button onClick={() => changeQty(line.product.id, 1)}>+</button>
                </div>
                <div className={styles['cr-price']}>{line.product.salePrice * line.qty} ج</div>
              </div>
            ))}
            {!Object.keys(cart).length && (
              <div className="empty-state">
                <div className="empty-state-icon">🛒</div>
                <p>السلة فارغة — اضغط على منتج لإضافته</p>
              </div>
            )}
          </div>
          <div className={styles['pos-footer']}>
            <div className={styles['pos-total-big']}>
              <span>الإجمالي</span>
              <span className={styles.amt}>{subtotal} ج</span>
            </div>
            <div className={styles['pay-grid']}>
              <button className="btn btn-primary" disabled={submitting} onClick={() => checkout('cash')}>
                💵 نقدي
              </button>
              <button className="btn btn-blue" disabled={submitting} onClick={() => checkout('credit')}>
                🕐 آجل
              </button>
              <button className="btn btn-purple" disabled={submitting} onClick={() => checkout('installment')}>
                📅 تقسيط
              </button>
              <button className="btn btn-ghost" disabled={submitting} onClick={() => setCart({})}>
                🗑️ مسح
              </button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
