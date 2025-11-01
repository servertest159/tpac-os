
export interface LoadoutItem {
  id: string;
  name: string;
  type: string;
  quantityRequired: number;
  quantityAvailable: number;
  condition: string;
  checked: boolean;
  notes?: string;
}
