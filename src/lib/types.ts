import type { LucideIcon } from 'lucide-react';

export type Station = {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
};

export type CrosswordData = {
  grid: string[][];
  across: { number: number; clue: string; answer: string }[];
  down: { number: number; clue: string; answer: string }[];
};

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // Stored as ISO string
  country: string;
  username: string; // email
  profileImageUrl: string;
}
