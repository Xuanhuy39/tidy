export type CategoryId =
  | 'stationery'
  | 'snacks'
  | 'electronics'
  | 'fruit'
  | 'drinks'
  | 'tableware'
  | 'bakery'
  | 'clothes'
  | 'toys'
  | 'books'
  | 'sports';

export type RoomId = 'study' | 'kitchen' | 'bedroom';

export interface ItemDef {
  id: string;
  /** Model builder name, see src/scene/models.ts. */
  kind: string;
  cat: CategoryId;
  /** Rest on a room surface (see src/scene/rooms.ts) ... */
  surface?: string;
  /** ... or on top of another item. An item can only be picked once nothing rests on it. */
  on?: string;
  x: number;
  z: number;
  /** Rotation around the vertical axis, in degrees. */
  rot?: number;
  /** Optional colour variant for models that support it. */
  variant?: number;
}

export interface LevelDef {
  id: string;
  name: string;
  room: RoomId;
  /** Order in which category boxes appear. Each box holds every item of its category. */
  queue: CategoryId[];
  items: ItemDef[];
}

export interface CategoryInfo {
  name: string;
  color: string;
  icon: string;
}
