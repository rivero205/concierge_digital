// services/scraper/src/zones.ts
import type { Zone } from './types.js'

export const ZONES: Zone[] = [
  { name: 'Ciudad Amurallada', lat: 10.4236,  lng: -75.5516, radius: 1500 },
  { name: 'Getsemaní',         lat: 10.4232,  lng: -75.5451, radius: 800  },
  { name: 'San Diego',          lat: 10.4268,  lng: -75.5487, radius: 600  },
  { name: 'Bocagrande',         lat: 10.3960,  lng: -75.5550, radius: 2000 },
  { name: 'El Laguito',         lat: 10.3892,  lng: -75.5610, radius: 1000 },
  { name: 'Manga',              lat: 10.4090,  lng: -75.5380, radius: 1500 },
  { name: 'Castillogrande',     lat: 10.3950,  lng: -75.5480, radius: 1000 },
]
