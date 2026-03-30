'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '@/styles/account-orders.module.css';

export default function AccountOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders/my');
        if (res.status === 401) {
          router.push('/auth/login');
          return;
        }
        const data = await res.json();
        if (res.ok && data.success) {
          setOrders(data.data || []);
        }
      } catch {
        // fetch failed silently
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [router]);

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  function formatPrice(val) {
    return parseFloat(val).toFixed(2) + ' lei';
  }

  function statusLabel(status) {
    const map = {
      pending: 'In asteptare',
      processing: 'In procesare',
      shipped: 'Expediat',
      delivered: 'Livrat',
      cancelled: 'Anulat',
    };
    return map[status] || status;
  }

  if (loading) {
    return (
      <div className={styles.loaderWrap}>
        <div className={styles.spinner} />
        <p className={styles.loaderText}>Se incarca comenzile...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Breadcrumbs */}
      <nav className={styles.breadcrumbs}>
        <Link href="/" className={styles.breadLink}>Acasa</Link>
        <span className={styles.breadSep}>&gt;</span>
        <Link href="/account" className={styles.breadLink}>Contul meu</Link>
        <span className={styles.breadSep}>&gt;</span>
        <span className={styles.breadCurrent}>Comenzile mele</span>
      </nav>

      <h1 className={styles.pageTitle}>Comenzile mele</h1>

      {orders.length === 0 ? (
        <div className={styles.emptyCard}>
          <span className={styles.emptyIcon}>&#128230;</span>
          <p className={styles.emptyMsg}>Nu ai nicio comanda</p>
          <p className={styles.emptyHint}>
            Exploreaza produsele noastre si plaseaza prima ta comanda!
          </p>
          <Link href="/products" className={styles.btnOutline}>
            Vezi produse
          </Link>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {orders.map((order) => {
            const itemCount = Array.isArray(order.items)
              ? order.items.length
              : 0;
            return (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.orderMeta}>
                    <span className={styles.orderNumber}>
                      Comanda #{order.orderNumber}
                    </span>
                    <span className={styles.orderDate}>
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <span
                    className={`${styles.statusBadge} ${
                      styles['status_' + order.status]
                    }`}
                  >
                    {statusLabel(order.status)}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.orderInfo}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Total</span>
                      <span className={styles.infoValue}>
                        {formatPrice(order.total)}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Produse</span>
                      <span className={styles.infoValue}>
                        {itemCount} {itemCount === 1 ? 'produs' : 'produse'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <Link
                    href={`/orders/${order.id}`}
                    className={styles.detailsLink}
                  >
                    Vezi detalii &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
