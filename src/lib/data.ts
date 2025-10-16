import type { Station } from './types';
import { Sprout, Recycle, Trash2, Droplets, Building, RefreshCw, Store, Puzzle, Search } from 'lucide-react';

export const stations: Station[] = [
  { 
    id: 1, 
    title: 'Biodiversity', 
    description: 'Discover the variety of life around you.', 
    icon: Sprout 
  },
  { 
    id: 2, 
    title: 'Sustainability', 
    description: 'Learn to live in harmony with nature.', 
    icon: Recycle
  },
  { 
    id: 3, 
    title: 'Waste Management', 
    description: 'Reduce, reuse, and recycle.', 
    icon: Trash2 
  },
  { 
    id: 4, 
    title: 'Water Resources', 
    description: 'Protect our most precious resource.', 
    icon: Droplets 
  },
  { 
    id: 5, 
    title: 'Sustainable Design', 
    description: 'Build a greener future.', 
    icon: Building
  },
  { 
    id: 6, 
    title: 'Circular Economy', 
    description: 'Close the loop on consumption.', 
    icon: RefreshCw
  },
  { 
    id: 7, 
    title: 'Green Business', 
    description: 'Support eco-friendly enterprises.', 
    icon: Store
  },
  { 
    id: 8, 
    title: 'Crossword Challenge', 
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
