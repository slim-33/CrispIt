import AsyncStorage from '@react-native-async-storage/async-storage';

const POKEDEX_KEY = '@freshpick_pokedex';
const STATS_KEY = '@freshpick_stats';
const FRIDGE_KEY = '@freshpick_fridge';
const CHAT_KEY = '@freshpick_chat';

export const saveToPokedex = async (produceData) => {
  try {
    const existing = await getPokedex();
    const timestamp = new Date().toISOString();
    
    // Normalize the produce name for comparison (lowercase, trim)
    const normalizedName = produceData.name.toLowerCase().trim();
    
    // Check if this produce already exists in the collection
    const alreadyExists = existing.some(
      item => item.name.toLowerCase().trim() === normalizedName
    );
    
    // Only add if it's unique
    if (alreadyExists) {
      console.log(`${produceData.name} already exists in collection, skipping save`);
      // Still update stats even if we don't save a duplicate
      await updateStats(produceData);
      return { isNew: false, name: produceData.name };
    }
    
    const newEntry = {
      id: `${produceData.name}_${timestamp}`,
      name: produceData.name,
      freshnessScore: produceData.freshnessScore,
      freshnessLevel: produceData.freshnessLevel,
      carbonFootprint: produceData.carbonFootprint || 0,
      discoveredAt: timestamp,
      imageUri: produceData.imageUri,
      isPackaged: produceData.isPackaged || false, // Track if it's packaged
    };
    
    const updated = [newEntry, ...existing];
    await AsyncStorage.setItem(POKEDEX_KEY, JSON.stringify(updated));
    
    // Update stats
    await updateStats(produceData);
    
    return { isNew: true, ...newEntry };
  } catch (error) {
    console.error('Error saving to Pokedex:', error);
    throw error;
  }
};

// Fridge functions
export const saveToFridge = async (produceData) => {
  try {
    const existing = await getFridge();
    const timestamp = new Date().toISOString();
    
    const newEntry = {
      id: `fridge_${Date.now()}`,
      name: produceData.name,
      freshnessScore: produceData.freshnessScore,
      freshnessLevel: produceData.freshnessLevel,
      shelfLifeDays: produceData.shelfLifeDays || calculateShelfLife(produceData.freshnessScore),
      carbonFootprint: produceData.carbonFootprint || 0,
      sustainableAlternative: produceData.sustainableAlternative || '',
      addedAt: timestamp,
      imageUri: produceData.imageUri,
      storageTip: produceData.storageTip,
      isPackaged: produceData.isPackaged || false, // Mark packaged items
      nutritionInfo: produceData.nutritionInfo || null,
      packageType: produceData.packageType || null,
    };
    
    const updated = [newEntry, ...existing];
    await AsyncStorage.setItem(FRIDGE_KEY, JSON.stringify(updated));
    
    return newEntry;
  } catch (error) {
    console.error('Error saving to Fridge:', error);
    throw error;
  }
};

export const getFridge = async () => {
  try {
    const data = await AsyncStorage.getItem(FRIDGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting Fridge:', error);
    return [];
  }
};

export const deleteFromFridge = async (itemId) => {
  try {
    const existing = await getFridge();
    const updated = existing.filter(item => item.id !== itemId);
    await AsyncStorage.setItem(FRIDGE_KEY, JSON.stringify(updated));
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
          ...item,
          remainingDays: null,
          status: 'packaged'
        };
      }
      
      const addedDate = new Date(item.addedAt);
      const daysElapsed = Math.floor((now - addedDate) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.max(0, item.shelfLifeDays - daysElapsed);
      
      return {
        ...item,
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

export const getPokedex = async () => {
  try {
    const data = await AsyncStorage.getItem(POKEDEX_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting Pokedex:', error);
    return [];
  }
};

export const getUniqueProduceCount = async () => {
  try {
    const pokedex = await getPokedex();
    const uniqueNames = new Set(pokedex.map(item => item.name.toLowerCase()));
    return uniqueNames.size;
  } catch (error) {
    return 0;
  }
};

export const updateStats = async (produceData) => {
  try {
    const stats = await AsyncStorage.getItem(STATS_KEY);
    const currentStats = stats ? JSON.parse(stats) : {
      totalScans: 0,
      totalCarbonSaved: 0,
      averageFreshness: 0,
      lastScanDate: null,
    };
    
    const updatedStats = {
      totalScans: (currentStats.totalScans || 0) + 1,
      totalCarbonSaved: (currentStats.totalCarbonSaved || 0) + (produceData.carbonSavings || 0),
      averageFreshness: currentStats.averageFreshness, // This will be recalculated in getStats()
      lastScanDate: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updatedStats));
    return updatedStats;
  } catch (error) {
    console.error('Error updating stats:', error);
    throw error;
  }
};

export const getStats = async () => {
  try {
    const data = await AsyncStorage.getItem(STATS_KEY);
    const stats = data ? JSON.parse(data) : {
      totalScans: 0,
      totalCarbonSaved: 0,
      averageFreshness: 0,
      lastScanDate: null,
    };
    
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
    await AsyncStorage.multiRemove([POKEDEX_KEY, STATS_KEY, FRIDGE_KEY, CHAT_KEY]);
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

// Chat message storage
export const saveChatMessages = async (messages) => {
  try {
    await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(messages));
    return true;
  } catch (error) {
    console.error('Error saving chat messages:', error);
    return false;
  }
};

export const getChatMessages = async () => {
  try {
    const data = await AsyncStorage.getItem(CHAT_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting chat messages:', error);
    return [];
  }
};
