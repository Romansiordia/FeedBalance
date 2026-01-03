
import type { ElementType } from 'react';
import { PiggyBank, Bird, Drumstick, Dog } from 'lucide-react';
import type { AnimalType } from './types';

export const animalIcons: Record<AnimalType, ElementType> = {
  pigs: PiggyBank,
  "laying hens": Bird,
  broilers: Drumstick,
  pets: Dog,
};