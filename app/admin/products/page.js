'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from '@/styles/admin-products.module.css'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [search, setSearch] = useState('')
  const [searchDebounce, setSearchDebounce] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchProducts()
  }, [page, searchDebounce])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: page.toString(), limit: '20' })
      if (searchDebounce) params.append('search', searchDebounce)

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()
      setProducts(data.data || [])
      if (data.pagination) {
        setTotal(data.pagination.total)
        setTotalPages(Math.ceil(data.pagination.total / data.pagination.limit) || 1)
      }
    } catch (error) {
      console.error('Eroare la incarcarea produselor:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product) => {
    setEditingId(product._id)
    setEditData({
      name: product.name || '',
      price: product.price || 0,
      stock: product.stock || 0,
      category: product.category || '',
      description: product.description || '',
      image: product.image || '',
    })
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()

      if (data.success) {
        setEditData((prev) => ({ ...prev, image: data.data.url }))
      } else {
        alert(data.error || 'Eroare la incarcarea imaginii')
      }
    } catch {
      alert('Eroare la incarcarea imaginii')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/products/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })

      if (response.ok) {
        setEditingId(null)
        fetchProducts()
      }
    } catch (error) {
      console.error('Eroare la salvarea produsului:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Esti sigur ca vrei sa stergi acest produs? Aceasta actiune nu poate fi anulata.')) return

    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      fetchProducts()
    } catch (error) {
      console.error('Eroare la stergerea produsului:', error)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gestionare produse</h1>
        <Link href="/admin" className={styles.backLink}>Inapoi la panou</Link>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Cauta produse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className={styles.totalCount}>{total} produse in total</span>
      </div>

      {loading ? (
        <div className={styles.loading}>Se incarca...</div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Produs</th>
                  <th>Categorie</th>
                  <th>Pret</th>
                  <th>Stoc</th>
                  <th>Actiuni</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td className={styles.productName}>{product.name}</td>
                    <td>{product.category}</td>
                    <td className={styles.price}>{Number(product.price).toFixed(2)} lei</td>
                    <td>
                      <span
                        className={`${styles.stockBadge} ${
                          product.stock <= 0
                            ? styles.stockOut
                            : product.stock <= 10
                            ? styles.stockLow
                            : styles.stockOk
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className={styles.actions}>
                      <button className={styles.editBtn} onClick={() => handleEdit(product)}>
                        Editeaza
                      </button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(product._id)}>
                        Sterge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {products.length === 0 && (
            <div className={styles.emptyState}>Niciun produs gasit.</div>
          )}

          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Anterioara
            </button>
            <span className={styles.pageInfo}>Pagina {page} din {totalPages}</span>
            <button
              className={styles.pageBtn}
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Urmatoarea
            </button>
          </div>
        </>
      )}

      {editingId && (
        <div className={styles.modal} onClick={() => setEditingId(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Editeaza produsul</h3>
            <div className={styles.formGroup}>
              <label>Nume</label>
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Pret (lei)</label>
              <input
                type="number"
                step="0.01"
                value={editData.price}
                onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Stoc</label>
              <input
                type="number"
                value={editData.stock}
                onChange={(e) => setEditData({ ...editData, stock: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Categorie</label>
              <input
                type="text"
                value={editData.category}
                onChange={(e) => setEditData({ ...editData, category: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Descriere</label>
              <textarea
                rows="3"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Imagine produs</label>
              {editData.image && (
                <div className={styles.imagePreview}>
                  <img src={editData.image} alt="Preview" />
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              {uploading && <span className={styles.uploadingText}>Se incarca...</span>}
              <input
                type="text"
                placeholder="Sau introdu URL-ul imaginii"
                value={editData.image}
                onChange={(e) => setEditData({ ...editData, image: e.target.value })}
                style={{ marginTop: '0.5rem' }}
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.saveBtn} onClick={handleSave}>Salveaza</button>
              <button className={styles.cancelBtn} onClick={() => setEditingId(null)}>Anuleaza</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
