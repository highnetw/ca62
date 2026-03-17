export interface Member {
  id: number
  name: string
  class_no: number        // 반 (1~8)
  mobile: string
  company: string
  address: string
  photo_url: string
  is_alive: boolean       // 생존여부
  created_at?: string
  updated_at?: string
}

export interface Album {
  id: number
  category: 'teacher' | 'event' | 'class' | 'yearend'
  class_no?: number       // 반별 사진일 때
  year?: number           // 모임행사 연도
  title: string
  cover_url?: string
  created_at?: string
  photos?: AlbumPhoto[]
}

export interface AlbumPhoto {
  id: number
  album_id: number
  url: string
  caption?: string
  created_at?: string
}

export type PinType = 'entry' | 'admin'
