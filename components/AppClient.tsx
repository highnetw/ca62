'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Member, Album } from '@/lib/types'
import PinModal from '@/components/PinModal'
import BottomNav from '@/components/BottomNav'
import ImageUpload from '@/components/ImageUpload'

// ── 스타일 상수 ───────────────────────────────────────────────────────────────
const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--navy-dim)', borderRadius: 12, padding: 16, marginBottom: 10 }
const hdr: React.CSSProperties = { background: 'linear-gradient(180deg, rgba(13,21,53,0.97) 0%, rgba(8,13,26,0.95) 100%)', padding: '18px 20px 14px', borderBottom: '1px solid var(--navy-dim)', position: 'sticky', top: 0, zIndex: 100 }
const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--navy-dim)', borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none' }
const btn = (v: 'gold'|'outline'|'red' = 'gold'): React.CSSProperties => ({ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-sans)', ...(v==='gold'?{background:'var(--gold)',color:'#1a1a2e'}:v==='red'?{background:'#c0392b22',color:'var(--danger)',border:'1px solid #c0392b44'}:{background:'transparent',color:'var(--gold)',border:'1px solid var(--gold-dim)'}) })
const lbl: React.CSSProperties = { fontSize: 11, color: 'var(--gold)', letterSpacing: 1, marginBottom: 4, display: 'block', textTransform: 'uppercase' }
const fw: React.CSSProperties = { marginBottom: 14 }

const CAT: Record<string, string> = { basic:'📷 기본', teacher:'👨‍🏫 선생님', class1:'1️⃣ 1반', class2:'2️⃣ 2반', class3:'3️⃣ 3반', class4:'4️⃣ 4반', class5:'5️⃣ 5반', class6:'6️⃣ 6반', class7:'7️⃣ 7반', class8:'8️⃣ 8반', event:'🎊 행사', yearend:'🎉 동기회행사' }
const ALBUM_CATS = ['basic','teacher','class1','class2','class3','class4','class5','class6','class7','class8','event'] as const

// ── 스플래시 ──────────────────────────────────────────────────────────────────
function Splash({ onDone }: { onDone: ()=>void }) {
  const [fade, setFade] = useState(false)
  useEffect(() => { const t1=setTimeout(()=>setFade(true),2700); const t2=setTimeout(onDone,3000); return ()=>{clearTimeout(t1);clearTimeout(t2)} }, [onDone])
  return (
    <div style={{ position:'fixed', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', opacity:fade?0:1, transition:'opacity 0.8s ease', zIndex:9999, overflow:'hidden' }}>
      <img src="/building.png" alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(8,13,26,0.15) 0%, rgba(8,13,26,0.30) 100%)' }} />
      <div style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ width:140, height:140, borderRadius:'50%', border:'3px solid var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(8,13,26,0.6)', animation:'pulse 2s infinite', marginBottom:24, overflow:'hidden', padding:14, boxSizing:'border-box' }}>
          <img src="/mark-choongang.png" alt="중앙고" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
        </div>
        <div style={{ fontSize:30, fontWeight:900, color:'#fff', letterSpacing:4, fontFamily:'var(--font-serif)', textShadow:'0 2px 8px rgba(0,0,0,0.8)' }}>중앙고 62회</div>
        <div style={{ fontSize:16, color:'var(--gold)', letterSpacing:4, marginTop:8, opacity:0.95, textShadow:'0 2px 6px rgba(0,0,0,0.8)' }}>동기회</div>
      </div>
    </div>
  )
}

