import { useState, useEffect, useCallback } from 'react';
import { Bank, Promo, Tip } from './types';
import {
  fetchBanks,
  fetchPromos,
  fetchTips,
  getCachedBanks,
  getCachedPromos,
  getCachedTips,
} from './api';

interface DataState {
  banks: Bank[];
  promos: Promo[];
  tips: Tip[];
  loading: boolean;
}

let globalData: DataState = {
  banks: [],
  promos: [],
  tips: [],
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
    const [cachedBanks, cachedPromos, cachedTips] = await Promise.all([
      getCachedBanks(),
      getCachedPromos(),
      getCachedTips(),
    ]);

    if (cachedBanks || cachedPromos || cachedTips) {
      globalData = {
        banks: cachedBanks ?? [],
        promos: cachedPromos ?? [],
        tips: cachedTips ?? [],
        loading: false,
      };
      notify();
    }
  } catch {
    // cache read failure — continue to network fetch
  }

  // Step 2: refresh from Supabase in background
  try {
    const [banks, promos, tips] = await Promise.all([
      fetchBanks(),
      fetchPromos(),
      fetchTips(),
    ]);
    globalData = { banks, promos, tips, loading: false };
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
    const [banks, promos, tips] = await Promise.all([
      fetchBanks(),
      fetchPromos(),
      fetchTips(),
    ]);
    globalData = { banks, promos, tips, loading: false };
    notify();
  } catch (err) {
    console.warn('Supabase refresh error:', err);
  }
}
