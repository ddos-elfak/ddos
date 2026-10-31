// Sadržaj sajta. Uputstva i primeri za dodavanje nalaze se u README.md.
export interface NewsItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  summary: string;
  paragraphs: string[];
}
export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD, lokalni datum u Srbiji
  time?: string; // HH:mm
  location: string;
  description: string;
}
export interface GalleryImage {
  src: string; // Putanja od public/, npr. /galerija/okupljanje.webp
  alt: string;
  caption: string;
  width: number;
  height: number;
}
export interface GalleryAlbum {
  id: string;
  title: string;
  date: string;
  description: string;
  photos: GalleryImage[];
}
export const news: NewsItem[] = [];
export const events: CalendarEvent[] = [];
export const gallery: GalleryAlbum[] = [];
