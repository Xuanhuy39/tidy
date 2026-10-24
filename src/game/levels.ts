import type { ItemDef, LevelDef } from './types';

type Row = [id: string, kind: string, cat: ItemDef['cat'], where: string, x: number, z: number, rot?: number, variant?: number];

/** `where` is a room surface name, or `on:<item id>` to rest on another item. */
function items(rows: Row[]): ItemDef[] {
  return rows.map(([id, kind, cat, where, x, z, rot, variant]) => {
    const def: ItemDef = { id, kind, cat, x, z, rot, variant };
    if (where.startsWith('on:')) def.on = where.slice(3);
    else def.surface = where;
    return def;
  });
}

const studyNook: LevelDef = {
  id: 'study',
  name: 'Study Nook',
  room: 'study',
  queue: ['snacks', 'stationery', 'electronics'],
  items: items([
    ['penCup', 'penCup', 'stationery', 'shelf', 7.3, 0.75, 0, 0],
    ['eraser', 'eraser', 'stationery', 'desk', 8.7, 1.4, 15],
    ['speaker', 'speaker', 'electronics', 'shelf', 9.35, 0.75],
    ['gamepad', 'gamepad', 'electronics', 'laptop', 5.2, 1.6, -8],
    ['mouse', 'mouse', 'electronics', 'desk', 7.3, 1.3, -15],
    ['notebook', 'notebook', 'stationery', 'desk', 3.4, 3.0, 75, 0],
    ['phone', 'phone', 'electronics', 'on:notebook', 3.6, 2.9, -20],
    ['pencil', 'pencil', 'stationery', 'on:notebook', 3.1, 3.2, 30],
    ['chips', 'chipsBag', 'snacks', 'desk', 8.3, 3.3, 10],
    ['ruler', 'ruler', 'stationery', 'on:chips', 8.3, 3.2, 35],
    ['popcorn', 'popcorn', 'snacks', 'desk', 10.0, 2.6],
    ['headphones', 'headphones', 'electronics', 'rug', 9.6, 6.4, 25],
    ['cookie', 'cookie', 'snacks', 'rug', 6.6, 6.6],
    ['setSquare', 'setSquare', 'stationery', 'on:cookie', 6.7, 6.7, 20],
    ['chocolate', 'chocolate', 'snacks', 'chair', 3.0, 6.1, 20],
    ['handheld', 'handheld', 'electronics', 'chair', 3.6, 7.1, -25],
    ['lollipop', 'lollipop', 'snacks', 'rug', 10.6, 7.9, 40],
  ]),
};

const cozyKitchen: LevelDef = {
  id: 'kitchen',
  name: 'Cozy Kitchen',
  room: 'kitchen',
  queue: ['tableware', 'bakery', 'fruit', 'drinks'],
  items: items([
    ['plate', 'plate', 'tableware', 'counter', 4.4, 1.7, 0, 0],
    ['apple', 'apple', 'fruit', 'on:plate', 4.1, 1.5],
    ['juice', 'juiceBox', 'drinks', 'on:plate', 4.75, 1.95, 20],
    ['bread', 'bread', 'bakery', 'counter', 6.3, 1.5, 15],
    ['pear', 'pear', 'fruit', 'on:bread', 6.3, 1.5],
    ['bowl', 'bowl', 'tableware', 'counter', 7.9, 1.8, 0, 1],
    ['orange', 'orange', 'fruit', 'on:bowl', 7.6, 1.55],
    ['lemon', 'lemon', 'fruit', 'on:bowl', 8.25, 2.15, 30],
    ['pan', 'pan', 'tableware', 'counter', 9.9, 1.5, -20],
    ['croissant', 'croissant', 'bakery', 'on:pan', 9.8, 1.5],
    ['soda', 'sodaCan', 'drinks', 'counter', 11.4, 2.4, 0, 0],
    ['mug', 'mug', 'tableware', 'shelf', 6.2, 0.7, -30, 0],
    ['strawberry', 'strawberry', 'fruit', 'on:mug', 6.15, 0.7, 20],
    ['milk', 'milkCarton', 'drinks', 'shelf', 7.6, 0.7, 10],
    ['donut', 'donut', 'bakery', 'table', 5.5, 5.6, 0, 0],
    ['fork', 'fork', 'tableware', 'table', 7.0, 5.5, 25],
    ['cupcake', 'cupcake', 'bakery', 'table', 8.9, 5.6, 0, 0],
    ['coffee', 'coffeeCup', 'drinks', 'table', 9.0, 7.5],
    ['spoon', 'spoon', 'tableware', 'table', 5.6, 7.4, -30],
    ['banana', 'banana', 'fruit', 'on:spoon', 5.7, 7.3, 10],
    ['water', 'waterBottle', 'drinks', 'floor', 10.9, 5.2],
    ['cake', 'cakeSlice', 'bakery', 'stool', 3.3, 6.6, 30],
  ]),
};

