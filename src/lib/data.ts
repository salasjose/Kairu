import type { Station } from './types';
import { Sprout, Recycle, Trash2, Droplets, Building, RefreshCw, Store, Puzzle, Search, LucideIcon, Star, Coins, TreeDeciduous, PawPrint, Diamond, Heart } from 'lucide-react';
import { PlaceHolderImages } from './placeholder-images';


export const stations: Station[] = [
  { 
    id: 1, 
    title: 'Bionexus', 
    description: 'Discover the variety of life around you.', 
    icon: Sprout 
  },
  { 
    id: 2, 
    title: 'ImpacTrack', 
    description: 'Learn to live in harmony with nature.', 
    icon: Recycle
  },
  { 
    id: 3, 
    title: 'ReNova', 
    description: 'Reduce, reuse, and recycle.', 
    icon: Trash2 
  },
  { 
    id: 4, 
    title: 'TerrAzul', 
    description: 'Protect our most precious resource.', 
    icon: Droplets 
  },
  { 
    id: 5, 
    title: 'ZonaCreativa', 
    description: 'Build a greener future.', 
    icon: Building
  },
  { 
    id: 6, 
    title: 'ReGira', 
    description: 'Close the loop on consumption.', 
    icon: RefreshCw
  },
  { 
    id: 7, 
    title: 'VerdeLAb', 
    description: 'Support eco-friendly enterprises.', 
    icon: Store
  },
  { 
    id: 8, 
    title: 'Vitalia', 
    description: 'Test your environmental knowledge.', 
    icon: Puzzle
  },
  { 
    id: 9, 
    title: 'Final Puzzle', 
    description: 'The last step to becoming a guardian.', 
    icon: Search
  },
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
  id: number;
  name: string;
  icon: LucideIcon;
};

export const allPrizes: Prize[] = [
  { id: 1, name: "Estrella", icon: Star },
  { id: 2, name: "Moneda", icon: Coins },
  { id: 3, name: "Árbol", icon: TreeDeciduous },
  { id: 4, name: "Huella", icon: PawPrint },
  { id: 5, name: "Diamante", icon: Diamond },
  { id: 6, name: "Corazón", icon: Heart },
];

type WasteCategory = 'recycle' | 'organic' | 'trash';

export interface WasteItem {
  id: number;
  name: string;
  category: WasteCategory;
  imageUrl: string;
}

export const wasteItemsData: WasteItem[] = [
  { id: 1, name: 'Botella plástica', category: 'recycle', imageUrl: PlaceHolderImages.find(p => p.id === 'waste-plastic-bottle')?.imageUrl ?? '' },
  { id: 2, name: 'Cáscara de banano', category: 'organic', imageUrl: PlaceHolderImages.find(p => p.id === 'waste-banana-peel')?.imageUrl ?? '' },
  { id: 3, name: 'Papel higiénico usado', category: 'trash', imageUrl: PlaceHolderImages.find(p => p.id === 'waste-toilet-paper')?.imageUrl ?? '' },
  { id: 4, name: 'Caja de cartón', category: 'recycle', imageUrl: PlaceHolderImages.find(p => p.id === 'waste-cardboard-box')?.imageUrl ?? '' },
  { id: 5, name: 'Restos de manzana', category: 'organic', imageUrl: PlaceHolderImages.find(p => p.id === 'waste-apple-core')?.imageUrl ?? '' },
  { id: 6, name: 'Lata de refresco', category: 'recycle', imageUrl: PlaceHolderImages.find(p => p.id === 'waste-soda-can')?.imageUrl ?? '' },
  { id: 7, name: 'Pañal desechable', category: 'trash', imageUrl: PlaceHolderImages.find(p => p.id === 'waste-diaper')?.imageUrl ?? '' },
  { id: 8, name: 'Periódico', category: 'recycle', imageUrl: PlaceHolderImages.find(p => p.id === 'waste-newspaper')?.imageUrl ?? '' },
  { id: 9, name: 'Bolsa de papas fritas', category: 'trash', imageUrl: PlaceHolderImages.find(p => p.id === 'waste-chip-bag')?.imageUrl ?? '' },
  { id: 10, name: 'Hojas de jardín', category: 'organic', imageUrl: PlaceHolderImages.find(p => p.id === 'waste-garden-leaves')?.imageUrl ?? '' },
];
