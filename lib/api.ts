import { API_URL } from './constants';
import {
  DEMO_MODE,
  DEMO_SCAN_RESULTS,
  DEMO_SCAN_HISTORY,
  DEMO_FRIDGE_ITEMS,
  DEMO_STATS,
  DEMO_RECIPES,
  DEMO_BARCODE,
} from './demo';
import type {
  ScanResult,
  CarbonData,
  FridgeItem,
  RecipeSuggestion,
  BarcodeProduct,
  UserStats,
} from './types';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API Error ${res.status}: ${error}`);
  }
  return res.json();
}

export async function scanImage(base64Image: string): Promise<ScanResult> {
  if (DEMO_MODE) {
    await delay(1500);
    const keys = Object.keys(DEMO_SCAN_RESULTS);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return DEMO_SCAN_RESULTS[randomKey];
  }
  return fetchApi<ScanResult>('/api/scan', {
    method: 'POST',
    body: JSON.stringify({ image: base64Image }),
  });
}

export async function getCarbonFootprint(item: string): Promise<CarbonData> {
  return fetchApi<CarbonData>(`/api/carbon/${encodeURIComponent(item)}`);
}

export async function lookupBarcode(code: string): Promise<BarcodeProduct> {
  if (DEMO_MODE) {
    await delay(800);
    return DEMO_BARCODE;
  }
  return fetchApi<BarcodeProduct>(`/api/barcode/${encodeURIComponent(code)}`);
}

export async function generateRecipes(items: string[]): Promise<RecipeSuggestion[]> {
  if (DEMO_MODE) {
    await delay(2000);
    return DEMO_RECIPES;
  }
  return fetchApi<RecipeSuggestion[]>('/api/recipes', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  const res = await fetch(`${API_URL}/api/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('TTS failed');
  return res.arrayBuffer();
}

export async function getFridgeItems(): Promise<FridgeItem[]> {
  if (DEMO_MODE) {
    await delay(500);
    return DEMO_FRIDGE_ITEMS;
  }
  return fetchApi<FridgeItem[]>('/api/fridge');
}

export async function addFridgeItem(item: Omit<FridgeItem, '_id'>): Promise<FridgeItem> {
  if (DEMO_MODE) {
    await delay(500);
    return { ...item, _id: `demo-${Date.now()}` };
  }
  return fetchApi<FridgeItem>('/api/fridge', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function removeFridgeItem(id: string): Promise<void> {
  if (DEMO_MODE) {
    await delay(300);
    return;
  }
  await fetchApi(`/api/fridge/${id}`, { method: 'DELETE' });
}

export async function getScanHistory(): Promise<ScanResult[]> {
  if (DEMO_MODE) {
    await delay(500);
    return DEMO_SCAN_HISTORY;
  }
  return fetchApi<ScanResult[]>('/api/scans');
}

export async function getUserStats(): Promise<UserStats> {
  if (DEMO_MODE) {
    await delay(500);
    return DEMO_STATS;
  }
  return fetchApi<UserStats>('/api/stats');
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
