'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import styles from '@/styles/admin-import.module.css'

const ACCEPTED_TYPES = '.csv,.xlsx,.xls'

export default function AdminImport() {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setResult(null)
    }
  }

  const handleImport = async (e) => {
    e.preventDefault()
    const file = fileInputRef.current?.files[0]

    if (!file) {
      alert('Te rugam sa selectezi un fisier')
      return
    }

    const validExtensions = ['.csv', '.xlsx', '.xls']
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!validExtensions.includes(ext)) {
      alert('Format invalid. Te rugam sa incarci un fisier CSV sau Excel (.xlsx, .xls)')
      return
    }

    try {
      setUploading(true)
      setProgress(0)
      setResult(null)

      const formData = new FormData()
      formData.append('file', file)

      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/admin/products/import', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      const data = await response.json()

      if (data.success) {
        setResult({
          success: true,
          message: `Import reusit! ${data.data.successCount} produse importate cu succes. ${data.data.errorCount} erori.`,
          details: data.data,
        })
      } else {
        setResult({
          success: false,
          message: data.error || 'Eroare la importul produselor',
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: error.message || 'Eroare neasteptata la import',
      })
    } finally {
      setUploading(false)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Import produse</h1>
        <Link href="/admin" className={styles.backLink}>Inapoi la panou</Link>
      </div>

      <div className={styles.instructions}>
        <h3>Instructiuni de import</h3>
        <p>Puteti importa produse din fisiere <strong>CSV</strong> sau <strong>Excel (.xlsx, .xls)</strong>.</p>
        <p>Fisierul trebuie sa contina urmatoarele coloane:</p>
        <code>name, price, category, stock, description, image, sku</code>
        <div className={styles.exampleBlock}>
          <h4>Exemplu:</h4>
          <pre>
{`name,price,category,stock,description,image,sku
Widget Premium,99.99,Electronice,100,Un widget de calitate,https://example.com/img.jpg,SKU-001
Unealta Deluxe,149.99,Unelte,50,Unealta profesionala,https://example.com/img2.jpg,SKU-002`}
          </pre>
        </div>
        <div className={styles.noteBlock}>
          <strong>Nota:</strong> Preturile sunt in lei (RON). Asigurati-va ca valorile sunt corecte inainte de import.
        </div>
      </div>

      <form onSubmit={handleImport} className={styles.form}>
        <div className={styles.uploadArea}>
          <div className={styles.uploadIcon}>📁</div>
          <p className={styles.uploadText}>
            {selectedFile
              ? `Fisier selectat: ${selectedFile.name}`
              : 'Selecteaza un fisier CSV sau Excel'}
          </p>
          <input
            type="file"
            ref={fileInputRef}
            accept={ACCEPTED_TYPES}
            disabled={uploading}
            onChange={handleFileChange}
            className={styles.fileInput}
          />
          <button
            type="button"
            className={styles.browseBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            Alege fisier
          </button>
        </div>

        {uploading && (
          <div className={styles.progressWrapper}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <span className={styles.progressText}>{progress}%</span>
          </div>
        )}

        <button type="submit" className={styles.importBtn} disabled={uploading || !selectedFile}>
          {uploading ? 'Se importa...' : 'Importa produse'}
        </button>
      </form>

      {result && (
        <div className={`${styles.result} ${result.success ? styles.success : styles.error}`}>
          <p className={styles.resultMessage}>{result.message}</p>
          {result.details && (
            <details className={styles.resultDetails}>
              <summary>Detalii</summary>
              <pre>{JSON.stringify(result.details, null, 2)}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
