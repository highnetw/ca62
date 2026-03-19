export interface Member {
  id: number
  name: string
  class_no: number
  email: string
  is_deceased: boolean
  mobile: string
  company: string
  home_phone: string
  address: string
  photo_url: string
  recent_photo_url: string
  updated_at?: string
  created_at?: string
}

export interface Album {
  id: number
  category: 'basic' | 'teacher' | 'class1' | 'class2' | 'class3' | 'class4' | 'class5' | 'class6' | 'class7' | 'class8' | 'event' | 'yearend'
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