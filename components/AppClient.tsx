'use client'
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { Member, Album, AlbumPhoto } from '@/lib/types'
import PinModal from '@/components/PinModal'
import BottomNav from '@/components/BottomNav'
import ImageUpload from '@/components/ImageUpload'

// ── 스타일 헬퍼 ────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--navy-dim)',
  borderRadius: 12, padding: 16, marginBottom: 10,
}
const header: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(13,21,53,0.97) 0%, rgba(8,13,26,0.95) 100%)',
  padding: '18px 20px 14px', borderBottom: '1px solid var(--navy-dim)',
  position: 'sticky', top: 0, zIndex: 100,
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: 'var(--bg)', border: '1px solid var(--navy-dim)',
  borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none',
}
const btn = (v: 'gold' | 'outline' | 'red' = 'gold'): React.CSSProperties => ({
  padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
  fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-sans)',
  ...(v === 'gold'    ? { background: 'var(--gold)', color: '#1a1a2e' } :
      v === 'red'     ? { background: '#c0392b22', color: 'var(--danger)', border: '1px solid #c0392b44' } :
                        { background: 'transparent', color: 'var(--gold)', border: '1px solid var(--gold-dim)' }),
})
const label: React.CSSProperties = {
  fontSize: 11, color: 'var(--gold)', letterSpacing: 1,
  marginBottom: 4, display: 'block', textTransform: 'uppercase',
}
const fieldWrap: React.CSSProperties = { marginBottom: 14 }

const CLASS_NAMES = ['', '1반', '2반', '3반', '4반', '5반', '6반', '7반', '8반']
const CATEGORY_LABELS: Record<string, string> = {
  basic:   '📷 기본',
  teacher: '👨‍🏫 선생님',
  class1:  '1️⃣ 1반',
  class2:  '2️⃣ 2반',
  class3:  '3️⃣ 3반',
  class4:  '4️⃣ 4반',
  class5:  '5️⃣ 5반',
  class6:  '6️⃣ 6반',
  class7:  '7️⃣ 7반',
  class8:  '8️⃣ 8반',
  event:   '🎊 행사',
  yearend: '🎉 동기회행사',
}

const ALBUM_CATEGORIES = ['basic','teacher','class1','class2','class3','class4','class5','class6','class7','class8','event'] as const
type AlbumCategory = typeof ALBUM_CATEGORIES[number] | 'yearend'

// ── 스플래시 ────────────────────────────────────────────────────────────────
function Splash({ onDone }: { onDone: () => void }) {
  const [fade, setFade] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => setFade(true), 5400)
    const t2 = setTimeout(onDone, 7200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: fade ? 0 : 1, transition: 'opacity 0.6s ease', zIndex: 9999,
      overflow: 'hidden',
    }}>
      {/* 건물 배경 꽉 채우기 */}
      <img src="/building.png" alt="" style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        objectFit: 'cover', objectPosition: 'center top',
      }} />
      {/* 살짝 어둡게 오버레이 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(8,13,26,0.35) 0%, rgba(8,13,26,0.55) 100%)',
      }} />
      {/* 콘텐츠 */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 140, height: 140, borderRadius: '50%',
          border: '3px solid var(--gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(8,13,26,0.6)',
          animation: 'pulse 2s infinite', marginBottom: 24,
          overflow: 'hidden', padding: 14, boxSizing: 'border-box',
        }}>
          <img src="/mark-choongang.png" alt="중앙고 마크"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: 4, fontFamily: 'var(--font-serif)', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>중앙고 62회</div>
        <div style={{ fontSize: 16, color: 'var(--gold)', letterSpacing: 4, marginTop: 8, opacity: 0.95, textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>동기회</div>
      </div>
    </div>
  )
}

