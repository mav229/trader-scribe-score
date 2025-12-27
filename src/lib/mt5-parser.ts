import { supabase } from "@/integrations/supabase/client";

export interface ExtractedData {
  summary: {
    maxDrawdownPct: number | null;
    recoveryFactor: number | null;
    profitFactor: number | null;
    tradesPerWeek: number | null;
    avgHoldTimeMinutes: number | null;
  };
  profitLoss: {
    grossProfit: number | null;
    grossLoss: number | null;
    dailyPnL: number[] | null;
  };
  longShort: {
    avgWin: number | null;
    avgLoss: number | null;
    longTrades: number | null;
    shortTrades: number | null;
  };
  symbols: {
    concentration: { symbol: string; percent: number }[] | null;
  };
  risk: {
    maxConsecutiveLosses: number | null;
    mfe: number | null;
    mae: number | null;
  };
}

export interface PillarScores {
  drawdownControl: number;
  riskDiscipline: number;
  profitQuality: number;
  consistencyBehavior: number;
}

export interface ScoringResult {
  extractedData: ExtractedData;
  pillarScores: PillarScores;
  finalScholarScore: number;
  grade: 'A' | 'B' | 'C' | 'D';
}

export async function parseMT5Report(pdfText: string): Promise<ScoringResult> {
  const { data, error } = await supabase.functions.invoke('parse-mt5-report', {
    body: { pdfText },
  });

  if (error) {
    throw new Error(error.message || 'Failed to parse MT5 report');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as ScoringResult;
}

// Read PDF as text (for pdf.js extraction on client)
export async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // For now, we'll send the raw text content
      // In production, you'd want to use pdf.js for proper extraction
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