// ── 홈 ───────────────────────────────────────────────────────────────────────
function HomePage({ members, albums, isAdmin, onNav, onAdmin, onBackup }: { members:Member[], albums:Album[], isAdmin:boolean, onNav:(p:string)=>void, onAdmin:()=>void, onBackup:()=>void }) {
  const alive = members.filter(m => !m.is_deceased)
  const deceased = members.filter(m => m.is_deceased)
  return (
    <div style={{ paddingBottom:100 }}>
      <div style={hdr}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <img src="/mark-choongang.png" alt="중앙고" style={{ width:32, height:32, objectFit:'contain', opacity:0.9 }} />
            <div style={{ fontSize:22, fontWeight:900, color:'#fff', fontFamily:'var(--font-serif)', letterSpacing:2 }}>중앙고 62회</div>
          </div>
          {isAdmin ? <span style={{ fontSize:12, color:'var(--gold)', padding:'5px 12px', border:'1px solid var(--gold-dim)', borderRadius:8 }}>👑 관리자</span>
                   : <button onClick={onAdmin} style={{ ...btn('outline'), fontSize:12 }}>관리자</button>}
        </div>
      </div>
      <div style={{ padding:'20px 20px 0' }}>
        {/* 상단 카드: 동기명단(좌) + 앨범/행사(우) */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
          <div onClick={()=>onNav('members')} style={{ ...card, textAlign:'center', marginBottom:0, cursor:'pointer' }}>
            <div style={{ fontSize:26 }}>👥</div>
            <div style={{ fontSize:22, fontWeight:900, color:'var(--gold)' }}>{alive.length}명</div>
            <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>동기명단</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div onClick={()=>onNav('album')} style={{ ...card, textAlign:'center', marginBottom:0, cursor:'pointer', padding:12 }}>
              <div style={{ fontSize:20 }}>📸</div>
              <div style={{ fontSize:16, fontWeight:900, color:'var(--gold)' }}>{albums.filter(a=>a.category!=='yearend').length}개</div>
              <div style={{ fontSize:10, color:'var(--text-dim)' }}>앨범</div>
            </div>
            <div onClick={()=>onNav('yearend')} style={{ ...card, textAlign:'center', marginBottom:0, cursor:'pointer', padding:12 }}>
              <div style={{ fontSize:20 }}>🎉</div>
              <div style={{ fontSize:16, fontWeight:900, color:'var(--gold)' }}>{albums.filter(a=>a.category==='yearend').length}회</div>
              <div style={{ fontSize:10, color:'var(--text-dim)' }}>동기회행사</div>
            </div>
          </div>
        </div>

        {/* 반별 현황 + 별세 탭 */}
        <div style={card}>
          <div style={{ fontSize:12, color:'var(--gold)', letterSpacing:1, marginBottom:12 }}>📊 반별 현황</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
            {[1,2,3,4,5,6,7,8].map(c => (
              <div key={c} onClick={()=>onNav('members')} style={{ textAlign:'center', cursor:'pointer', padding:'8px 4px', borderRadius:8, background:'var(--navy-bg)' }}>
                <div style={{ fontSize:16, fontWeight:700, color:'var(--gold)' }}>{members.filter(m=>m.class_no===c).length}</div>
                <div style={{ fontSize:10, color:'var(--text-dim)' }}>{c}반</div>
              </div>
            ))}
            {/* 별세 탭 */}
            <div style={{ textAlign:'center', padding:'8px 4px', borderRadius:8, background:'#22203044' }}>
              <div style={{ fontSize:16, fontWeight:700, color:'#776' }}>{deceased.length}</div>
              <div style={{ fontSize:10, color:'#776' }}>🕯 별세</div>
            </div>
          </div>
        </div>

        {/* 전체 동기 - 우하단 작게 */}
        <div style={{ textAlign:'right', marginTop:8, marginBottom:16 }}>
          <span style={{ fontSize:12, color:'var(--text-dim)' }}>전체 동기 {members.length}명</span>
        </div>

        {isAdmin && <div style={{ marginBottom:16 }}><button onClick={onBackup} style={{ ...btn('outline'), width:'100%' }}>💾 백업</button></div>}
      </div>
    </div>
  )
}

// ── 회원 목록 (독립 컴포넌트 - 검색 state 내부 보유) ─────────────────────────
function MembersPage({ members, onSelect }: { members:Member[], onSelect:(m:Member)=>void }) {
  const [q, setQ] = useState('')
  const [fc, setFc] = useState('all')
  const [vm, setVm] = useState<'all'|'class'>('all')

  const filtered = members.filter(m => {
    const sq = q.toLowerCase()
    const matchQ = !sq || m.name.includes(sq) || (m.company||'').includes(sq) || String(m.class_no).includes(sq)
    const matchC = fc==='all' ? true : fc==='deceased' ? m.is_deceased : m.class_no===Number(fc)
    return matchQ && matchC
  })
  const alive = fc==='deceased' ? [] : filtered.filter(m => !m.is_deceased)
  const dead  = filtered.filter(m => m.is_deceased)

  return (
    <div style={{ paddingBottom:100 }}>
      <div style={hdr}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ fontSize:18, fontWeight:700, color:'#fff', fontFamily:'var(--font-serif)' }}>동기 명부</div>
          <button onClick={()=>setVm(v=>v==='all'?'class':'all')} style={{ ...btn('outline'), fontSize:12 }}>{vm==='all'?'반별보기':'전체보기'}</button>
        </div>
        <input type="text" value={q} onChange={e=>setQ(e.target.value)} placeholder="이름 · 반 · 직장 검색" style={{ ...inp, marginBottom:10 }} autoComplete="off" />
        <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:2 }}>
          {['all','1','2','3','4','5','6','7','8','deceased'].map(c => (
            <button key={c} onClick={()=>setFc(c)} style={{ ...btn(fc===c?'gold':'outline'), padding:'4px 12px', fontSize:12, whiteSpace:'nowrap', flexShrink:0 }}>
              {c==='all'?'전체':c==='deceased'?'🕯 별세':`${c}반`}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding:'16px 20px 0' }}>
        {fc==='deceased' ? (
          <>
            <div style={{ fontSize:12, color:'#776', marginBottom:10 }}>🕯 별세하신 동기 {dead.length}명</div>
            {dead.map(m => <MCard key={m.id} m={m} onSelect={onSelect} deceased />)}
          </>
        ) : vm==='all' ? (
          <>
            <div style={{ fontSize:12, color:'var(--text-dim)', marginBottom:10 }}>{alive.length}명</div>
            {alive.map(m => <MCard key={m.id} m={m} onSelect={onSelect} />)}
          </>
        ) : (
          [1,2,3,4,5,6,7,8].map(c => {
            const cm = alive.filter(m=>m.class_no===c)
            if (!cm.length) return null
            return <div key={c} style={{ marginBottom:24 }}>
              <div style={{ fontSize:13, color:'var(--gold)', letterSpacing:2, marginBottom:8, display:'flex', alignItems:'center', gap:8 }}>
                <span>{c}반</span><span style={{ background:'var(--navy-bg)', borderRadius:10, padding:'1px 8px', fontSize:11 }}>{cm.length}명</span>
              </div>
              {cm.map(m=><MCard key={m.id} m={m} onSelect={onSelect} />)}
            </div>
          })
        )}
      </div>
    </div>
  )
}

