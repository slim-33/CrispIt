import mongoose, { Schema, Document } from 'mongoose';

export interface IFridgeItem extends Document {
  item_name: string;
  category: string;
  added_date: Date;
  expiry_date: Date;
  freshness_score: number;
  quantity: number;
  unit: string;
  image_uri?: string;
}

const FridgeItemSchema = new Schema<IFridgeItem>({
  item_name: { type: String, required: true },
  category: { type: String, required: true },
  added_date: { type: Date, default: Date.now },
  expiry_date: { type: Date, required: true },
  freshness_score: { type: Number, required: true, min: 1, max: 10 },
  quantity: { type: Number, default: 1 },
  unit: { type: String, default: 'item' },
  image_uri: String,
});

export default mongoose.model<IFridgeItem>('FridgeItem', FridgeItemSchema);
