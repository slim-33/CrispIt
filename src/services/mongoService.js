import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

// MongoDB connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Schemas
const PokedexSchema = new mongoose.Schema({
  name: String,
  normalizedName: String,
  freshnessScore: Number,
  freshnessLevel: String,
  carbonFootprint: Number,
  discoveredAt: String,
  imageUri: String,
  isPackaged: Boolean,
}, { collection: 'pokedex' });

const FridgeSchema = new mongoose.Schema({
  name: String,
  freshnessScore: Number,
  freshnessLevel: String,
  shelfLifeDays: Number,
  carbonFootprint: Number,
  sustainableAlternative: String,
  addedAt: String,
  imageUri: String,
  storageTip: String,
  isPackaged: Boolean,
  nutritionInfo: mongoose.Schema.Types.Mixed,
  packageType: String,
}, { collection: 'fridge' });

const StatsSchema = new mongoose.Schema({
  type: String,
  totalScans: Number,
  totalCarbonSaved: Number,
  averageFreshness: Number,
  lastScanDate: String,
}, { collection: 'stats' });

const ChatSchema = new mongoose.Schema({
  role: String,
  content: String,
  timestamp: String,
  order: Number,
}, { collection: 'chat' });

// Models
const Pokedex = mongoose.model('Pokedex', PokedexSchema);
const Fridge = mongoose.model('Fridge', FridgeSchema);
const Stats = mongoose.model('Stats', StatsSchema);
const Chat = mongoose.model('Chat', ChatSchema);

// ============= POKEDEX FUNCTIONS =============

export const saveToPokedex = async (produceData) => {
  try {
    await connectDB();
    const normalizedName = produceData.name.toLowerCase().trim();
    
    // Check if item already exists
    const existing = await Pokedex.findOne({ normalizedName });
    
    if (existing) {
      console.log(`${produceData.name} already exists in collection`);
      await updateStats(produceData);
      return { isNew: false, name: produceData.name };
    }
    
    // Insert new item
    const timestamp = new Date().toISOString();
    const newEntry = new Pokedex({
      name: produceData.name,
      normalizedName,
      freshnessScore: produceData.freshnessScore,
      freshnessLevel: produceData.freshnessLevel,
      carbonFootprint: produceData.carbonFootprint || 0,
      discoveredAt: timestamp,
      imageUri: produceData.imageUri,
      isPackaged: produceData.isPackaged || false,
    });
    
    await newEntry.save();
    await updateStats(produceData);
    
    return { isNew: true, ...newEntry.toObject() };
  } catch (error) {
    console.error('Error saving to Pokedex:', error);
    throw error;
  }
};

export const getPokedex = async () => {
  try {
    await connectDB();
    const items = await Pokedex.find().sort({ discoveredAt: -1 });
    return items;
  } catch (error) {
    console.error('Error getting Pokedex:', error);
    return [];
  }
};

export const getUniqueProduceCount = async () => {
  try {
    const pokedex = await getPokedex();
    return pokedex.length;
  } catch (error) {
    return 0;
  }
};

// ============= FRIDGE FUNCTIONS =============

export const saveToFridge = async (produceData) => {
  try {
    await connectDB();
    const timestamp = new Date().toISOString();
    
    const newEntry = new Fridge({
      name: produceData.name,
      freshnessScore: produceData.freshnessScore,
      freshnessLevel: produceData.freshnessLevel,
      shelfLifeDays: produceData.shelfLifeDays || calculateShelfLife(produceData.freshnessScore),
      carbonFootprint: produceData.carbonFootprint || 0,
      sustainableAlternative: produceData.sustainableAlternative || '',
      addedAt: timestamp,
      imageUri: produceData.imageUri,
      storageTip: produceData.storageTip,
      isPackaged: produceData.isPackaged || false,
      nutritionInfo: produceData.nutritionInfo || null,
      packageType: produceData.packageType || null,
    });
    
    await newEntry.save();
    return newEntry.toObject();
  } catch (error) {
    console.error('Error saving to Fridge:', error);
    throw error;
  }
};

export const getFridge = async () => {
  try {
    await connectDB();
    const items = await Fridge.find().sort({ addedAt: -1 });
    return items;
  } catch (error) {
    console.error('Error getting Fridge:', error);
    return [];
  }
};

export const deleteFromFridge = async (itemId) => {
  try {
    await connectDB();
    await Fridge.findByIdAndDelete(itemId);
    return true;
  } catch (error) {
    console.error('Error deleting from Fridge:', error);
    return false;
  }
};

