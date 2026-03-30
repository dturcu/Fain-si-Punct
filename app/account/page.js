'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '@/styles/account.module.css';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!res.ok || !data.success) {
          router.push('/auth/login');
          return;
        }
        setUser(data.user);
      } catch {
        router.push('/auth/login');
        return;
      } finally {
        setLoading(false);
      }

      try {
        const res = await fetch('/api/orders/my');
        const data = await res.json();
        if (res.ok && data.success) {
          setOrders((data.data || []).slice(0, 5));
        }
      } catch {
        // orders fetch failed silently
      } finally {
        setOrdersLoading(false);
      }
    }
    fetchData();
  }, [router]);

  function getInitials(firstName, lastName) {
    const f = firstName ? firstName.charAt(0).toUpperCase() : '';
    const l = lastName ? lastName.charAt(0).toUpperCase() : '';
    return f + l || '?';
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
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
      shipped: 'Expediata',
      delivered: 'Livrata',
      cancelled: 'Anulata',
    };
    return map[status] || status;
  }

  if (loading) {
    return (
      <div className={styles.loaderWrap}>
        <div className={styles.spinner} />
        <p className={styles.loaderText}>Se incarca...</p>
      </div>
    );
  }

  if (!user) return null;

  const hasAddress =
    user.address &&
    (user.address.street || user.address.city || user.address.county);

  return (
    <div className={styles.page}>
      {/* Breadcrumbs */}
      <nav className={styles.breadcrumbs}>
        <Link href="/" className={styles.breadLink}>Acasa</Link>
        <span className={styles.breadSep}>&gt;</span>
        <span className={styles.breadCurrent}>Contul meu</span>
      </nav>

      <h1 className={styles.pageTitle}>Contul meu</h1>

      {/* Section 1 - Personal info */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Informatii personale</h2>
        <div className={styles.profileRow}>
          <div className={styles.avatar}>
            {getInitials(user.firstName, user.lastName)}
          </div>
          <div className={styles.profileDetails}>
            <p className={styles.userName}>
              {user.firstName} {user.lastName}
              {user.role === 'admin' && (
                <span className={styles.roleBadge}>Admin</span>
              )}
            </p>
            <p className={styles.userMeta}>
              <span className={styles.metaIcon}>&#9993;</span>
              {user.email}
            </p>
            {user.phone && (
              <p className={styles.userMeta}>
                <span className={styles.metaIcon}>&#9742;</span>
                {user.phone}
              </p>
            )}
          </div>
        </div>
        <button className={styles.btnPrimary}>Editeaza profilul</button>
      </section>

      {/* Section 2 - Shipping address */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Adresa de livrare</h2>
        {hasAddress ? (
          <div className={styles.addressBlock}>
            {user.address.street && <p>{user.address.street}</p>}
            <p>
              {[user.address.city, user.address.county, user.address.zip]
                .filter(Boolean)
                .join(', ')}
            </p>
            {user.address.country && <p>{user.address.country}</p>}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>&#128205;</span>
            <p className={styles.emptyMsg}>Nu ai o adresa salvata.</p>
            <p className={styles.emptyHint}>
              Adauga o adresa pentru a simplifica procesul de comanda.
            </p>
          </div>
        )}
      </section>

      {/* Section 3 - My orders */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Comenzile mele</h2>
        {ordersLoading ? (
          <p className={styles.loadingText}>Se incarca comenzile...</p>
        ) : orders.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>&#128230;</span>
            <p className={styles.emptyMsg}>Nu ai nicio comanda inca.</p>
            <p className={styles.emptyHint}>
              Exploreaza produsele noastre si plaseaza prima ta comanda!
            </p>
            <Link href="/products" className={styles.btnOutline}>
              Vezi produse
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.ordersList}>
              {orders.map((order) => {
                const itemCount = Array.isArray(order.items)
                  ? order.items.length
                  : 0;
                return (
                  <Link
                    href={`/orders/${order.id}`}
                    key={order.id}
                    className={styles.orderRow}
                  >
                    <div className={styles.orderMain}>
                      <span className={styles.orderNumber}>
                        #{order.orderNumber}
                      </span>
                      <span className={styles.orderDate}>
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <div className={styles.orderRight}>
                      <span
                        className={`${styles.statusBadge} ${
                          styles['status_' + order.status]
                        }`}
                      >
                        {statusLabel(order.status)}
                      </span>
                      <span className={styles.orderTotal}>
                        {formatPrice(order.total)}
                      </span>
                      <span className={styles.orderItems}>
                        {itemCount} {itemCount === 1 ? 'produs' : 'produse'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
            <Link href="/account/orders" className={styles.viewAllLink}>
              Vezi toate comenzile &rarr;
            </Link>
          </>
        )}
      </section>

      {/* Section 4 - Quick links */}
      <section className={styles.quickLinks}>
        <Link href="/products" className={styles.quickCard}>
          <span className={styles.quickIcon}>&#128722;</span>
          <span className={styles.quickLabel}>Continua cumparaturile</span>
        </Link>
        <Link href="/cart" className={styles.quickCard}>
          <span className={styles.quickIcon}>&#128717;</span>
          <span className={styles.quickLabel}>Cosul meu</span>
        </Link>
        <Link href="/account/preferences" className={styles.quickCard}>
          <span className={styles.quickIcon}>&#9993;</span>
          <span className={styles.quickLabel}>Preferinte email</span>
        </Link>
      </section>
    </div>
  );
}
