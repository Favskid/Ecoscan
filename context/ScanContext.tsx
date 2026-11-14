/**
 * ScanContext — minimal global state.
 * Just holds the current scan result so camera → result screens can share it.
 */

import React, { createContext, useContext, useState } from 'react';
import { ClassificationResult } from '@/services/classifierService';

export interface ScanResult extends ClassificationResult {
  imageUri: string;
}

interface ScanContextType {
  currentScan: ScanResult | null;
  setCurrentScan: (scan: ScanResult | null) => void;
}

const ScanContext = createContext<ScanContextType | undefined>(undefined);

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);

  return (
    <ScanContext.Provider value={{ currentScan, setCurrentScan }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScan(): ScanContextType {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error('useScan must be used inside ScanProvider');
  return ctx;
}