function MCard({ m, onSelect, deceased }: { m:Member, onSelect:(m:Member)=>void, deceased?:boolean }) {
  return (
    <div style={{ ...card, display:'flex', alignItems:'center', gap:14, cursor:'pointer', opacity:deceased?0.6:1 }} onClick={()=>onSelect(m)}>
      <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--navy-bg)', border:`2px solid ${deceased?'#554':'var(--navy-dim)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'var(--gold)', flexShrink:0, overflow:'hidden' }}>
        {m.photo_url?<img src={m.photo_url} alt={m.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />:m.name[0]}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:15 }}>{m.name} {deceased&&<span style={{ fontSize:11, color:'#776' }}>✝</span>}</div>
        <div style={{ fontSize:12, color:'var(--text-dim)', marginTop:2 }}>{m.class_no>0?`${m.class_no}반`:''} {m.company?`· ${m.company}`:''}</div>
      </div>
      <div style={{ fontSize:20, color:'#445' }}>›</div>
    </div>
  )
}

// ── 회원 상세 ─────────────────────────────────────────────────────────────────
function MemberDetailPage({ m, isAdmin, onBack, onEdit }: { m:Member, isAdmin:boolean, onBack:()=>void, onEdit:(m:Member)=>void }) {
  return (
    <div style={{ paddingBottom:100 }}>
      <div style={hdr}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack} style={{ ...btn('outline'), padding:'6px 12px' }}>←</button>
          <div style={{ fontSize:18, fontWeight:700, color:'#fff', fontFamily:'var(--font-serif)' }}>{m.name}</div>
        </div>
      </div>
      <div style={{ padding:20 }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ width:100, height:100, borderRadius:'50%', margin:'0 auto', background:'var(--navy-bg)', border:'3px solid var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, fontWeight:700, color:'var(--gold)', overflow:'hidden' }}>
            {m.photo_url?<img src={m.photo_url} alt={m.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />:m.name[0]}
          </div>
          <div style={{ fontSize:24, fontWeight:900, marginTop:10 }}>{m.name}</div>
          <div style={{ fontSize:14, color:'var(--gold)', marginTop:4 }}>중앙고 62회 {m.class_no>0?`${m.class_no}반`:''}{m.is_deceased&&<span style={{ marginLeft:8, fontSize:12, color:'#776' }}>✝ 별세</span>}</div>
        </div>
        {([
          { label:'휴대폰', value:m.mobile,     href:`tel:${m.mobile}` },
          { label:'이메일', value:m.email,      href:`mailto:${m.email}` },
          { label:'직장',   value:m.company },
          { label:'집전화', value:m.home_phone, href:`tel:${m.home_phone}` },
          { label:'주소',   value:m.address },
        ] as {label:string,value?:string,href?:string}[]).filter(f=>f.value).map(({ label:l, value, href }) => (
          <div key={l} style={{ ...card, display:'flex', gap:12 }}>
            <div style={{ fontSize:12, color:'var(--gold)', width:60, flexShrink:0, paddingTop:1 }}>{l}</div>
            {href?<a href={href} style={{ color:'var(--text)', fontSize:14 }}>{value}</a>:<div style={{ fontSize:14 }}>{value}</div>}
          </div>
        ))}
        {isAdmin && <button onClick={()=>onEdit(m)} style={{ ...btn(), width:'100%', padding:12, marginTop:16 }}>✏️ 정보 수정</button>}
      </div>
    </div>
  )
}

// ── 회원 편집 모달 ────────────────────────────────────────────────────────────
function MemberEditModal({ member, onSave, onClose }: { member:Partial<Member>, onSave:(m:Partial<Member>)=>Promise<void>, onClose:()=>void }) {
  const [form, setForm] = useState<Partial<Member>>({ ...member })
  const [saving, setSaving] = useState(false)
  const set = (k: keyof Member, v: any) => setForm(p=>({...p,[k]:v}))
  const save = async () => { if(!form.name) return; setSaving(true); try{ await onSave(form) }finally{ setSaving(false) } }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:500, overflowY:'auto' }}>
      <div style={{ background:'var(--surface)', minHeight:'100vh', maxWidth:480, margin:'0 auto', padding:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontSize:18, fontWeight:700, color:'var(--gold)' }}>회원 정보 수정</div>
          <button onClick={onClose} style={{ ...btn('outline'), padding:'6px 12px' }}>취소</button>
        </div>
        <div style={{ ...card, marginBottom:16 }}>
          <div style={{ fontSize:13, color:'var(--text-dim)' }}>이름: <strong style={{ color:'#fff' }}>{form.name}</strong></div>
          <div style={{ fontSize:13, color:'var(--text-dim)', marginTop:4 }}>반: <strong style={{ color:'#fff' }}>{form.class_no&&form.class_no>0?`${form.class_no}반`:'미상'}</strong></div>
          <div style={{ fontSize:11, color:'#665', marginTop:6 }}>※ 이름과 반은 수정할 수 없습니다</div>
        </div>
        {([{k:'email' as keyof Member,label:'이메일'},{k:'mobile' as keyof Member,label:'휴대폰'},{k:'company' as keyof Member,label:'직장'},{k:'home_phone' as keyof Member,label:'집전화'},{k:'address' as keyof Member,label:'주소'}]).map(({k,label:l})=>(
          <div key={k} style={fw}><label style={lbl}>{l}</label><input value={String(form[k]??'')} onChange={e=>set(k,e.target.value)} style={inp} /></div>
        ))}
        <div style={fw}>
          <label style={lbl}>생존 여부</label>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>set('is_deceased',false)} style={{ ...btn(!form.is_deceased?'gold':'outline'), flex:1 }}>생존</button>
            <button onClick={()=>set('is_deceased',true)}  style={{ ...btn(form.is_deceased?'red':'outline'),  flex:1 }}>별세</button>
          </div>
        </div>
        <div style={fw}><label style={lbl}>프로필 사진</label><ImageUpload bucket="member-photos" currentUrl={form.photo_url} onUpload={url=>set('photo_url',url)} shape="circle" /></div>
        <button onClick={save} disabled={saving} style={{ ...btn(), width:'100%', padding:14, fontSize:16, opacity:saving?0.7:1 }}>{saving?'저장 중...':'저장'}</button>
      </div>
    </div>
  )
}

