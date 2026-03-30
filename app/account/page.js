'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from '@/styles/account.module.css'

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)

  // Profile edit
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  // Address edit
  const [editingAddress, setEditingAddress] = useState(false)
  const [addressForm, setAddressForm] = useState({
    street: '', city: '', state: '', zip: '', country: 'Romania',
  })
  const [addressSaving, setAddressSaving] = useState(false)
  const [addressMsg, setAddressMsg] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (!res.ok || !data.success) {
        router.push('/auth/login')
        return
      }
      setUser(data.user)
      setProfileForm({
        firstName: data.user.firstName || '',
        lastName: data.user.lastName || '',
        phone: data.user.phone || '',
      })
      setAddressForm({
        street: data.user.address?.street || '',
        city: data.user.address?.city || '',
        state: data.user.address?.state || '',
        zip: data.user.address?.zip || '',
        country: data.user.address?.country || 'Romania',
      })
    } catch {
      router.push('/auth/login')
      return
    } finally {
      setLoading(false)
    }

    try {
      const res = await fetch('/api/orders/my')
      const data = await res.json()
      if (res.ok && data.success) {
        setOrders((data.data || []).slice(0, 5))
      }
    } catch {
      // ignore
    } finally {
      setOrdersLoading(false)
    }
  }

  async function saveProfile() {
    setProfileSaving(true)
    setProfileMsg('')
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          phone: profileForm.phone,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.user)
        setEditingProfile(false)
        setProfileMsg('Profilul a fost actualizat cu succes!')
        setTimeout(() => setProfileMsg(''), 3000)
      } else {
        setProfileMsg('Eroare: ' + (data.error || 'Nu s-a putut salva'))
      }
    } catch (err) {
      setProfileMsg('Eroare: ' + err.message)
    } finally {
      setProfileSaving(false)
    }
  }

  async function saveAddress() {
    setAddressSaving(true)
    setAddressMsg('')
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addressForm }),
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.user)
        setEditingAddress(false)
        setAddressMsg('Adresa a fost salvata cu succes!')
        setTimeout(() => setAddressMsg(''), 3000)
      } else {
        setAddressMsg('Eroare: ' + (data.error || 'Nu s-a putut salva'))
      }
    } catch (err) {
      setAddressMsg('Eroare: ' + err.message)
    } finally {
      setAddressSaving(false)
    }
  }

  function getInitials(firstName, lastName) {
    const f = firstName ? firstName.charAt(0).toUpperCase() : ''
    const l = lastName ? lastName.charAt(0).toUpperCase() : ''
    return f + l || '?'
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('ro-RO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  }

  function formatPrice(val) {
    return parseFloat(val).toFixed(2) + ' lei'
  }

  const statusLabels = {
    pending: 'In asteptare',
    processing: 'In procesare',
    shipped: 'Expediata',
    delivered: 'Livrata',
    cancelled: 'Anulata',
  }

  if (loading) {
    return (
      <div className={styles.loaderWrap}>
        <div className={styles.spinner} />
        <p className={styles.loaderText}>Se incarca...</p>
      </div>
    )
  }

  if (!user) return null

  const hasAddress = user.address &&
    (user.address.street || user.address.city || user.address.state)

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumbs}>
        <Link href="/" className={styles.breadLink}>Acasa</Link>
        <span className={styles.breadSep}>&gt;</span>
        <span className={styles.breadCurrent}>Contul meu</span>
      </nav>

      <h1 className={styles.pageTitle}>Contul meu</h1>

      {/* Section 1 - Personal info */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Informatii personale</h2>

        {profileMsg && (
          <div className={profileMsg.startsWith('Eroare') ? styles.msgError : styles.msgSuccess}>
            {profileMsg}
          </div>
        )}

        {!editingProfile ? (
          <>
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
            <button
              className={styles.btnPrimary}
              onClick={() => setEditingProfile(true)}
            >
              Editeaza profilul
            </button>
          </>
        ) : (
          <div className={styles.editForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Prenume</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nume</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Telefon</label>
              <input
                type="tel"
                className={styles.formInput}
                placeholder="07XX XXX XXX"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>
            <div className={styles.formActions}>
              <button
                className={styles.btnPrimary}
                onClick={saveProfile}
                disabled={profileSaving}
              >
                {profileSaving ? 'Se salveaza...' : 'Salveaza'}
              </button>
              <button
                className={styles.btnCancel}
                onClick={() => {
                  setEditingProfile(false)
                  setProfileForm({
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    phone: user.phone || '',
                  })
                }}
              >
                Anuleaza
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Section 2 - Shipping address */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Adresa de livrare</h2>

        {addressMsg && (
          <div className={addressMsg.startsWith('Eroare') ? styles.msgError : styles.msgSuccess}>
            {addressMsg}
          </div>
        )}

        {!editingAddress ? (
          <>
            {hasAddress ? (
              <div className={styles.addressBlock}>
                {user.address.street && <p>{user.address.street}</p>}
                <p>
                  {[user.address.city, user.address.state, user.address.zip]
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
            <button
              className={styles.btnPrimary}
              onClick={() => setEditingAddress(true)}
              style={{ marginTop: hasAddress ? '1rem' : 0 }}
            >
              {hasAddress ? 'Editeaza adresa' : 'Adauga adresa'}
            </button>
          </>
        ) : (
          <div className={styles.editForm}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Strada, numar, bloc, apartament</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Str. Exemplu nr. 10, bl. A, ap. 5"
                value={addressForm.street}
                onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Oras</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Judet</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Cod postal</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={addressForm.zip}
                  onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tara</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={addressForm.country}
                  onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.formActions}>
              <button
                className={styles.btnPrimary}
                onClick={saveAddress}
                disabled={addressSaving}
              >
                {addressSaving ? 'Se salveaza...' : 'Salveaza adresa'}
              </button>
              <button
                className={styles.btnCancel}
                onClick={() => {
                  setEditingAddress(false)
                  setAddressForm({
                    street: user.address?.street || '',
                    city: user.address?.city || '',
                    state: user.address?.state || '',
                    zip: user.address?.zip || '',
                    country: user.address?.country || 'Romania',
                  })
                }}
              >
                Anuleaza
              </button>
            </div>
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
                const itemCount = Array.isArray(order.items) ? order.items.length : 0
                return (
                  <Link href={`/orders/${order.id}`} key={order.id} className={styles.orderRow}>
                    <div className={styles.orderMain}>
                      <span className={styles.orderNumber}>#{order.orderNumber}</span>
                      <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
                    </div>
                    <div className={styles.orderRight}>
                      <span className={`${styles.statusBadge} ${styles['status_' + order.status]}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                      <span className={styles.orderTotal}>{formatPrice(order.total)}</span>
                      <span className={styles.orderItems}>
                        {itemCount} {itemCount === 1 ? 'produs' : 'produse'}
                      </span>
                    </div>
                  </Link>
                )
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
  )
}
