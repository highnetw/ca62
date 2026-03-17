'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  bucket: 'member-photos' | 'meeting-photos'
  currentUrl?: string
  onUpload: (url: string) => void
  shape?: 'circle' | 'rect'
  placeholder?: string
}

export default function ImageUpload({ bucket, currentUrl, onUpload, shape = 'circle', placeholder }: Props) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string>(currentUrl || '')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file) return
    if (file.size > (bucket === 'member-photos' ? 5 : 10) * 1024 * 1024) {
      setError(`파일 크기 제한 초과 (${bucket === 'member-photos' ? '5MB' : '10MB'} 이하)`); return
    }

    setUploading(true); setError('')

    // 미리보기
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    try {
      // 파일명: timestamp_originalname (중복 방지)
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: false })

      if (upErr) { setError('업로드 실패: ' + upErr.message); return }

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
      onUpload(data.publicUrl)
    } catch (e: any) {
      setError('업로드 중 오류가 발생했습니다')
    } finally {
      setUploading(false)
    }
  }

  const isCircle = shape === 'circle'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isCircle ? 'center' : 'flex-start', gap: 10 }}>
      {/* 미리보기 */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          width: isCircle ? 100 : '100%',
          height: isCircle ? 100 : 180,
          borderRadius: isCircle ? '50%' : 12,
          background: 'var(--bg)',
          border: `2px dashed ${preview ? 'var(--gold)' : 'var(--gold-dim)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: uploading ? 'wait' : 'pointer',
          overflow: 'hidden', position: 'relative',
          transition: 'border-color 0.2s',
        }}
      >
        {preview ? (
          <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>📷</div>
            <div>{placeholder || '사진 업로드'}</div>
          </div>
        )}

        {/* 업로드 중 오버레이 */}
        {uploading && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ color: 'var(--gold)', fontSize: 12 }}>업로드 중...</div>
          </div>
        )}

        {/* 편집 아이콘 (사진 있을 때) */}
        {preview && !uploading && (
          <div style={{
            position: 'absolute', bottom: isCircle ? 4 : 8, right: isCircle ? 4 : 8,
            background: 'var(--gold)', borderRadius: '50%',
            width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>✏️</div>
        )}
      </div>

      {/* 버튼들 */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
            background: 'var(--gold)', border: 'none', color: 'var(--bg)', fontWeight: 600,
            opacity: uploading ? 0.6 : 1,
          }}
        >
          {uploading ? '업로드 중...' : preview ? '사진 변경' : '사진 선택'}
        </button>
        {preview && (
          <button
            type="button"
            onClick={() => { setPreview(''); onUpload('') }}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
              background: 'transparent', border: '1px solid #c0392b44', color: 'var(--danger)',
            }}
          >삭제</button>
        )}
      </div>

      {error && <div style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</div>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}
