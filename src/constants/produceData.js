// Carbon footprint data in kg CO2e per kg of produce
export const PRODUCE_DATA = {
  // Fruits
  apple: {
    name: 'Apple',
    category: 'Fruit',
    carbonFootprint: 0.3,
    seasonalMonths: [8, 9, 10, 11],
    freshnessChecks: ['Firm texture', 'Bright color', 'No bruises', 'Fresh stem'],
  },
  banana: {
    name: 'Banana',
    category: 'Fruit',
    carbonFootprint: 0.7,
    seasonalMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    freshnessChecks: ['Yellow color', 'Firm but not hard', 'Few brown spots OK', 'No mold'],
  },
  orange: {
    name: 'Orange',
    category: 'Fruit',
    carbonFootprint: 0.4,
    seasonalMonths: [11, 12, 1, 2, 3, 4],
    freshnessChecks: ['Heavy for size', 'Firm skin', 'Bright color', 'Fresh smell'],
  },
  strawberry: {
    name: 'Strawberry',
    category: 'Fruit',
    carbonFootprint: 1.0,
    seasonalMonths: [4, 5, 6],
    freshnessChecks: ['Red color', 'Firm texture', 'Green leaves', 'No mold'],
  },
  
  // Vegetables
  tomato: {
    name: 'Tomato',
    category: 'Vegetable',
    carbonFootprint: 2.0,
    seasonalMonths: [6, 7, 8, 9],
    freshnessChecks: ['Firm but yields to pressure', 'Bright color', 'Fresh smell', 'Smooth skin'],
  },
  lettuce: {
    name: 'Lettuce',
    category: 'Vegetable',
    carbonFootprint: 0.3,
    seasonalMonths: [4, 5, 6, 7, 8, 9],
    freshnessChecks: ['Crisp leaves', 'Bright green', 'No wilting', 'No brown edges'],
  },
  carrot: {
    name: 'Carrot',
    category: 'Vegetable',
    carbonFootprint: 0.2,
    seasonalMonths: [1, 2, 3, 4, 9, 10, 11, 12],
    freshnessChecks: ['Firm texture', 'Bright color', 'Smooth skin', 'Fresh greens if attached'],
  },
  broccoli: {
    name: 'Broccoli',
    category: 'Vegetable',
    carbonFootprint: 0.4,
    seasonalMonths: [3, 4, 5, 10, 11],
    freshnessChecks: ['Tight florets', 'Dark green', 'Firm stalks', 'No yellowing'],
  },
  potato: {
    name: 'Potato',
    category: 'Vegetable',
    carbonFootprint: 0.3,
    seasonalMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    freshnessChecks: ['Firm texture', 'No sprouts', 'No green spots', 'Clean skin'],
  },
};

export const getCarbonFootprint = (produceName) => {
  const key = produceName.toLowerCase();
  return PRODUCE_DATA[key]?.carbonFootprint || 0.5; // Default if not found
};

export const getProduceInfo = (produceName) => {
  const key = produceName.toLowerCase();
  return PRODUCE_DATA[key] || null;
};

export const isInSeason = (produceName, month = new Date().getMonth() + 1) => {
  const info = getProduceInfo(produceName);
  if (!info) return false;
  return info.seasonalMonths.includes(month);
};

export const getSustainableAlternatives = (produceName) => {
  const currentCarbon = getCarbonFootprint(produceName);
  const alternatives = [];
  
  Object.keys(PRODUCE_DATA).forEach(key => {
    const item = PRODUCE_DATA[key];
    if (item.carbonFootprint < currentCarbon && key !== produceName.toLowerCase()) {
      alternatives.push({
        name: item.name,
        category: item.category,
        carbonSavings: (currentCarbon - item.carbonFootprint).toFixed(2),
      });
    }
  });
  
  return alternatives.slice(0, 3);
};
