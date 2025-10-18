import type { Station } from './types';
import { Sprout, Recycle, Trash2, Droplets, Building, RefreshCw, Store, Puzzle, Search, LucideIcon, Star, Coins, TreeDeciduous, PawPrint, Diamond, Heart } from 'lucide-react';

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