const messyBedroom: LevelDef = {
  id: 'bedroom',
  name: 'Messy Bedroom',
  room: 'bedroom',
  queue: ['clothes', 'books', 'toys', 'sports', 'electronics'],
  items: items([
    ['book1', 'book', 'books', 'bed', 1.6, 3.5, 10, 0],
    ['tablet', 'tablet', 'electronics', 'on:book1', 1.6, 3.5, -5],
    ['tshirt', 'tshirt', 'clothes', 'on:tablet', 1.7, 3.6, 20, 0],
    ['teddy', 'teddy', 'toys', 'bed', 1.5, 5.8, 30],
    ['sweater', 'sweater', 'clothes', 'bed', 4.0, 4.0, 80, 1],
    ['racket', 'racket', 'sports', 'on:sweater', 4.0, 4.0, 40],
    ['sock', 'sock', 'clothes', 'bed', 3.9, 6.0, 60, 0],
    ['phone', 'phone', 'electronics', 'bed', 2.7, 6.5, -30, 1],
    ['book2', 'book', 'books', 'nightstand', 6.1, 1.2, 5, 1],
    ['camera', 'camera', 'electronics', 'on:book2', 6.1, 1.25, 20],
    ['robot', 'robot', 'toys', 'shelf', 8.6, 0.8, 10],
    ['book3', 'book', 'books', 'shelf', 9.9, 0.8, 90, 2],
    ['cap', 'cap', 'clothes', 'on:book3', 9.9, 0.8, 30, 0],
    ['rubiks', 'rubiks', 'toys', 'shelf', 11.3, 0.9],
    ['skateboard', 'skateboard', 'sports', 'rug', 6.3, 7.4, 15],
    ['book4', 'book', 'books', 'on:skateboard', 6.0, 7.4, 30, 3],
    ['headphones', 'headphones', 'electronics', 'on:book4', 6.0, 7.4, -20, 1],
    ['sneaker', 'sneaker', 'clothes', 'rug', 9.6, 5.1, -30, 0],
    ['basketball', 'basketball', 'sports', 'rug', 10.4, 7.6],
    ['beanie', 'beanie', 'clothes', 'on:basketball', 10.4, 7.6, 0, 0],
    ['car', 'toyCar', 'toys', 'rug', 8.6, 8.9, 20, 0],
    ['book5', 'book', 'books', 'floor', 11.0, 9.3, -15, 4],
    ['duck', 'duck', 'toys', 'on:book5', 11.0, 9.3, -40],
    ['dumbbell', 'dumbbell', 'sports', 'floor', 3.8, 8.6, 70, 0],
    ['football', 'soccerBall', 'sports', 'floor', 11.0, 5.2],
    ['gamepad', 'gamepad', 'electronics', 'rug', 7.0, 5.3, 25, 1],
  ]),
};

