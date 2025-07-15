export interface Unit {
  id: number;
  name: string;
  symbol: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnitFormData {
  name: string;
  symbol: string;
  description: string;
} 