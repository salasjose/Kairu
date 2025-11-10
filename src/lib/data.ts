import type { Station } from './types';
import { Sprout, Recycle, Trash2, Droplets, Building, RefreshCw, Store, Puzzle, Search, LucideIcon } from 'lucide-react';

export const stations: Station[] = [
  { id: 1, title: 'Bionexus', description: 'Discover the variety of life around you.', icon: Sprout },
  { id: 2, title: 'ImpacTrack', description: 'Learn to live in harmony with nature.', icon: Recycle },
  { id: 3, title: 'ReNova', description: 'Reduce, reuse, and recycle.', icon: Trash2 },
  { id: 4, title: 'TerrAzul', description: 'Protect our most precious resource.', icon: Droplets },
  { id: 5, title: 'ZonaCreativa', description: 'Build a greener future.', icon: Building },
  { id: 6, title: 'ReGira', description: 'Close the loop on consumption.', icon: RefreshCw },
  { id: 7, title: 'VerdeLAb', description: 'Support eco-friendly enterprises.', icon: Store },
  { id: 8, title: 'Vitalia', description: 'Test your environmental knowledge.', icon: Puzzle },
  { id: 9, title: 'Tu Estación', description: 'Crea tu santuario de la naturaleza.', icon: Search },
];

export const countries = [
  { value: "CO", label: "Colombia" },
  { value: "MX", label: "Mexico" },
  { value: "AR", label: "Argentina" },
  { value: "PE", label: "Peru" },
  { value: "CL", label: "Chile" },
  { value: "EC", label: "Ecuador" },
  { value: "VE", label: "Venezuela" },
  { value: "GT", label: "Guatemala" },
  { value: "BO", label: "Bolivia" },
  { value: "ES", label: "Spain" },
  { value: "US", label: "United States" },
];

export type Prize = {
  id: string; // e.g., "station1-babosa"
  stationId: number;
  name: string;
  imageUrl: string;
};

