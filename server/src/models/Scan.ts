import mongoose, { Schema, Document } from 'mongoose';

export interface IScan extends Document {
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
  carbon_footprint?: {
    item: string;
    co2e_per_kg: number;
    category: string;
    comparison: string;
    driving_equivalent_km: number;
  };
  created_at: Date;
}

const ScanSchema = new Schema<IScan>({
  item_name: { type: String, required: true },
  category: { type: String, required: true },
  freshness_score: { type: Number, required: true, min: 1, max: 10 },
  freshness_description: { type: String, required: true },
  estimated_days_remaining: { type: Number, required: true },
  storage_tips: [String],
  visual_indicators: [String],
  sustainable_alternative: {
    name: String,
    reason: String,
    carbon_savings_percent: Number,
  },
  carbon_footprint: {
    item: String,
    co2e_per_kg: Number,
    category: String,
    comparison: String,
    driving_equivalent_km: Number,
  },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model<IScan>('Scan', ScanSchema);
