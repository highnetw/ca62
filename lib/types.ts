export interface Member {
  id: number
  name: string
  class_no: number        // 반 (1~8)
  email: string
  is_deceased: boolean    // 별세여부
  mobile: string
  company: string
  home_phone: string
  address: string
  photo_url: string
  updated_at?: string
  created_at?: string
}

export interface Album {
  id: number
  category: 'teacher' | 'event' | 'class' | 'yearend'
  class_no?: number
  year?: number
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