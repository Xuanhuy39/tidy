import type { CategoryId, CategoryInfo } from './types';

export const CATEGORIES: Record<CategoryId, CategoryInfo> = {
  stationery: { name: 'Stationery', color: '#5b8def', icon: '✏️' },
  snacks: { name: 'Snacks', color: '#f08a3c', icon: '🍿' },
  electronics: { name: 'Electronics', color: '#7a6cf0', icon: '🎧' },
  fruit: { name: 'Fruit', color: '#e8524a', icon: '🍎' },
  drinks: { name: 'Drinks', color: '#2fb3c9', icon: '🥤' },
  tableware: { name: 'Tableware', color: '#8a9aa8', icon: '🍽️' },
  bakery: { name: 'Bakery', color: '#c98a3e', icon: '🥐' },
  clothes: { name: 'Clothes', color: '#e45b8f', icon: '👕' },
  toys: { name: 'Toys', color: '#f2b632', icon: '🧸' },
  books: { name: 'Books', color: '#3fa36b', icon: '📚' },
  sports: { name: 'Sports', color: '#e0703a', icon: '🏀' },
};
