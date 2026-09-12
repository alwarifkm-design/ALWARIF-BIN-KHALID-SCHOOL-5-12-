import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'

export default function PrintArea({ content, onAfterPrint }) {
  useEffect(() => {
    if (!content) return

    const handleAfterPrint = () => {
      if (onAfterPrint) onAfterPrint()
    }

    window.addEventListener('afterprint', handleAfterPrint)
    // Small delay to allow DOM render before printing
    const timer = setTimeout(() => {
      window.print()
    }, 150)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [content, onAfterPrint])

  if (!content) return null

  return ReactDOM.createPortal(
    <div className="print-area" style={{ fontFamily: 'Cairo, Alexandria, sans-serif', direction: 'rtl' }}>
      {content}
    </div>,
    document.body
  )
}