export const getFridgeStats = async () => {
  try {
    const items = await getFridge();
    const now = new Date();
    
    const itemsWithStatus = items.map(item => {
      // Packaged items don't have shelf life calculations
      if (item.isPackaged) {
        return {
          ...item.toObject(),
          id: item._id.toString(),
          remainingDays: null,
          status: 'packaged'
        };
      }
      
      const addedDate = new Date(item.addedAt);
      const daysElapsed = Math.floor((now - addedDate) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.max(0, item.shelfLifeDays - daysElapsed);
      
      return {
        ...item.toObject(),
        id: item._id.toString(),
        remainingDays,
        status: remainingDays >= 3 ? 'fresh' : 'expiringSoon'
      };
    });
    
    const fresh = itemsWithStatus.filter(item => item.status === 'fresh');
    const expiringSoon = itemsWithStatus.filter(item => item.status === 'expiringSoon' && item.remainingDays > 0);
    const packaged = itemsWithStatus.filter(item => item.status === 'packaged');
    
    return {
      all: itemsWithStatus,
      fresh,
      expiringSoon,
      packaged,
      totalItems: items.length,
    };
  } catch (error) {
    console.error('Error getting fridge stats:', error);
    return { all: [], fresh: [], expiringSoon: [], packaged: [], totalItems: 0 };
  }
};

const calculateShelfLife = (freshnessScore) => {
  if (freshnessScore >= 90) return 10;
  if (freshnessScore >= 75) return 7;
  if (freshnessScore >= 55) return 4;
  if (freshnessScore >= 35) return 2;
  return 1;
};

// ============= STATS FUNCTIONS =============

export const updateStats = async (produceData) => {
  try {
    await connectDB();
    // Get current stats
    let currentStats = await Stats.findOne({ type: 'global' });
    
    if (!currentStats) {
      currentStats = new Stats({
        type: 'global',
        totalScans: 0,
        totalCarbonSaved: 0,
        averageFreshness: 0,
        lastScanDate: null,
      });
    }
    
    currentStats.totalScans = (currentStats.totalScans || 0) + 1;
    currentStats.totalCarbonSaved = (currentStats.totalCarbonSaved || 0) + (produceData.carbonSavings || 0);
    currentStats.lastScanDate = new Date().toISOString();
    
    await currentStats.save();
    return currentStats.toObject();
  } catch (error) {
    console.error('Error updating stats:', error);
    throw error;
  }
};

export const getStats = async () => {
  try {
    await connectDB();
    let stats = await Stats.findOne({ type: 'global' });
    
    if (!stats) {
      stats = {
        totalScans: 0,
        totalCarbonSaved: 0,
        averageFreshness: 0,
        lastScanDate: null,
      };
    } else {
      stats = stats.toObject();
    }
    
    // Recalculate average freshness from current fridge items
    const fridgeItems = await getFridge();
    const freshItems = fridgeItems.filter(item => !item.isPackaged && item.freshnessScore != null);
    
    if (freshItems.length > 0) {
      const totalFreshness = freshItems.reduce((sum, item) => sum + item.freshnessScore, 0);
      stats.averageFreshness = totalFreshness / freshItems.length;
    } else {
      stats.averageFreshness = 0;
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      totalScans: 0,
      totalCarbonSaved: 0,
      averageFreshness: 0,
      lastScanDate: null,
    };
  }
};

export const clearAllData = async () => {
  try {
    await connectDB();
    await Promise.all([
      Pokedex.deleteMany({}),
      Fridge.deleteMany({}),
      Stats.deleteMany({}),
      Chat.deleteMany({}),
    ]);
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

// ============= CHAT FUNCTIONS =============

export const saveChatMessages = async (messages) => {
  try {
    await connectDB();
    // Delete all existing messages
    await Chat.deleteMany({});
    
    // Insert all messages
    if (messages.length > 0) {
      const chatDocs = messages.map((msg, idx) => ({
        ...msg,
        order: idx,
      }));
      await Chat.insertMany(chatDocs);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving chat messages:', error);
    return false;
  }
};

export const getChatMessages = async () => {
  try {
    await connectDB();
    const messages = await Chat.find().sort({ order: 1 });
    return messages;
  } catch (error) {
    console.error('Error getting chat messages:', error);
    return [];
  }
};