// ── 메인 ────────────────────────────────────────────────────────────────────
export default function AppClient() {
  const [phase, setPhase] = useState<'splash' | 'pin' | 'app'>('splash')
  const [page, setPage] = useState('home')
  const [isAdmin, setIsAdmin] = useState(false)
  const [pinModal, setPinModal] = useState<{ type: any; title: string; onSuccess: () => void } | null>(null)

  const [members, setMembers] = useState<Member[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(false)

  const [selMember, setSelMember] = useState<Member | null>(null)
  const [selAlbum, setSelAlbum] = useState<Album | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)

  const [searchQ, setSearchQ] = useState('')
  const [filterClass, setFilterClass] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'all' | 'class'>('all')

  const [editMember, setEditMember] = useState<Partial<Member> | null>(null)
  const [editAlbum, setEditAlbum] = useState<Partial<Album> | null>(null)

  // ── 데이터 로드 ────────────────────────────────────────────────────────
  const loadMembers = useCallback(async () => {
    const { data } = await supabase.from('62-members').select('*').order('name')
    if (data) setMembers(data)
  }, [])

  const loadAlbums = useCallback(async () => {
    const { data } = await supabase.from('62-albums').select('*, 62-photos(*)').order('category').order('year', { ascending: false })
    if (data) setAlbums(data.map((a: any) => ({ ...a, photos: a['62-photos'] || [] })))
  }, [])

  useEffect(() => {
    if (phase === 'app') {
      setLoading(true)
      Promise.all([loadMembers(), loadAlbums()]).finally(() => setLoading(false))
    }
  }, [phase, loadMembers, loadAlbums])

  const requirePin = (type: any, title: string, onSuccess: () => void) => {
    setPinModal({ type, title, onSuccess: () => { setPinModal(null); onSuccess() } })
  }

  const doBackup = () => {
    const data = JSON.stringify({ members, albums }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `중앙62_백업_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  const nav = (p: string) => { setPage(p); setSelMember(null); setSelAlbum(null) }

  const filteredMembers = members.filter(m => {
    const q = searchQ.toLowerCase()
    const matchQ = !q || m.name.includes(q) || m.company?.includes(q) || String(m.class_no).includes(q)
    const matchC = filterClass === 'all' || m.class_no === Number(filterClass)
    return matchQ && matchC
  })

  const aliveMembers = members.filter(m => !m.is_deceased)
  const deceasedMembers = members.filter(m => m.is_deceased)

  // ══════════════════════════════════════════════════════════════════════
  // ── 홈 ────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════
  const HomePage = () => (
    <div style={{ paddingBottom: 100 }}>
      <div style={header}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/mark-choongang.png" alt="중앙고" style={{ width: 32, height: 32, objectFit: 'contain', opacity: 0.9 }} />
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-serif)', letterSpacing: 2 }}>중앙고 62회</div>
          </div>
          <div>
            {isAdmin
              ? <span style={{ fontSize: 12, color: 'var(--gold)', padding: '5px 12px', border: '1px solid var(--gold-dim)', borderRadius: 8 }}>👑 관리자</span>
              : <button onClick={() => requirePin('admin', '관리자 비밀번호', () => setIsAdmin(true))} style={{ ...btn('outline'), fontSize: 12 }}>관리자</button>
            }
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        {/* 통계 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { label: '전체 동기', value: `${members.length}명`, icon: '👥', page: 'members' },
            { label: '생존 회원', value: `${aliveMembers.length}명`, icon: '🤝', page: 'members' },
            { label: '앨범', value: `${albums.length}개`, icon: '📸', page: 'album' },
            { label: '동기회행사', value: `${albums.filter(a => a.category === 'yearend').length}회`, icon: '🎉', page: 'yearend' },
          ].map(({ label: l, value, icon, page: p }) => (
            <div key={l} onClick={() => nav(p)} style={{ ...card, textAlign: 'center', marginBottom: 0, cursor: 'pointer' }}>
              <div style={{ fontSize: 26 }}>{icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--gold)' }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* 반별 현황 */}
        <div style={card}>
          <div style={{ fontSize: 12, color: 'var(--gold)', letterSpacing: 1, marginBottom: 12 }}>📊 반별 현황</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[1,2,3,4,5,6,7,8].map(c => {
              const cnt = members.filter(m => m.class_no === c).length
              return (
                <div key={c} onClick={() => { setFilterClass(String(c)); nav('members') }}
                  style={{ textAlign: 'center', cursor: 'pointer', padding: '8px 4px', borderRadius: 8, background: 'var(--navy-bg)' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>{cnt}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{c}반</div>
                </div>
              )
            })}
          </div>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button onClick={doBackup} style={{ ...btn('outline'), flex: 1 }}>💾 백업</button>
          </div>
        )}

        {deceasedMembers.length > 0 && (
          <div style={{ ...card, borderColor: '#55335533' }}>
            <div style={{ fontSize: 12, color: '#998', letterSpacing: 1, marginBottom: 8 }}>🕯 별세하신 동기</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {deceasedMembers.map(m => (
                <span key={m.id} style={{ fontSize: 13, color: '#776', padding: '3px 10px', background: '#22203044', borderRadius: 20 }}>
                  {m.name} ({m.class_no}반)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════
  // ── 회원 목록 ─────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════
  const MembersPage = () => (
    <div style={{ paddingBottom: 100 }}>
      <div style={header}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-serif)' }}>동기 명부</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setViewMode(viewMode === 'all' ? 'class' : 'all')}
              style={{ ...btn('outline'), fontSize: 12 }}>{viewMode === 'all' ? '반별보기' : '전체보기'}</button>
          </div>
        </div>
        <input
          defaultValue={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          onCompositionEnd={e => setSearchQ((e.target as HTMLInputElement).value)}
          placeholder="이름 · 반 · 직장 검색"
          style={{ ...inputStyle, marginBottom: 10 }}
        />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {['all', '1','2','3','4','5','6','7','8'].map(c => (
            <button key={c} onClick={() => setFilterClass(c)}
              style={{ ...btn(filterClass === c ? 'gold' : 'outline'), padding: '4px 12px', fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {c === 'all' ? '전체' : `${c}반`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        {viewMode === 'all' ? (
          // 전체 가나다순
          <>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>
              {filteredMembers.filter(m => !m.is_deceased).length}명 (고인 {filteredMembers.filter(m => m.is_deceased).length}명 제외)
            </div>
            {filteredMembers.filter(m => !m.is_deceased).map(m => (
              <MemberCard key={m.id} m={m} />
            ))}
            {filteredMembers.filter(m => m.is_deceased).length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, color: '#776', letterSpacing: 1, marginBottom: 8 }}>🕯 별세</div>
                {filteredMembers.filter(m => m.is_deceased).map(m => (
                  <MemberCard key={m.id} m={m} deceased />
                ))}
              </div>
            )}
          </>
        ) : (
          // 반별 가나다순
          [1,2,3,4,5,6,7,8].map(c => {
            const cm = filteredMembers.filter(m => m.class_no === c && !m.is_deceased)
            if (!cm.length) return null
            return (
              <div key={c} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{c}반</span>
                  <span style={{ background: 'var(--navy-bg)', borderRadius: 10, padding: '1px 8px', fontSize: 11 }}>{cm.length}명</span>
                </div>
                {cm.map(m => <MemberCard key={m.id} m={m} />)}
              </div>
            )
          })
        )}
      </div>
    </div>
  )

  const MemberCard = ({ m, deceased }: { m: Member; deceased?: boolean }) => (
    <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', opacity: deceased ? 0.6 : 1 }}
      onClick={() => { setSelMember(m); setPage('memberDetail') }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: 'var(--navy-bg)', border: `2px solid ${deceased ? '#554' : 'var(--navy-dim)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 700, color: 'var(--gold)', flexShrink: 0, overflow: 'hidden',
      }}>
        {m.photo_url
          ? <img src={m.photo_url} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : m.name[0]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{m.name} {deceased && <span style={{ fontSize: 11, color: '#776' }}>✝</span>}</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
          {m.class_no}반 {m.company ? `· ${m.company}` : ''}
        </div>
      </div>
      <div style={{ fontSize: 20, color: '#445' }}>›</div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════
  // ── 회원 상세 ─────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════
  const MemberDetailPage = () => {
    const m = selMember
    if (!m) return null

    return (
      <div style={{ paddingBottom: 100 }}>
        <div style={header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => nav('members')} style={{ ...btn('outline'), padding: '6px 12px' }}>←</button>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-serif)' }}>{m.name}</div>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%', margin: '0 auto',
              background: 'var(--navy-bg)', border: '3px solid var(--gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, fontWeight: 700, color: 'var(--gold)', overflow: 'hidden',
            }}>
              {m.photo_url
                ? <img src={m.photo_url} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : m.name[0]}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, marginTop: 10 }}>{m.name}</div>
            <div style={{ fontSize: 14, color: 'var(--gold)', marginTop: 4 }}>
              중앙고 62회 {m.class_no}반
              {m.is_deceased && <span style={{ marginLeft: 8, fontSize: 12, color: '#776' }}>✝ 별세</span>}
            </div>
          </div>

          {[
            { label: '휴대폰', value: m.mobile,     href: `tel:${m.mobile}` },
            { label: '이메일', value: m.email,      href: `mailto:${m.email}` },
            { label: '직장',   value: m.company },
            { label: '집전화', value: m.home_phone, href: `tel:${m.home_phone}` },
            { label: '주소',   value: m.address },
          ].filter(f => f.value).map(({ label: l, value, href }) => (
            <div key={l} style={{ ...card, display: 'flex', gap: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--gold)', width: 60, flexShrink: 0, paddingTop: 1 }}>{l}</div>
              {href
                ? <a href={href} style={{ color: 'var(--text)', fontSize: 14 }}>{value}</a>
                : <div style={{ fontSize: 14 }}>{value}</div>}
            </div>
          ))}

          {isAdmin && (
            <button onClick={() => setEditMember({ ...m })} style={{ ...btn(), width: '100%', padding: 12, marginTop: 16 }}>
              ✏️ 정보 수정
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── 회원 편집 모달 (관리자만) ──────────────────────────────────────────
  const MemberEditModal = () => {
    const [form, setForm] = useState<Partial<Member>>({ ...editMember })
    const [saving, setSaving] = useState(false)
    const set = (k: keyof Member, v: any) => setForm(prev => ({ ...prev, [k]: v }))

    const save = async () => {
      if (!form.name) return
      setSaving(true)
      try {
        // 수정만 가능 (삭제/추가 불가)
        if (form.id) {
          const { data } = await supabase.from('62-members')
            .update({ mobile: form.mobile, company: form.company, address: form.address, is_deceased: form.is_deceased, photo_url: form.photo_url })
            .eq('id', form.id).select().single()
          if (data) { setSelMember(data); await loadMembers() }
        }
        setEditMember(null)
      } finally { setSaving(false) }
    }

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 500, overflowY: 'auto' }}>
        <div style={{ background: 'var(--surface)', minHeight: '100vh', maxWidth: 480, margin: '0 auto', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>회원 정보 수정</div>
            <button onClick={() => setEditMember(null)} style={{ ...btn('outline'), padding: '6px 12px' }}>취소</button>
          </div>

          <div style={{ ...card, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>이름: <strong style={{ color: '#fff' }}>{form.name}</strong></div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>반: <strong style={{ color: '#fff' }}>{form.class_no}반</strong></div>
            <div style={{ fontSize: 11, color: '#665', marginTop: 6 }}>※ 이름과 반은 수정할 수 없습니다</div>
          </div>

          {[
            { k: 'email'      as keyof Member, label: '이메일' },
            { k: 'mobile'     as keyof Member, label: '휴대폰' },
            { k: 'company'    as keyof Member, label: '직장' },
            { k: 'home_phone' as keyof Member, label: '집전화' },
            { k: 'address'    as keyof Member, label: '주소' },
          ].map(({ k, label: l }) => (
            <div key={k} style={fieldWrap}>
              <label style={label}>{l}</label>
              <input value={String(form[k] ?? '')} onChange={e => set(k, e.target.value)} style={inputStyle} />
            </div>
          ))}

          <div style={fieldWrap}>
            <label style={label}>생존 여부</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => set('is_deceased', false)}
                style={{ ...btn(!form.is_deceased ? 'gold' : 'outline'), flex: 1 }}>생존</button>
              <button onClick={() => set('is_deceased', true)}
                style={{ ...btn(form.is_deceased ? 'red' : 'outline'), flex: 1 }}>고인</button>
            </div>
          </div>

          <div style={fieldWrap}>
            <label style={label}>프로필 사진</label>
            <ImageUpload
              bucket="member-photos"
              currentUrl={form.photo_url}
              onUpload={url => set('photo_url', url)}
              shape="circle"
            />
          </div>

          <button onClick={save} disabled={saving}
            style={{ ...btn(), width: '100%', padding: 14, fontSize: 16, opacity: saving ? 0.7 : 1 }}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════
  // ── 앨범 ──────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════
  const AlbumPage = () => {
    const [filterCat, setFilterCat] = useState<string>('all')
    const displayCats = filterCat === 'all' ? ALBUM_CATEGORIES : [filterCat as typeof ALBUM_CATEGORIES[number]]
    return (
      <div style={{ paddingBottom: 100 }}>
        <div style={header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-serif)' }}>앨범</div>
            {isAdmin && (
              <button onClick={() => setEditAlbum({ category: 'basic', title: '' })}
                style={{ ...btn(), fontSize: 12 }}>+ 앨범 추가</button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            <button onClick={() => setFilterCat('all')}
              style={{ ...btn(filterCat === 'all' ? 'gold' : 'outline'), padding: '4px 12px', fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0 }}>
              전체
            </button>
            {ALBUM_CATEGORIES.map(c => (
              <button key={c} onClick={() => setFilterCat(c)}
                style={{ ...btn(filterCat === c ? 'gold' : 'outline'), padding: '4px 10px', fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: '16px 20px 0' }}>
          {displayCats.map(cat => {
            const catAlbums = albums.filter(a => a.category === cat)
            if (!catAlbums.length && !isAdmin) return null
            return (
              <div key={cat} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: 'var(--gold)', letterSpacing: 1, marginBottom: 10 }}>
                  {CATEGORY_LABELS[cat]}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {catAlbums.map(a => (
                    <div key={a.id} onClick={() => { setSelAlbum(a); setPage('albumDetail') }}
                      style={{ ...card, marginBottom: 0, cursor: 'pointer', padding: 0, overflow: 'hidden' }}>
                      <div style={{
                        height: 100, background: 'var(--navy-bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                      }}>
                        {a.cover_url
                          ? <img src={a.cover_url} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 32 }}>{CATEGORY_LABELS[cat].split(' ')[0]}</span>}
                      </div>
                      <div style={{ padding: '10px 12px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{a.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{(a.photos || []).length}장</div>
                      </div>
                    </div>
                  ))}
                  {!catAlbums.length && isAdmin && (
                    <div onClick={() => setEditAlbum({ category: cat, title: CATEGORY_LABELS[cat].split(' ').slice(1).join(' ') })}
                      style={{ ...card, marginBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80, border: '1px dashed var(--navy-dim)', color: 'var(--text-dim)', fontSize: 13 }}>
                      + 앨범 추가
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── 앨범 상세 ────────────────────────────────────────────────────────
  const AlbumDetailPage = () => {
    const a = selAlbum
    if (!a) return null
    return (
      <div style={{ paddingBottom: 100 }}>
        <div style={header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => nav('album')} style={{ ...btn('outline'), padding: '6px 12px' }}>←</button>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{a.title}</div>
          </div>
        </div>
        <div style={{ padding: 16 }}>
          {isAdmin && (
            <button onClick={() => setEditAlbum({ ...a })} style={{ ...btn('outline'), width: '100%', marginBottom: 12, fontSize: 12 }}>
              📷 사진 추가
            </button>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
            {(a.photos || []).map(p => (
              <div key={p.id} style={{ position: 'relative', aspectRatio: '1', background: 'var(--navy-bg)', borderRadius: 6, overflow: 'hidden' }}>
                <img
                  src={p.url}
                  alt=""
                  loading="lazy"
                  onClick={() => setLightbox(p.url)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', display: 'block' }}
                />
                {isAdmin && (
                  <button
                    onClick={async e => {
                      e.stopPropagation()
                      if (!confirm('이 사진을 삭제하시겠습니까?')) return
                      await supabase.from('62-photos').delete().eq('id', p.id)
                      await loadAlbums()
                      const updated = albums.find(x => x.id === a.id)
                      if (updated) setSelAlbum(updated)
                    }}
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      background: 'rgba(192,57,43,0.85)', border: 'none',
                      borderRadius: '50%', width: 24, height: 24,
                      color: '#fff', fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                )}
              </div>
            ))}
          </div>
          {!(a.photos || []).length && (
            <div style={{ textAlign: 'center', color: '#445', padding: 40 }}>사진이 없습니다</div>
          )}
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════
  // ── 송년회 ────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════
  const YearendPage = () => {
    const yearendAlbums = albums.filter(a => a.category === 'yearend').sort((a, b) => (b.year || 0) - (a.year || 0))
    return (
      <div style={{ paddingBottom: 100 }}>
        <div style={header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-serif)' }}>동기회행사</div>
            {isAdmin && (
              <button onClick={() => setEditAlbum({ category: 'yearend', title: '', year: new Date().getFullYear() })}
                style={{ ...btn(), fontSize: 12 }}>+ 추가</button>
            )}
          </div>
        </div>
        <div style={{ padding: '16px 20px 0' }}>
          {yearendAlbums.map(a => (
            <div key={a.id} style={{ ...card, cursor: 'pointer' }}
              onClick={() => { setSelAlbum(a); setPage('albumDetail') }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{
                  width: 70, height: 70, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                  background: 'var(--navy-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {a.cover_url
                    ? <img src={a.cover_url} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 28 }}>🎉</span>}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{a.year}년 송년회</div>
                  <div style={{ fontSize: 13, color: 'var(--gold)', marginTop: 2 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{(a.photos || []).length}장</div>
                </div>
              </div>
            </div>
          ))}
          {!yearendAlbums.length && <div style={{ textAlign: 'center', color: '#445', padding: 40 }}>동기회행사 사진이 없습니다</div>}
        </div>
      </div>
    )
  }

  // ── 앨범 편집 모달 ────────────────────────────────────────────────────
  const AlbumEditModal = () => {
    const [form, setForm] = useState<Partial<Album>>({ ...editAlbum })
    const [newPhotos, setNewPhotos] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)
    const setF = (k: keyof Album, v: any) => setForm(prev => ({ ...prev, [k]: v }))

    const handleFiles = async (files: FileList) => {
      setUploading(true)
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage.from('album-photos').upload(fileName, file)
        if (!error) {
          const { data } = supabase.storage.from('album-photos').getPublicUrl(fileName)
          uploaded.push(data.publicUrl)
        }
      }
      setNewPhotos(prev => [...prev, ...uploaded])
      setUploading(false)
    }

    const save = async () => {
      if (!form.title) return
      setSaving(true)
      try {
        let albumId = form.id
        if (albumId) {
          await supabase.from('62-albums').update({ title: form.title, category: form.category, class_no: form.class_no, year: form.year, cover_url: form.cover_url }).eq('id', albumId)
        } else {
          const { data } = await supabase.from('62-albums').insert({ title: form.title, category: form.category, class_no: form.class_no, year: form.year, cover_url: form.cover_url }).select().single()
          albumId = data?.id
        }
        if (albumId && newPhotos.length) {
          await supabase.from('62-photos').insert(newPhotos.map(url => ({ album_id: albumId, url })))
        }
        await loadAlbums()
        setEditAlbum(null)
      } finally { setSaving(false) }
    }

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 500, overflowY: 'auto' }}>
        <div style={{ background: 'var(--surface)', minHeight: '100vh', maxWidth: 480, margin: '0 auto', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>{form.id ? '앨범 수정' : '앨범 추가'}</div>
            <button onClick={() => setEditAlbum(null)} style={{ ...btn('outline'), padding: '6px 12px' }}>취소</button>
          </div>

          <div style={fieldWrap}>
            <label style={label}>카테고리</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {([...ALBUM_CATEGORIES, 'yearend'] as const).map(c => (
                <button key={c} onClick={() => setF('category', c)}
                  style={{ ...btn(form.category === c ? 'gold' : 'outline'), padding: '5px 10px', fontSize: 11 }}>
                  {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          {form.category === 'yearend' && (
            <div style={fieldWrap}>
              <label style={label}>연도</label>
              <input type="number" value={form.year || ''} onChange={e => setF('year', Number(e.target.value))} style={inputStyle} />
            </div>
          )}

          <div style={fieldWrap}>
            <label style={label}>앨범 제목</label>
            <input value={form.title || ''} onChange={e => setF('title', e.target.value)} style={inputStyle} />
          </div>

          <div style={fieldWrap}>
            <label style={label}>사진 추가</label>
            {newPhotos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                {newPhotos.map((url, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />
                    <button onClick={() => setNewPhotos(prev => prev.filter((_, j) => j !== i))}
                      style={{ position: 'absolute', top: 4, right: 4, background: '#c0392b', border: 'none', borderRadius: '50%', width: 22, height: 22, color: '#fff', fontSize: 12, cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <label style={{ ...btn('outline'), display: 'block', textAlign: 'center', padding: 12, cursor: 'pointer' }}>
              {uploading ? '업로드 중...' : '📷 사진 선택 (여러 장)'}
              <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={e => { if (e.target.files?.length) handleFiles(e.target.files) }} />
            </label>
          </div>

          <button onClick={save} disabled={saving}
            style={{ ...btn(), width: '100%', padding: 14, fontSize: 16, opacity: saving ? 0.7 : 1 }}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════
  // ── 렌더 ──────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════
  const activeNav = page === 'memberDetail' ? 'members'
    : page === 'albumDetail' ? (selAlbum?.category === 'yearend' ? 'yearend' : 'album')
    : page

  if (phase === 'splash') return <Splash onDone={() => setPhase('pin')} />
  if (phase === 'pin') return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <PinModal type="entry" title="중앙고 62회" onSuccess={() => setPhase('app')} onCancel={() => {}} />
    </div>
  )

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 70 }}>
      {loading && (
        <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, height: 2, background: 'linear-gradient(90deg, var(--bg), var(--gold), var(--bg))', zIndex: 9999 }} />
      )}

      {page === 'home'         && <HomePage />}
      {page === 'members'      && <MembersPage />}
      {page === 'memberDetail' && <MemberDetailPage />}
      {page === 'album'        && <AlbumPage />}
      {page === 'albumDetail'  && <AlbumDetailPage />}
      {page === 'yearend'      && <YearendPage />}

      {editMember && <MemberEditModal />}
      {editAlbum  && <AlbumEditModal />}
      {pinModal   && <PinModal type={pinModal.type} title={pinModal.title} onSuccess={pinModal.onSuccess} onCancel={() => setPinModal(null)} />}

      {lightbox && typeof document !== 'undefined' && createPortal(
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.97)',
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img src={lightbox} alt="" style={{
            maxWidth: '100vw', maxHeight: '100vh',
            width: 'auto', height: 'auto',
            objectFit: 'contain',
          }} />
          <button onClick={e => { e.stopPropagation(); setLightbox(null) }} style={{
            position: 'fixed', top: 20, right: 20,
            background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '50%', width: 44, height: 44, color: '#fff', fontSize: 22,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100000,
          }}>✕</button>
        </div>,
        document.body
      )}

      <BottomNav current={activeNav} onChange={nav} />
    </div>
  )
}
