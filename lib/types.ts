export interface ScanResult {
  _id?: string;
  item_name: string;
  category: string;
  freshness_score: number;
  freshness_description: string;
  estimated_days_remaining: number;
  storage_tips: string[];
  visual_indicators: string[];
  sustainable_alternative: {
    name: string;
    reason: string;
    carbon_savings_percent: number;
  };
  carbon_footprint?: CarbonData;
  image_uri?: string;
  created_at?: string;
}

export interface CarbonData {
  item: string;
  co2e_per_kg: number;
  category: string;
  comparison: string;
  driving_equivalent_km: number;
}

export interface FridgeItem {
  _id?: string;
  item_name: string;
  category: string;
  added_date: string;
  expiry_date: string;
  freshness_score: number;
  quantity: number;
  unit: string;
  image_uri?: string;
}

export interface RecipeSuggestion {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  carbon_savings: string;
  prep_time: string;
}

export interface BarcodeProduct {
  name: string;
  brand: string;
  eco_score: string;
  nutri_score: string;
  ingredients: string;
  origin: string;
  packaging: string;
  image_url?: string;
  categories: string;
}

export interface UserStats {
  total_scans: number;
  total_carbon_saved: number;
  current_streak: number;
  best_streak: number;
  sustainability_score: number;
  badges: Badge[];
  weekly_carbon: WeeklyCarbon[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earned_date?: string;
}

export interface WeeklyCarbon {
  date: string;
  co2e: number;
}

export interface CarbonReceiptItem {
  item_name: string;
  co2e: number;
  quantity: number;
}

export interface DetectedItem {
  item_name: string;
  category: string;
  freshness_score: number;
  freshness_description: string;
  estimated_days_remaining: number;
  box: [number, number, number, number]; // [y_min, x_min, y_max, x_max] normalized 0-1000
}

export interface LiveScanResult {
  detections: DetectedItem[];
}
