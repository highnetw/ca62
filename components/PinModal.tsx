'use client'
import { useState, useEffect, useRef } from 'react'
import { PinType } from '@/lib/types'

interface Props {
  type: PinType
  title: string
  onSuccess: () => void
  onCancel: () => void
}

export default function PinModal({ type, title, onSuccess, onCancel }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = async () => {
    if (!pin || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, pin }),
      })
      const { ok } = await res.json()
      if (ok) { onSuccess() }
      else { setError(true); setPin(''); setTimeout(() => setError(false), 800) }
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--navy)',
        borderRadius: 16, padding: '32px 36px', minWidth: 300, textAlign: 'center',
        animation: error ? 'shake 0.3s ease' : 'fadeIn 0.2s ease',
      }}>
        <div style={{ fontSize: 13, color: 'var(--gold)', letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 24 }}>비밀번호를 입력하세요</div>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          maxLength={8}
          style={{
            width: '100%', padding: '12px 16px',
            background: error ? '#1a1a2a' : 'var(--bg)',
            border: `2px solid ${error ? 'var(--danger)' : 'var(--navy-dim)'}`,
            borderRadius: 8, color: '#fff', fontSize: 22,
            textAlign: 'center', letterSpacing: 10, outline: 'none',
            transition: 'all 0.2s',
          }}
          placeholder="••••"
        />
        {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>비밀번호가 틀렸습니다</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: 10, background: 'transparent',
            border: '1px solid #444', borderRadius: 8, color: 'var(--text-dim)',
          }}>취소</button>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 1, padding: 10, background: 'var(--gold)',
            border: 'none', borderRadius: 8, color: '#1a1a2e',
            fontWeight: 700, opacity: loading ? 0.7 : 1,
          }}>{loading ? '...' : '확인'}</button>
        </div>
      </div>
    </div>
  )
}
