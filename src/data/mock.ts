// src/data/mock.ts

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'zh', label: '中文' },
  { code: 'ar', label: 'العربية' },
  { code: 'ja', label: '日本語' },
]

export const TITLES = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Sir', 'Lady', '—']

export const HOTELS_BY_CITY: Record<string, string[]> = {
  CDMX: [
    'Four Seasons Hotel México D.F.',
    'Las Alcobas Luxury Collection',
    'St. Regis Mexico City',
    'Sofitel Mexico City Reforma',
    'Camino Real Polanco',
  ],
  Guadalajara: [
    'Hotel Demetria',
    'Casa Habita',
    'Riu Plaza Guadalajara',
    'Quinta Real Guadalajara',
  ],
  Monterrey: [
    'Live Aqua Urban Resort Monterrey',
    'Hotel Habita MTY',
    'Quinta Real Monterrey',
    'Safi Royal Luxury',
  ],
}

export const INTERESTS = [
  'Fine Dining',
  'Mezcal & Spirits',
  'Wellness & Spa',
  'Arte Contemporáneo',
  'Shopping Privado',
  'Arquitectura',
  'Música en Vivo',
  'Cigar Lounges',
]

export type Match = {
  id: string
  teams: string
  date: string
  stadium: string
  city: string
}

export const MATCHES: Match[] = [
  { id: 'm1', teams: 'México vs. Group A opener', date: '11 Jun · 6:00 PM', stadium: 'Estadio Azteca', city: 'CDMX' },
  { id: 'm2', teams: 'Argentina vs. Grupo B', date: '15 Jun · 5:00 PM', stadium: 'Estadio Azteca', city: 'CDMX' },
  { id: 'm3', teams: 'Brasil vs. Grupo C', date: '18 Jun · 3:00 PM', stadium: 'Estadio Azteca', city: 'CDMX' },
  { id: 'm4', teams: 'Semifinal', date: '9 Jul · 7:00 PM', stadium: 'Estadio Azteca', city: 'CDMX' },
  { id: 'm5', teams: 'USA vs. Grupo D', date: '12 Jun · 4:00 PM', stadium: 'Estadio Akron', city: 'Guadalajara' },
  { id: 'm6', teams: 'Alemania vs. Grupo E', date: '16 Jun · 6:00 PM', stadium: 'Estadio Akron', city: 'Guadalajara' },
  { id: 'm7', teams: 'España vs. Grupo F', date: '13 Jun · 5:00 PM', stadium: 'Estadio BBVA', city: 'Monterrey' },
  { id: 'm8', teams: 'Francia vs. Grupo G', date: '17 Jun · 7:00 PM', stadium: 'Estadio BBVA', city: 'Monterrey' },
]

export type Vehicle = {
  id: string
  level: string
  name: string
  capacity: string
  price: string
  desc: string
  img: string
}

export const VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    level: 'Nivel 1',
    name: 'Sedán Ejecutivo',
    capacity: 'Hasta 3 personas',
    price: '$45 USD',
    desc: 'Confort y discreción para traslados en ciudad',
    img: '/vehicles/sedan.jpg',
  },
  {
    id: 'v2',
    level: 'Nivel 2',
    name: 'SUV Premium',
    capacity: 'Hasta 5 personas',
    price: '$75 USD',
    desc: 'Espacio y elegancia para grupos pequeños',
    img: '/vehicles/suv.jpg',
  },
  {
    id: 'v3',
    level: 'Nivel 3',
    name: 'Van VIP',
    capacity: 'Hasta 8 personas',
    price: '$120 USD',
    desc: 'Experiencia grupal premium con amenidades a bordo',
    img: '/vehicles/van.jpg',
  },
]

export type Restaurant = {
  id: string
  name: string
  cuisine: string
  zone: string
  price: string
  desc: string
  img: string
  cities: string[]
}

export type DriverPackage = {
  id: string
  name: string
  hours: string
  price: string
  img: string
}

