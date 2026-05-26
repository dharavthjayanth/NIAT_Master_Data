import { useState, useCallback } from 'react'

let _addToast = null

export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }, [])

  _addToast = addToast
  return { toasts, addToast }
}

export function toast(msg, type = 'success') {
  if (_addToast) _addToast(msg, type)
}

export function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
      ))}
    </div>
  )
}
