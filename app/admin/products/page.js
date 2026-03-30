'use client'

import { useEffect, useState } from 'react'
import styles from '@/styles/admin-products.module.css'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})

  useEffect(() => {
    fetchProducts()
  }, [page])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/products?page=${page}&limit=20`
      )
      const data = await response.json()
      setProducts(data.data)
      setTotal(data.pagination.total)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product) => {
    setEditingId(product._id)
    setEditData(product)
  }

  const handleSave = async () => {
    try {
      const response = await fetch(
        `/api/products/${editingId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editData),
        }
      )

      if (response.ok) {
        setEditingId(null)
        fetchProducts()
      }
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return

    try {
      await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className={styles.container}>
      <h2>Manage Products</h2>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id}>
              <td>{product.name}</td>
              <td>{product.category}</td>
              <td>${product.price}</td>
              <td>{product.stock}</td>
              <td className={styles.actions}>
                <button
                  className={styles.editBtn}
                  onClick={() => handleEdit(product)}
                >
                  Edit
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(product._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingId && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Edit Product</h3>
            <input
              type="text"
              placeholder="Name"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            />
            <input
              type="number"
              placeholder="Price"
              value={editData.price}
              onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })}
            />
            <input
              type="number"
              placeholder="Stock"
              value={editData.stock}
              onChange={(e) => setEditData({ ...editData, stock: parseInt(e.target.value) })}
            />
            <div className={styles.modalActions}>
              <button onClick={handleSave}>Save</button>
              <button onClick={() => setEditingId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.pagination}>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <span>Page {page}</span>
        <button
          disabled={page * 20 >= total}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