// ── 앨범 페이지 ───────────────────────────────────────────────────────────────
function AlbumPage({ albums, isAdmin, onSelect, onAdd }: { albums:Album[], isAdmin:boolean, onSelect:(a:Album)=>void, onAdd:(cat:string)=>void }) {
  const [fc, setFc] = useState('all')
  const displayCats = fc==='all' ? ALBUM_CATS : [fc as typeof ALBUM_CATS[number]]
  return (
    <div style={{ paddingBottom:100 }}>
      <div style={hdr}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:18, fontWeight:700, color:'#fff', fontFamily:'var(--font-serif)' }}>앨범</div>
          {isAdmin && <button onClick={()=>onAdd('basic')} style={{ ...btn(), fontSize:12 }}>+ 앨범 추가</button>}
        </div>
        <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
          <button onClick={()=>setFc('all')} style={{ ...btn(fc==='all'?'gold':'outline'), padding:'4px 12px', fontSize:11, whiteSpace:'nowrap', flexShrink:0 }}>전체</button>
          {ALBUM_CATS.map(c=><button key={c} onClick={()=>setFc(c)} style={{ ...btn(fc===c?'gold':'outline'), padding:'4px 10px', fontSize:11, whiteSpace:'nowrap', flexShrink:0 }}>{CAT[c]}</button>)}
        </div>
      </div>
      <div style={{ padding:'16px 20px 0' }}>
        {displayCats.map(cat => {
          const ca = albums.filter(a=>a.category===cat)
          if (!ca.length && !isAdmin) return null
          return (
            <div key={cat} style={{ marginBottom:20 }}>
              <div style={{ fontSize:13, color:'var(--gold)', letterSpacing:1, marginBottom:10 }}>{CAT[cat]}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {ca.map(a=>(
                  <div key={a.id} onClick={()=>onSelect(a)} style={{ ...card, marginBottom:0, cursor:'pointer', padding:0, overflow:'hidden' }}>
                    <div style={{ height:100, background:'var(--navy-bg)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                      {a.cover_url?<img src={a.cover_url} alt={a.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />:<span style={{ fontSize:32 }}>{CAT[cat].split(' ')[0]}</span>}
                    </div>
                    <div style={{ padding:'10px 12px' }}><div style={{ fontSize:13, fontWeight:600 }}>{a.title}</div><div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>{(a.photos||[]).length}장</div></div>
                  </div>
                ))}
                {!ca.length && isAdmin && <div onClick={()=>onAdd(cat)} style={{ ...card, marginBottom:0, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', height:80, border:'1px dashed var(--navy-dim)', color:'var(--text-dim)', fontSize:13 }}>+ 앨범 추가</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 앨범 상세 ─────────────────────────────────────────────────────────────────
function AlbumDetailPage({ album, isAdmin, onBack, onEdit, onLightbox, onDeletePhoto }: { album:Album, isAdmin:boolean, onBack:()=>void, onEdit:()=>void, onLightbox:(url:string)=>void, onDeletePhoto:(id:number)=>Promise<void> }) {
  return (
    <div style={{ paddingBottom:100 }}>
      <div style={hdr}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack} style={{ ...btn('outline'), padding:'6px 12px' }}>←</button>
          <div style={{ fontSize:18, fontWeight:700, color:'#fff' }}>{album.title}</div>
        </div>
      </div>
      <div style={{ padding:16 }}>
        {isAdmin && <button onClick={onEdit} style={{ ...btn('outline'), width:'100%', marginBottom:12, fontSize:12 }}>📷 사진 추가</button>}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4 }}>
          {(album.photos||[]).map(p=>(
            <div key={p.id} style={{ position:'relative', aspectRatio:'1', background:'var(--navy-bg)', borderRadius:6, overflow:'hidden' }}>
              <img src={p.url} alt="" loading="lazy" onClick={()=>onLightbox(p.url)} style={{ width:'100%', height:'100%', objectFit:'cover', cursor:'pointer', display:'block' }} />
              {isAdmin && <button onClick={async e=>{e.stopPropagation();if(!confirm('이 사진을 삭제하시겠습니까?'))return;await onDeletePhoto(p.id)}} style={{ position:'absolute', top:4, right:4, background:'rgba(192,57,43,0.85)', border:'none', borderRadius:'50%', width:24, height:24, color:'#fff', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>}
            </div>
          ))}
        </div>
        {!(album.photos||[]).length && <div style={{ textAlign:'center', color:'#445', padding:40 }}>사진이 없습니다</div>}
      </div>
    </div>
  )
}

// ── 동기회행사 ────────────────────────────────────────────────────────────────
function YearendPage({ albums, isAdmin, onSelect, onAdd }: { albums:Album[], isAdmin:boolean, onSelect:(a:Album)=>void, onAdd:()=>void }) {
  const ya = albums.filter(a=>a.category==='yearend').sort((a,b)=>(b.year||0)-(a.year||0))
  return (
    <div style={{ paddingBottom:100 }}>
      <div style={hdr}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:18, fontWeight:700, color:'#fff', fontFamily:'var(--font-serif)' }}>동기회행사</div>
          {isAdmin && <button onClick={onAdd} style={{ ...btn(), fontSize:12 }}>+ 추가</button>}
        </div>
      </div>
      <div style={{ padding:'16px 20px 0' }}>
        {ya.map(a=>(
          <div key={a.id} style={{ ...card, cursor:'pointer' }} onClick={()=>onSelect(a)}>
            <div style={{ display:'flex', gap:14, alignItems:'center' }}>
              <div style={{ width:70, height:70, borderRadius:10, overflow:'hidden', flexShrink:0, background:'var(--navy-bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {a.cover_url?<img src={a.cover_url} alt={a.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />:<span style={{ fontSize:28 }}>🎉</span>}
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:700 }}>{a.year}년 행사</div>
                <div style={{ fontSize:13, color:'var(--gold)', marginTop:2 }}>{a.title}</div>
                <div style={{ fontSize:12, color:'var(--text-dim)', marginTop:4 }}>{(a.photos||[]).length}장</div>
              </div>
            </div>
          </div>
        ))}
        {!ya.length && <div style={{ textAlign:'center', color:'#445', padding:40 }}>행사 사진이 없습니다</div>}
      </div>
    </div>
  )
}

// ── 앨범 편집 모달 ────────────────────────────────────────────────────────────
function AlbumEditModal({ album, onSave, onClose }: { album:Partial<Album>, onSave:(f:Partial<Album>,photos:string[])=>Promise<void>, onClose:()=>void }) {
  const [form, setForm] = useState<Partial<Album>>({ ...album })
  const [newPhotos, setNewPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const setF = (k: keyof Album, v: any) => setForm(p=>({...p,[k]:v}))

  const handleFiles = async (files: FileList) => {
    setUploading(true)
    const uploaded: string[] = []
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('album-photos').upload(fileName, file)
      if (!error) { const { data } = supabase.storage.from('album-photos').getPublicUrl(fileName); uploaded.push(data.publicUrl) }
    }
    setNewPhotos(p=>[...p,...uploaded]); setUploading(false)
  }

  const save = async () => { if(!form.title) return; setSaving(true); try{ await onSave(form,newPhotos) }finally{ setSaving(false) } }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:500, overflowY:'auto' }}>
      <div style={{ background:'var(--surface)', minHeight:'100vh', maxWidth:480, margin:'0 auto', padding:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontSize:18, fontWeight:700, color:'var(--gold)' }}>{form.id?'앨범 수정':'앨범 추가'}</div>
          <button onClick={onClose} style={{ ...btn('outline'), padding:'6px 12px' }}>취소</button>
        </div>
        <div style={fw}>
          <label style={lbl}>카테고리</label>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {([...ALBUM_CATS,'yearend'] as const).map(c=><button key={c} onClick={()=>setF('category',c)} style={{ ...btn(form.category===c?'gold':'outline'), padding:'5px 10px', fontSize:11 }}>{CAT[c]}</button>)}
          </div>
        </div>
        {form.category==='yearend' && <div style={fw}><label style={lbl}>연도</label><input type="number" value={form.year||''} onChange={e=>setF('year',Number(e.target.value))} style={inp} /></div>}
        <div style={fw}><label style={lbl}>앨범 제목</label><input value={form.title||''} onChange={e=>setF('title',e.target.value)} style={inp} /></div>
        <div style={fw}>
          <label style={lbl}>사진 추가</label>
          {newPhotos.length>0 && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:10 }}>
              {newPhotos.map((url,i)=>(
                <div key={i} style={{ position:'relative' }}>
                  <img src={url} alt="" style={{ width:'100%', aspectRatio:'1', objectFit:'cover', borderRadius:8 }} />
                  <button onClick={()=>setNewPhotos(p=>p.filter((_,j)=>j!==i))} style={{ position:'absolute', top:4, right:4, background:'#c0392b', border:'none', borderRadius:'50%', width:22, height:22, color:'#fff', fontSize:12, cursor:'pointer' }}>✕</button>
                </div>
              ))}
            </div>
          )}
          <label style={{ ...btn('outline'), display:'block', textAlign:'center', padding:12, cursor:'pointer' }}>
            {uploading?'업로드 중...':'📷 사진 선택 (여러 장)'}
            <input type="file" accept="image/*" multiple style={{ display:'none' }} onChange={e=>{if(e.target.files?.length)handleFiles(e.target.files)}} />
          </label>
        </div>
        <button onClick={save} disabled={saving} style={{ ...btn(), width:'100%', padding:14, fontSize:16, opacity:saving?0.7:1 }}>{saving?'저장 중...':'저장'}</button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ── 메인 AppClient ────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export default function AppClient() {
  const [phase, setPhase] = useState<'splash'|'pin'|'app'>('splash')
  const [page, setPage]   = useState('home')
  const [isAdmin, setIsAdmin] = useState(false)
  const [pinModal, setPinModal] = useState<{type:any,title:string,onSuccess:()=>void}|null>(null)

  const [members, setMembers] = useState<Member[]>([])
  const [albums,  setAlbums]  = useState<Album[]>([])
  const [loading, setLoading] = useState(false)

  const [selMember, setSelMember] = useState<Member|null>(null)
  const [selAlbum,  setSelAlbum]  = useState<Album|null>(null)
  const [lightbox,  setLightbox]  = useState<string|null>(null)

  const [editMember, setEditMember] = useState<Partial<Member>|null>(null)
  const [editAlbum,  setEditAlbum]  = useState<Partial<Album>|null>(null)

  // ── 데이터 로드 ──────────────────────────────────────────────────────────
  const loadMembers = useCallback(async () => {
    const { data } = await supabase.from('62-members').select('*').order('name')
    if (data) setMembers(data)
  }, [])

  const loadAlbums = useCallback(async () => {
    const { data } = await supabase.from('62-albums').select('*, "62-photos"(*)').order('category').order('year', { ascending: false })
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
  const nav = (p: string) => { setPage(p); setSelMember(null); setSelAlbum(null) }

  const doBackup = () => {
    const data = JSON.stringify({ members, albums }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `중앙62_백업_${new Date().toISOString().slice(0,10)}.json`; a.click()
  }

  const saveMember = async (form: Partial<Member>) => {
    if (!form.id) return
    const { data } = await supabase.from('62-members')
      .update({ email:form.email, mobile:form.mobile, company:form.company, home_phone:form.home_phone, address:form.address, is_deceased:form.is_deceased, photo_url:form.photo_url })
      .eq('id', form.id).select().single()
    if (data) setSelMember(data)
    await loadMembers()
    setEditMember(null)
  }

  const saveAlbum = async (form: Partial<Album>, newPhotos: string[]) => {
    let albumId = form.id
    if (albumId) {
      await supabase.from('62-albums').update({ title:form.title, category:form.category, year:form.year, cover_url:form.cover_url }).eq('id', albumId)
    } else {
      const { data } = await supabase.from('62-albums').insert({ title:form.title, category:form.category, year:form.year }).select().single()
      albumId = data?.id
    }
    if (albumId && newPhotos.length) await supabase.from('62-photos').insert(newPhotos.map(url=>({ album_id:albumId, url })))
    await loadAlbums()
    setEditAlbum(null)
    if (albumId && selAlbum?.id === albumId) {
      const { data } = await supabase.from('62-albums').select('*, "62-photos"(*)').eq('id', albumId).single()
      if (data) setSelAlbum({ ...data, photos: data['62-photos'] || [] })
    }
  }

  const deletePhoto = async (photoId: number) => {
    await supabase.from('62-photos').delete().eq('id', photoId)
    await loadAlbums()
    if (selAlbum) {
      const updated = albums.find(a => a.id === selAlbum.id)
      if (updated) setSelAlbum({ ...updated, photos: (updated.photos||[]).filter(p => p.id !== photoId) })
    }
  }

  const activeNav = page==='memberDetail' ? 'members'
    : page==='albumDetail' ? (selAlbum?.category==='yearend' ? 'yearend' : 'album')
    : page

  if (phase === 'splash') return <Splash onDone={() => setPhase('pin')} />
  if (phase === 'pin') return (
    <div style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
      <img src="/building.png" alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(8,13,26,0.15) 0%, rgba(8,13,26,0.30) 100%)' }} />
      <div style={{ position:'relative' }}>
        <PinModal type="entry" title="중앙고 62회" onSuccess={() => setPhase('app')} onCancel={() => {}} />
      </div>
    </div>
  )

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', paddingBottom:70 }}>
      {loading && <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480, height:2, background:'linear-gradient(90deg, var(--bg), var(--gold), var(--bg))', zIndex:9999 }} />}

      {page==='home'         && <HomePage       members={members} albums={albums} isAdmin={isAdmin} onNav={nav} onAdmin={()=>requirePin('admin','관리자 비밀번호',()=>setIsAdmin(true))} onBackup={doBackup} />}
      {page==='members'      && <MembersPage    members={members} onSelect={m=>{setSelMember(m);setPage('memberDetail')}} />}
      {page==='memberDetail' && selMember       && <MemberDetailPage m={selMember} isAdmin={isAdmin} onBack={()=>nav('members')} onEdit={m=>setEditMember({...m})} />}
      {page==='album'        && <AlbumPage      albums={albums} isAdmin={isAdmin} onSelect={a=>{setSelAlbum(a);setPage('albumDetail')}} onAdd={cat=>setEditAlbum({category:cat as any,title:''})} />}
      {page==='albumDetail'  && selAlbum        && <AlbumDetailPage album={selAlbum} isAdmin={isAdmin} onBack={()=>nav(selAlbum.category==='yearend'?'yearend':'album')} onEdit={()=>setEditAlbum({...selAlbum})} onLightbox={setLightbox} onDeletePhoto={deletePhoto} />}
      {page==='yearend'      && <YearendPage    albums={albums} isAdmin={isAdmin} onSelect={a=>{setSelAlbum(a);setPage('albumDetail')}} onAdd={()=>setEditAlbum({category:'yearend',title:'',year:new Date().getFullYear()})} />}

      {editMember && <MemberEditModal member={editMember} onSave={saveMember} onClose={()=>setEditMember(null)} />}
      {editAlbum  && <AlbumEditModal  album={editAlbum}   onSave={saveAlbum}  onClose={()=>setEditAlbum(null)} />}
      {pinModal   && <PinModal type={pinModal.type} title={pinModal.title} onSuccess={pinModal.onSuccess} onCancel={()=>setPinModal(null)} />}

      {lightbox && (
        <div style={{ position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.97)', zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={()=>setLightbox(null)}>
          <img
            src={lightbox}
            alt="사진"
            draggable={false}
            onContextMenu={e=>e.preventDefault()}
            style={{ maxWidth:'100vw', maxHeight:'100vh', objectFit:'contain', display:'block' }}
            onClick={e=>e.stopPropagation()}
          />
          <button onClick={e=>{e.stopPropagation();setLightbox(null)}}
            style={{ position:'fixed', top:20, right:20, background:'rgba(0,0,0,0.6)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'50%', width:44, height:44, color:'#fff', fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
      )}

      <BottomNav current={activeNav} onChange={nav} />
    </div>
  )
}
