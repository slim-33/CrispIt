import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  sustainability_score: number;
  total_scans: number;
  total_carbon_saved: number;
  current_streak: number;
  best_streak: number;
  last_scan_date?: Date;
  badges: string[];
  created_at: Date;
}

const UserSchema = new Schema<IUser>({
  sustainability_score: { type: Number, default: 50 },
  total_scans: { type: Number, default: 0 },
  total_carbon_saved: { type: Number, default: 0 },
  current_streak: { type: Number, default: 0 },
  best_streak: { type: Number, default: 0 },
  last_scan_date: Date,
  badges: [String],
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>('User', UserSchema);