export const DRIVER_PACKAGES: DriverPackage[] = [
  {
    id: 'drv1',
    name: 'Medio Día',
    hours: '4 horas',
    price: '$120 USD',
    img: '/vehicles/driver-basico.jpg',
  },
  {
    id: 'drv2',
    name: 'Día Completo',
    hours: '8 horas',
    price: '$220 USD',
    img: '/vehicles/driver-completo.jpg',
  },
  {
    id: 'drv3',
    name: '24h VIP',
    hours: '24 horas',
    price: '$380 USD',
    img: '/vehicles/driver-vip.jpg',
  },
]

export const RESTAURANTS: Restaurant[] = [
  {
    id: 'r1',
    name: 'Pujol',
    cuisine: 'Alta cocina mexicana',
    zone: 'Polanco',
    price: '$$$$',
    desc: "Enrique Olvera's mole madre — reserva con anticipación",
    img: 'https://picsum.photos/seed/rcdmx1/600/400',
    cities: ['CDMX'],
  },
  {
    id: 'r2',
    name: 'Quintonil',
    cuisine: 'Mexicana contemporánea',
    zone: 'Polanco',
    price: '$$$$',
    desc: 'Top 30 mundial, cocina de temporada',
    img: 'https://picsum.photos/seed/rcdmx2/600/400',
    cities: ['CDMX'],
  },
  {
    id: 'r3',
    name: 'Contramar',
    cuisine: 'Mariscos',
    zone: 'Roma Norte',
    price: '$$$',
    desc: 'Tostadas de atún legendarias, perfecto para lunch',
    img: 'https://picsum.photos/seed/rcdmx3/600/400',
    cities: ['CDMX'],
  },
  {
    id: 'r4',
    name: 'El Cardenal',
    cuisine: 'Mexicano tradicional',
    zone: 'Centro Histórico',
    price: '$$',
    desc: 'Institución desde 1969, desayunos y comida tradicional',
    img: 'https://picsum.photos/seed/rcdmx4/600/400',
    cities: ['CDMX'],
  },
  {
    id: 'r5',
    name: 'Mercado Roma',
    cuisine: 'Mercado gourmet',
    zone: 'Roma',
    price: '$$',
    desc: 'La mejor experiencia de mercado en la ciudad',
    img: 'https://picsum.photos/seed/rcdmx5/600/400',
    cities: ['CDMX'],
  },
  {
    id: 'r6',
    name: 'Alcalde',
    cuisine: 'Mexicana moderna',
    zone: 'Americana',
    price: '$$$',
    desc: 'El mejor restaurante de Guadalajara, menú de temporada',
    img: 'https://picsum.photos/seed/rgdl1/600/400',
    cities: ['Guadalajara'],
  },
  {
    id: 'r7',
    name: 'La Chata',
    cuisine: 'Mexicano tradicional',
    zone: 'Centro',
    price: '$$',
    desc: 'Auténtica cocina jalisciense desde 1942',
    img: 'https://picsum.photos/seed/rgdl2/600/400',
    cities: ['Guadalajara'],
  },
  {
    id: 'r8',
    name: 'Birrería Las 9 Esquinas',
    cuisine: 'Birria',
    zone: 'Analco',
    price: '$',
    desc: 'La birria más famosa de Guadalajara',
    img: 'https://picsum.photos/seed/rgdl3/600/400',
    cities: ['Guadalajara'],
  },
  {
    id: 'r9',
    name: 'Pangea',
    cuisine: 'Mexicana contemporánea',
    zone: 'San Pedro',
    price: '$$$',
    desc: 'Referente gastronómico del norte de México',
    img: 'https://picsum.photos/seed/rmty1/600/400',
    cities: ['Monterrey'],
  },
  {
    id: 'r10',
    name: 'El Rey del Cabrito',
    cuisine: 'Cabrito asado',
    zone: 'Centro',
    price: '$$',
    desc: 'Icono regiomontano, especialidad en cabrito',
    img: 'https://picsum.photos/seed/rmty2/600/400',
    cities: ['Monterrey'],
  },
]