const splashyBathroom: LevelDef = {
  id: 'bathroom',
  name: 'Splashy Bathroom',
  room: 'bathroom',
  queue: ['bath', 'grooming', 'clothes', 'toys', 'cleaning'],
  items: items([
    ['sponge', 'sponge', 'bath', 'tub', 1.8, 4.7, 10],
    ['boat', 'toyBoat', 'toys', 'on:sponge', 1.8, 4.7, 15, 0],
    ['duck', 'duck', 'toys', 'tub', 1.7, 2.1, 30],
    ['roll', 'toiletRoll', 'bath', 'tank', 4.75, 0.55],
    ['spray', 'sprayBottle', 'cleaning', 'tank', 5.75, 0.55, 20],
    ['towel', 'towel', 'bath', 'lid', 5.2, 1.75, 90, 0],
    ['gloves', 'gloves', 'cleaning', 'on:towel', 5.2, 1.75, 10, 0],
    ['shampoo', 'shampoo', 'bath', 'shelf', 4.5, 0.55, 0, 0],
    ['lotion', 'lotion', 'bath', 'shelf', 5.6, 0.55, 0, 0],
    ['soap', 'soap', 'bath', 'vanity', 10.9, 1.75, 15, 0],
    ['toothbrush', 'toothbrush', 'grooming', 'on:soap', 10.9, 1.75, 60, 0],
    ['toothpaste', 'toothpaste', 'grooming', 'vanity', 8.2, 1.75, 80],
    ['comb', 'comb', 'grooming', 'on:toothpaste', 8.2, 1.75, 100, 0],
    ['dryer', 'hairdryer', 'grooming', 'vanity', 10.9, 0.55, 0, 0],
    ['sock', 'sock', 'clothes', 'on:dryer', 10.95, 0.55, 30, 1],
    ['mirror', 'handMirror', 'grooming', 'mat', 7.9, 5.5, 10, 0],
    ['sweater', 'sweater', 'clothes', 'mat', 6.0, 6.4, 20, 2],
    ['bucket', 'bucket', 'cleaning', 'on:sweater', 6.0, 6.4, 0, 0],
    ['tshirt', 'tshirt', 'clothes', 'mat', 7.9, 7.3, -20, 1],
    ['teddy', 'teddy', 'toys', 'on:tshirt', 7.9, 7.3, 20],
    ['brush', 'hairbrush', 'grooming', 'mat', 5.0, 7.9, 30, 0],
    ['plunger', 'plunger', 'cleaning', 'floor', 7.1, 3.1],
    ['beanie', 'beanie', 'clothes', 'on:plunger', 7.1, 3.1, 0, 1],
    ['dustpan', 'dustpan', 'cleaning', 'floor', 10.3, 4.1, -25],
    ['sock2', 'sock', 'clothes', 'floor', 9.2, 5.6, 40, 2],
    ['cap', 'cap', 'clothes', 'floor', 2.6, 7.9, 30, 1],
    ['car', 'toyCar', 'toys', 'floor', 10.4, 7.8, -20, 1],
  ]),
};

const livingRoom: LevelDef = {
  id: 'living',
  name: 'Living Room',
  room: 'living',
  queue: ['books', 'snacks', 'plants', 'music', 'electronics'],
  items: items([
    ['guitar', 'guitar', 'music', 'sofa', 5.6, 2.2, 70],
    ['chips', 'chipsBag', 'snacks', 'on:guitar', 5.3, 2.2, -10, 1],
    ['book1', 'book', 'books', 'sofa', 3.3, 2.2, 10, 0],
    ['remote', 'remote', 'electronics', 'on:book1', 3.3, 2.2, 30],
    ['chips2', 'chipsBag', 'snacks', 'sofa', 7.4, 2.1, 15, 2],
    ['book2', 'book', 'books', 'table', 4.4, 5.8, -10, 1],
    ['gamepad', 'gamepad', 'electronics', 'on:book2', 4.4, 5.8, 20, 0],
    ['popcorn', 'popcorn', 'snacks', 'table', 6.2, 5.6],
    ['succulent', 'succulent', 'plants', 'table', 7.4, 6.8],
    ['maracas', 'maracas', 'music', 'on:cookie', 7.3, 5.5, 10],
    ['cookie', 'cookie', 'snacks', 'table', 7.4, 5.5],
    ['cactus', 'cactus', 'plants', 'console', 1.5, 7.2],
    ['camera', 'camera', 'electronics', 'console', 1.6, 2.8, 70],
    ['book3', 'book', 'books', 'shelf', 9.8, 0.75, 90, 2],
    ['lollipop', 'lollipop', 'snacks', 'on:book3', 9.8, 0.75, 20],
    ['flowers', 'flowerVase', 'plants', 'shelf', 11.1, 0.7, 0, 0],
    ['drum', 'drum', 'music', 'rug', 8.6, 8.3, 0, 0],
    ['book4', 'book', 'books', 'table', 5.9, 6.9, 15, 3],
    ['headphones', 'headphones', 'electronics', 'on:book4', 5.9, 6.9, 10, 2],
    ['keyboard', 'keyboard', 'music', 'rug', 4.4, 8.5],
    ['chocolate', 'chocolate', 'snacks', 'on:keyboard', 4.1, 8.5, 20],
    
    ['trumpet', 'trumpet', 'music', 'rug', 6.8, 8.9, 10],
    ['monstera', 'monstera', 'plants', 'floor', 11.0, 4.3],
    ['sunflower', 'sunflower', 'plants', 'floor', 2.4, 9.0],
    ['book5', 'book', 'books', 'floor', 10.5, 8.4, -20, 4],
    ['mic', 'microphone', 'music', 'on:book5', 10.5, 8.4, 30],
    ['phone', 'phone', 'electronics', 'on:mic', 10.5, 8.4, -10, 2],
    ['boombox', 'speaker', 'electronics', 'rug', 9.0, 4.7, -30],
  ]),
};

export const LEVELS: LevelDef[] = [studyNook, cozyKitchen, messyBedroom, splashyBathroom, livingRoom];
