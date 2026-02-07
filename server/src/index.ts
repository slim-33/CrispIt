import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './lib/mongodb';
import scanRoutes from './routes/scan';
import carbonRoutes from './routes/carbon';
import barcodeRoutes from './routes/barcode';
import recipeRoutes from './routes/recipes';
import speakRoutes from './routes/speak';
import fridgeRoutes from './routes/fridge';
import statsRoutes from './routes/stats';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/scan', scanRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/carbon', carbonRoutes);
app.use('/api/barcode', barcodeRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/speak', speakRoutes);
app.use('/api/fridge', fridgeRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`LunchBox API running on port ${PORT}`);
  });
}

start();
