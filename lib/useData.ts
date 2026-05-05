import { useState, useEffect } from 'react';
import { Bank, Category, Promo, Tip } from './types';
import {
  fetchBanks, fetchPromos, fetchTips, fetchCategories,
  getCachedBanks, getCachedPromos, getCachedTips, getCachedCategories,
} from './api';
import { CATEGORIES as FALLBACK_CATEGORIES } from './constants';

interface DataState {
  banks: Bank[];
  promos: Promo[];
  tips: Tip[];
  categories: Category[];
  loading: boolean;
}

let globalData: DataState = {
  banks: [],
  promos: [],
  tips: [],
  categories: FALLBACK_CATEGORIES,
  loading: true,
};

let listeners: Set<() => void> = new Set();
let initialized = false;

function notify() {
  listeners.forEach((fn) => fn());
}

async function init() {
  if (initialized) return;
  initialized = true;

  // Step 1: load from cache instantly
  try {
    const [cachedBanks, cachedPromos, cachedTips, cachedCategories] = await Promise.all([
      getCachedBanks(),
      getCachedPromos(),
      getCachedTips(),
      getCachedCategories(),
    ]);

    if (cachedBanks || cachedPromos || cachedTips || cachedCategories) {
      globalData = {
        banks: cachedBanks ?? [],
        promos: cachedPromos ?? [],
        tips: cachedTips ?? [],
        categories: cachedCategories ?? FALLBACK_CATEGORIES,
        loading: false,
      };
      notify();
    }
  } catch {
    // cache read failure — continue to network fetch
  }

  // Step 2: refresh from Supabase in background
  try {
    const [banks, promos, tips, categories] = await Promise.all([
      fetchBanks(),
      fetchPromos(),
      fetchTips(),
      fetchCategories(),
    ]);
    globalData = { banks, promos, tips, categories, loading: false };
    notify();
  } catch (err) {
    console.warn('Supabase fetch error:', err);
    globalData = { ...globalData, loading: false };
    notify();
  }
}

export function useData(): DataState {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    init();
    return () => { listeners.delete(listener); };
  }, []);

  return globalData;
}

/** Force re-fetch from Supabase */
export async function refreshData(): Promise<void> {
  try {
    const [banks, promos, tips, categories] = await Promise.all([
      fetchBanks(),
      fetchPromos(),
      fetchTips(),
      fetchCategories(),
    ]);
    globalData = { banks, promos, tips, categories, loading: false };
    notify();
  } catch (err) {
    console.warn('Supabase refresh error:', err);
  }
}
