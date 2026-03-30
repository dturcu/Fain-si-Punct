'use client'

import { useRef, useState } from 'react'
import styles from '@/styles/admin-import.module.css'

export default function AdminImport() {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)

  const handleImport = async (e) => {
    e.preventDefault()
    const file = fileInputRef.current.files[0]

    if (!file) {
      alert('Please select a file')
      return
    }

    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(
        `/api/admin/products/import`,
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await response.json()

      if (data.success) {
        setResult({
          success: true,
          message: `Successfully imported ${data.data.successCount} products. ${data.data.errorCount} errors.`,
          details: data.data,
        })
      } else {
        setResult({
          success: false,
          message: data.error,
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: error.message,
      })
    } finally {
      setUploading(false)
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={styles.container}>
      <h2>Import Products from CSV</h2>

      <div className={styles.instructions}>
        <h3>CSV Format:</h3>
        <p>Your CSV file should have the following columns:</p>
        <code>name,price,category,stock,description,image,sku</code>
        <p>Example:</p>
        <pre>
          {`Premium Widget,99.99,Electronics,100,A high-quality widget,https://example.com/image.jpg,SKU-001
Deluxe Tool,149.99,Tools,50,Professional grade tool,https://example.com/image2.jpg,SKU-002`}
        </pre>
      </div>

      <form onSubmit={handleImport} className={styles.form}>
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          disabled={uploading}
        />
        <button type="submit" disabled={uploading}>
          {uploading ? 'Importing...' : 'Import Products'}
        </button>
      </form>

      {result && (
        <div
          className={`${styles.result} ${
            result.success ? styles.success : styles.error
          }`}
        >
          <p>{result.message}</p>
          {result.details && (
            <details>
              <summary>Details</summary>
              <pre>{JSON.stringify(result.details, null, 2)}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