// Each station has 9 unique prizes
export const allPrizes: Prize[][] = [
  // Station 1 Prizes
  [
    { id: 's1-1', stationId: 1, name: 'Babosa', imageUrl: '/prizes/Babosa.png' },
    { id: 's1-2', stationId: 1, name: 'Caracol', imageUrl: '/prizes/Caracol.png' },
    { id: 's1-3', stationId: 1, name: 'De Frente', imageUrl: '/prizes/De_frente.png' },
    { id: 's1-4', stationId: 1, name: 'Flamenco', imageUrl: '/prizes/Flamenco.png' },
    { id: 's1-5', stationId: 1, name: 'Garza Volando', imageUrl: '/prizes/Garza_volando_.png' },
    { id: 's1-6', stationId: 1, name: 'Gato', imageUrl: '/prizes/Gato.png' },
    { id: 's1-7', stationId: 1, name: 'Iguana', imageUrl: '/prizes/Iguana.png' },
    { id: 's1-8', stationId: 1, name: 'Pájaro', imageUrl: '/prizes/Pájaro_roca.png' },
    { id: 's1-9', stationId: 1, name: 'Perro', imageUrl: '/prizes/Perro.png' },
  ],
  // Station 2 Prizes
  [
<<<<<<< HEAD
    { id: 's2-1', stationId: 2, name: 'Edificio', imageUrl: '/prizes/Ilustración_sin_título_1.png' },
    { id: 's2-2', stationId: 2, name: 'Ilustración 2', imageUrl: '/prizes/Ilustración_sin_título_2.png' },
    { id: 's2-3', stationId: 2, name: 'Pescador', imageUrl: '/prizes/Ilustración_sin_título 3.png' },
=======
    { id: 's2-1', stationId: 2, name: 'Ilustración 1', imageUrl: '/prizes/Ilustración_sin_título_1.png' },
    { id: 's2-2', stationId: 2, name: 'Ilustración 2', imageUrl: '/prizes/Ilustración_sin_título_2.png' },
    { id: 's2-3', stationId: 2, name: 'Ilustración 3', imageUrl: '/prizes/Ilustración_sin_título 3.png' },
>>>>>>> 7d28fac (ajuste la estación 9  para que las insignias se puedan mover las insigni)
    { id: 's2-4', stationId: 2, name: 'Ilustración 4', imageUrl: '/prizes/Ilustración_sin_título 4.png' },
    { id: 's2-5', stationId: 2, name: 'Ilustración 5', imageUrl: '/prizes/Ilustración_sin_título 5.png' },
    { id: 's2-6', stationId: 2, name: 'Ilustración 6', imageUrl: '/prizes/Ilustración_sin_título 6.png' },
    { id: 's2-7', stationId: 2, name: 'Ilustración 7', imageUrl: '/prizes/Ilustración_sin_título_1.png' },
    { id: 's2-8', stationId: 2, name: 'Ilustración 8', imageUrl: '/prizes/Ilustración_sin_título_2.png' },
    { id: 's2-9', stationId: 2, name: 'Ilustración 9', imageUrl: '/prizes/Ilustración_sin_título.png' },
  ],
  // Station 3 Prizes
  [
    { id: 's3-1', stationId: 3, name: 'Babosa', imageUrl: '/prizes/Babosa.png' },
    { id: 's3-2', stationId: 3, name: 'Caracol', imageUrl: '/prizes/Caracol.png' },
    { id: 's3-3', stationId: 3, name: 'De Frente', imageUrl: '/prizes/De_frente.png' },
    { id: 's3-4', stationId: 3, name: 'Flamenco', imageUrl: '/prizes/Flamenco.png' },
    { id: 's3-5', stationId: 3, name: 'Garza Volando', imageUrl: '/prizes/Garza_volando_.png' },
    { id: 's3-6', stationId: 3, name: 'Gato', imageUrl: '/prizes/Gato.png' },
    { id: 's3-7', stationId: 3, name: 'Iguana', imageUrl: '/prizes/Iguana.png' },
    { id: 's3-8', stationId: 3, name: 'Pájaro Roca', imageUrl: '/prizes/Pájaro_roca.png' },
    { id: 's3-9', stationId: 3, name: 'Perro', imageUrl: '/prizes/Perro.png' },
  ],
  // Station 4 Prizes
   [
    { id: 's4-1', stationId: 4, name: 'Ilustración 1', imageUrl: '/prizes/Ilustración_sin_título_1.png' },
    { id: 's4-2', stationId: 4, name: 'Ilustración 2', imageUrl: '/prizes/Ilustración_sin_título_2.png' },
    { id: 's4-3', stationId: 4, name: 'Ilustración 3', imageUrl: '/prizes/Ilustración_sin_título 3.png' },
    { id: 's4-4', stationId: 4, name: 'Ilustración 4', imageUrl: '/prizes/Ilustración_sin_título 4.png' },
    { id: 's4-5', stationId: 4, name: 'Ilustración 5', imageUrl: '/prizes/Ilustración_sin_título 5.png' },
    { id: 's4-6', stationId: 4, name: 'Ilustración 6', imageUrl: '/prizes/Ilustración_sin_título 6.png' },
    { id: 's4-7', stationId: 4, name: 'Ilustración 7', imageUrl: '/prizes/Ilustración_sin_título_1.png' },
    { id: 's4-8', stationId: 4, name: 'Ilustración 8', imageUrl: '/prizes/Ilustración_sin_título_2.png' },
    { id: 's4-9', stationId: 4, name: 'Ilustración 9', imageUrl: '/prizes/Ilustración_sin_título.png' },
  ],
  // Station 5 Prizes
  [
    { id: 's5-1', stationId: 5, name: 'Babosa', imageUrl: '/prizes/Babosa.png' },
    { id: 's5-2', stationId: 5, name: 'Caracol', imageUrl: '/prizes/Caracol.png' },
    { id: 's5-3', stationId: 5, name: 'De Frente', imageUrl: '/prizes/De_frente.png' },
    { id: 's5-4', stationId: 5, name: 'Flamenco', imageUrl: '/prizes/Flamenco.png' },
    { id: 's5-5', stationId: 5, name: 'Garza Volando', imageUrl: '/prizes/Garza_volando_.png' },
    { id: 's5-6', stationId: 5, name: 'Gato', imageUrl: '/prizes/Gato.png' },
    { id: 's5-7', stationId: 5, name: 'Iguana', imageUrl: '/prizes/Iguana.png' },
    { id: 's5-8', stationId: 5, name: 'Pájaro Roca', imageUrl: '/prizes/Pájaro_roca.png' },
    { id: 's5-9', stationId: 5, name: 'Perro', imageUrl: '/prizes/Perro.png' },
  ],
  // Station 6 Prizes
  [
    { id: 's6-1', stationId: 6, name: 'Ilustración 1', imageUrl: '/prizes/Ilustración_sin_título_1.png' },
    { id: 's6-2', stationId: 6, name: 'Ilustración 2', imageUrl: '/prizes/Ilustración_sin_título_2.png' },
    { id: 's6-3', stationId: 6, name: 'Ilustración 3', imageUrl: '/prizes/Ilustración_sin_título 3.png' },
    { id: 's6-4', stationId: 6, name: 'Ilustración 4', imageUrl: '/prizes/Ilustración_sin_título 4.png' },
    { id: 's6-5', stationId: 6, name: 'Ilustración 5', imageUrl: '/prizes/Ilustración_sin_título 5.png' },
    { id: 's6-6', stationId: 6, name: 'Ilustración 6', imageUrl: '/prizes/Ilustración_sin_título 6.png' },
    { id: 's6-7', stationId: 6, name: 'Ilustración 7', imageUrl: '/prizes/Ilustración_sin_título_1.png' },
    { id: 's6-8', stationId: 6, name: 'Ilustración 8', imageUrl: '/prizes/Ilustración_sin_título_2.png' },
    { id: 's6-9', stationId: 6, name: 'Ilustración 9', imageUrl: '/prizes/Ilustración_sin_título.png' },
  ],
  // Station 7 Prizes
  [
    { id: 's7-1', stationId: 7, name: 'Babosa', imageUrl: '/prizes/Babosa.png' },
    { id: 's7-2', stationId: 7, name: 'Caracol', imageUrl: '/prizes/Caracol.png' },
    { id: 's7-3', stationId: 7, name: 'De Frente', imageUrl: '/prizes/De_frente.png' },
    { id: 's7-4', stationId: 7, name: 'Flamenco', imageUrl: '/prizes/Flamenco.png' },
    { id: 's7-5', stationId: 7, name: 'Garza Volando', imageUrl: '/prizes/Garza_volando_.png' },
    { id: 's7-6', stationId: 7, name: 'Gato', imageUrl: '/prizes/Gato.png' },
    { id: 's7-7', stationId: 7, name: 'Iguana', imageUrl: '/prizes/Iguana.png' },
    { id: 's7-8', stationId: 7, name: 'Pájaro Roca', imageUrl: '/prizes/Pájaro_roca.png' },
    { id: 's7-9', stationId: 7, name: 'Perro', imageUrl: '/prizes/Perro.png' },
  ],
  // Station 8 Prizes
  [
    { id: 's8-1', stationId: 8, name: 'Ilustración 1', imageUrl: '/prizes/Ilustración_sin_título_1.png' },
    { id: 's8-2', stationId: 8, name: 'Ilustración 2', imageUrl: '/prizes/Ilustración_sin_título_2.png' },
    { id: 's8-3', stationId: 8, name: 'Ilustración 3', imageUrl: '/prizes/Ilustración_sin_título 3.png' },
    { id: 's8-4', stationId: 8, name: 'Ilustración 4', imageUrl: '/prizes/Ilustración_sin_título 4.png' },
    { id: 's8-5', stationId: 8, name: 'Ilustración 5', imageUrl: '/prizes/Ilustración_sin_título 5.png' },
    { id: 's8-6', stationId: 8, name: 'Ilustración 6', imageUrl: '/prizes/Ilustración_sin_título 6.png' },
    { id: 's8-7', stationId: 8, name: 'Ilustración 7', imageUrl: '/prizes/Ilustración_sin_título_1.png' },
    { id: 's8-8', stationId: 8, name: 'Ilustración 8', imageUrl: '/prizes/Ilustración_sin_título_2.png' },
    { id: 's8-9', stationId: 8, name: 'Ilustración 9', imageUrl: '/prizes/Ilustración_sin_título.png' },
  ],
];


export type WasteCategory = 'recycle' | 'organic' | 'trash';

export interface WasteItem {
  id: number;
  name: string;
  category: WasteCategory;
  imageUrl: string;
}

export const wasteItemsData: WasteItem[] = [
  { id: 1, name: 'Botella plástica', category: 'recycle', imageUrl: '/waste/Botella_plastica.png' },
  { id: 2, name: 'Cáscara de banano', category: 'organic', imageUrl: '/waste/Cascara_de_banano.png' },
  { id: 3, name: 'Papel higiénico usado', category: 'trash', imageUrl: '/waste/Papel_higienico_usado.png' },
  { id: 4, name: 'Caja de cartón', category: 'recycle', imageUrl: '/waste/Caja_de_carton.png' },
  { id: 5, name: 'Restos de manzana', category: 'organic', imageUrl: '/waste/Restos_de_manzana.png' },
  { id: 6, name: 'Lata de refresco', category: 'recycle', imageUrl: '/waste/Lata_de_refresco.png' },
  { id: 7, name: 'Pañal desechable', category: 'trash', imageUrl: '/waste/Pañal_desechable.png' },
  { id: 8, name: 'Periódico', category: 'recycle', imageUrl: '/waste/Periodico.png' },
  { id: 9, name: 'Bolsa de papas fritas', category: 'trash', imageUrl: '/waste/Bolsa_de_papas_fritas.png' },
  { id: 10, name: 'Hojas de jardín', category: 'organic', imageUrl: '/waste/Hojas_de_jardin.png' },
  { id: 11, name: 'Botella de vidrio', category: 'recycle', imageUrl: '/waste/Botella_de_vidrio.png' },
  { id: 12, name: 'Cáscara de huevo', category: 'organic', imageUrl: '/waste/Cascara_de_huevo.png' },
  { id: 13, name: 'Envoltorio de dulce', category: 'trash', imageUrl: '/waste/Envoltorio_de_dulce.png' },
  { id: 14, name: 'Cuaderno viejo', category: 'recycle', imageUrl: '/waste/Cuaderno_viejo.png' },
  { id: 15, name: 'Restos de café', category: 'organic', imageUrl: '/waste/Restos_de_cafe.png' },
  { id: 16, name: 'Vaso de yogur', category: 'trash', imageUrl: '/waste/Vaso_de_yogur.png' },
  { id: 17, name: 'Lata de atún', category: 'recycle', imageUrl: '/waste/Lata_de_atun.png' },
  { id: 18, name: 'Servilleta usada', category: 'trash', imageUrl: '/waste/Servilleta_usada.png' },
  { id: 19, name: 'Cáscara de naranja', category: 'organic', imageUrl: '/waste/Cascara_de_naranja.png' },
  { id: 20, name: 'Envase de champú', category: 'recycle', imageUrl: '/waste/Envase_de_champu.png' },
];
