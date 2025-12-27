import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Type definitions for extracted data
interface ExtractedData {
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

interface PillarScores {
  drawdownControl: number;
  riskDiscipline: number;
  profitQuality: number;
  consistencyBehavior: number;
}

interface ScoringResult {
  extractedData: ExtractedData;
  pillarScores: PillarScores;
  finalScholarScore: number;
  grade: 'A' | 'B' | 'C' | 'D';
}

// Helper: safely parse number from text
function parseNumber(text: string | undefined | null): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[,%+\s]/g, '').replace(/−/g, '-');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Helper: safely parse percentage
function parsePercent(text: string | undefined | null): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[%\s]/g, '').replace(/−/g, '-');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Extract data from structured JSON (like the sample provided)
function extractFromJson(jsonData: any): ExtractedData {
  // Handle array format - take first element
  const data = Array.isArray(jsonData) ? jsonData[0] : jsonData;
  
  if (!data) {
    throw new Error('Empty or invalid JSON data');
  }

  const extracted: ExtractedData = {
    summary: {
      maxDrawdownPct: null,
      recoveryFactor: null,
      profitFactor: null,
      tradesPerWeek: null,
      avgHoldTimeMinutes: null,
    },
    profitLoss: {
      grossProfit: null,
      grossLoss: null,
      dailyPnL: null,
    },
    longShort: {
      avgWin: null,
      avgLoss: null,
      longTrades: null,
      shortTrades: null,
    },
    symbols: {
      concentration: null,
    },
    risk: {
      maxConsecutiveLosses: null,
      mfe: null,
      mae: null,
    },
  };

  // Extract Max Drawdown % from growth.drawdown (already as decimal)
  if (data.growth?.drawdown !== undefined) {
    extracted.summary.maxDrawdownPct = data.growth.drawdown * 100;
  }

  // Extract Profit Factor from symbolIndicators
  if (data.symbolIndicators?.profit_factor) {
    const pf = data.symbolIndicators.profit_factor;
    if (Array.isArray(pf) && pf[0]) {
      extracted.summary.profitFactor = pf[0][1];
    }
  }

  // Calculate trades per week
  if (data.longShortTotal) {
    const totalTrades = (data.longShortTotal.long || 0) + (data.longShortTotal.short || 0);
    // Estimate weeks from balance chart data
    if (data.balance?.chart && data.balance.chart.length > 1) {
      const firstTimestamp = data.balance.chart[0]?.x;
      const lastTimestamp = data.balance.chart[data.balance.chart.length - 1]?.x;
      if (firstTimestamp && lastTimestamp) {
        const weeks = (lastTimestamp - firstTimestamp) / (7 * 24 * 60 * 60);
        if (weeks > 0) {
          extracted.summary.tradesPerWeek = totalTrades / weeks;
        }
      }
    }
  }

  // Extract Gross Profit and Loss
  if (data.profitTotal) {
    extracted.profitLoss.grossProfit = data.profitTotal.profit ?? data.profitTotal.profit_gross ?? null;
    extracted.profitLoss.grossLoss = data.profitTotal.loss ?? data.profitTotal.loss_gross ?? null;
  }

  // Calculate Recovery Factor: net profit / max drawdown
  if (extracted.profitLoss.grossProfit !== null && 
      extracted.profitLoss.grossLoss !== null && 
      extracted.summary.maxDrawdownPct !== null &&
      extracted.summary.maxDrawdownPct > 0) {
    const netProfit = extracted.profitLoss.grossProfit + extracted.profitLoss.grossLoss;
    const initialBalance = data.evaluation?.metrics?.initial_balance || data.balance?.balance || 1000;
    const drawdownAmount = (extracted.summary.maxDrawdownPct / 100) * initialBalance;
    if (drawdownAmount > 0) {
      extracted.summary.recoveryFactor = Math.abs(netProfit) / drawdownAmount;
    }
  }

  // Extract Daily PnL from profitMoney or symbolMoney
  if (data.profitMoney?.profit && data.profitMoney?.loss) {
    const profits = data.profitMoney.profit;
    const losses = data.profitMoney.loss;
    const dailyPnL: number[] = [];
    
    for (let i = 0; i < Math.min(profits.length, losses.length); i++) {
      const profitVal = profits[i]?.y?.[0] || 0;
      const lossVal = losses[i]?.y?.[0] || 0;
      const daily = profitVal + lossVal;
      if (daily !== 0) {
        dailyPnL.push(daily);
      }
    }
    
    if (dailyPnL.length > 0) {
      extracted.profitLoss.dailyPnL = dailyPnL;
    }
  }

  // Extract Long/Short totals
  if (data.longShortTotal) {
    extracted.longShort.longTrades = data.longShortTotal.long ?? null;
    extracted.longShort.shortTrades = data.longShortTotal.short ?? null;
  }

  // Extract Average Win/Loss from longShortIndicators
  if (data.longShortIndicators) {
    if (data.longShortIndicators.average_profit) {
      // average_profit is [long_avg, short_avg]
      const avgProfits = data.longShortIndicators.average_profit;
      extracted.longShort.avgWin = avgProfits[0] > 0 ? avgProfits[0] : (avgProfits[1] > 0 ? avgProfits[1] : null);
    }
    if (data.longShortIndicators.average_pl) {
      // Use as fallback for avgLoss
      const avgPl = data.longShortIndicators.average_pl;
      const negativeAvg = avgPl.find((v: number) => v < 0);
      if (negativeAvg !== undefined) {
        extracted.longShort.avgLoss = negativeAvg;
      }
    }
  }

  // Extract Symbol Concentration
  if (data.symbolsTotal?.total) {
    const symbols: { symbol: string; percent: number }[] = [];
    const totalTrades = data.symbolsTotal.total.reduce((sum: number, s: any[]) => sum + (s[2] || 0), 0);
    
    for (const symbolData of data.symbolsTotal.total) {
      if (Array.isArray(symbolData) && symbolData.length >= 3) {
        const symbol = symbolData[0];
        const trades = symbolData[2];
        if (totalTrades > 0) {
          symbols.push({
            symbol,
            percent: (trades / totalTrades) * 100,
          });
        }
      }
    }
    
    if (symbols.length > 0) {
      extracted.symbols.concentration = symbols;
    }
  }

  // Extract Max Consecutive Losses from risksIndicators
  if (data.risksIndicators?.max_consecutive_trades) {
    // max_consecutive_trades is [wins, losses]
    const maxConsec = data.risksIndicators.max_consecutive_trades;
    extracted.risk.maxConsecutiveLosses = maxConsec[1] ?? null;
  }

  // Extract MFE/MAE from risksMfeMaeMoney
  if (data.risksMfeMaeMoney?.chart) {
    let totalMfe = 0;
    let totalMae = 0;
    let count = 0;

    for (const chartArray of data.risksMfeMaeMoney.chart) {
      if (Array.isArray(chartArray)) {
        for (const point of chartArray) {
          if (point?.y && Array.isArray(point.y) && point.y.length >= 4) {
            // y: [profit, mfe, loss, mae]
            const mfe = point.y[1] || 0;
            const mae = Math.abs(point.y[3] || 0);
            if (mfe !== 0 || mae !== 0) {
              totalMfe += mfe;
              totalMae += mae;
              count++;
            }
          }
        }
      }
    }

    if (count > 0) {
      extracted.risk.mfe = totalMfe;
      extracted.risk.mae = totalMae;
    }
  }

  console.log('JSON extraction complete:', JSON.stringify(extracted, null, 2));
  return extracted;
}

// AI-powered extraction using Lovable AI
async function extractDataWithAI(pdfText: string): Promise<ExtractedData> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const systemPrompt = `You are a precise data extraction engine for MetaTrader 5 trading reports.
Extract ONLY the following metrics if they are EXPLICITLY visible in the text. 
Do NOT estimate, infer, or calculate missing values.
If a value is not found, return null.

Required metrics to extract:
1. Summary: Max Drawdown %, Recovery Factor, Profit Factor, Trades per Week, Average Hold Time
2. Profit & Loss: Gross Profit, Gross Loss, Daily PnL values (as array)
3. Long & Short: Average Profit, Average Loss, Long trade count, Short trade count
4. Symbols: Each symbol and its percentage of total trades
5. Risks: Max Consecutive Losses, MFE, MAE

Return valid JSON only.`;

  const userPrompt = `Extract all trading metrics from this MT5 report text:

${pdfText}

Return JSON in this exact format:
{
  "summary": {
    "maxDrawdownPct": <number or null>,
    "recoveryFactor": <number or null>,
    "profitFactor": <number or null>,
    "tradesPerWeek": <number or null>,
    "avgHoldTimeMinutes": <number or null>
  },
  "profitLoss": {
    "grossProfit": <number or null>,
    "grossLoss": <number or null>,
    "dailyPnL": <array of numbers or null>
  },
  "longShort": {
    "avgWin": <number or null>,
    "avgLoss": <number or null>,
    "longTrades": <number or null>,
    "shortTrades": <number or null>
  },
  "symbols": {
    "concentration": [{"symbol": "...", "percent": <number>}] or null
  },
  "risk": {
    "maxConsecutiveLosses": <number or null>,
    "mfe": <number or null>,
    "mae": <number or null>
  }
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI extraction error:', response.status, errorText);
    throw new Error(`AI extraction failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content in AI response');
  }

  // Parse JSON from response (handle markdown code blocks)
  let jsonStr = content;
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  try {
    return JSON.parse(jsonStr.trim());
  } catch (e) {
    console.error('Failed to parse AI response:', content);
    throw new Error('Failed to parse extracted data');
  }
}

// Fallback regex-based extraction
function extractDataWithRegex(pdfText: string): ExtractedData {
  const data: ExtractedData = {
    summary: {
      maxDrawdownPct: null,
      recoveryFactor: null,
      profitFactor: null,
      tradesPerWeek: null,
      avgHoldTimeMinutes: null,
    },
    profitLoss: {
      grossProfit: null,
      grossLoss: null,
      dailyPnL: null,
    },
    longShort: {
      avgWin: null,
      avgLoss: null,
      longTrades: null,
      shortTrades: null,
    },
    symbols: {
      concentration: null,
    },
    risk: {
      maxConsecutiveLosses: null,
      mfe: null,
      mae: null,
    },
  };

  // Max Drawdown
  const drawdownMatch = pdfText.match(/Max\.?\s*Drawdown[:\s]*([0-9.,]+)%/i);
  if (drawdownMatch) data.summary.maxDrawdownPct = parsePercent(drawdownMatch[1]);

  // Recovery Factor
  const recoveryMatch = pdfText.match(/Recovery\s*Factor[:\s]*(-?[0-9.,]+)/i);
  if (recoveryMatch) data.summary.recoveryFactor = parseNumber(recoveryMatch[1]);

  // Profit Factor
  const profitFactorMatch = pdfText.match(/Profit\s*Factor[:\s]*([0-9.,]+)/i);
  if (profitFactorMatch) data.summary.profitFactor = parseNumber(profitFactorMatch[1]);

  // Trades per Week
  const tradesWeekMatch = pdfText.match(/Trades\s*per\s*Week[:\s]*([0-9.,]+)/i);
  if (tradesWeekMatch) data.summary.tradesPerWeek = parseNumber(tradesWeekMatch[1]);

  // Gross Profit and Loss
  const grossProfitMatch = pdfText.match(/Gross\s*Profit[:\s]*\+?([0-9.,]+)/i);
  if (grossProfitMatch) data.profitLoss.grossProfit = parseNumber(grossProfitMatch[1]);

  const grossLossMatch = pdfText.match(/Gross\s*Loss[:\s]*-?([0-9.,]+)/i);
  if (grossLossMatch) data.profitLoss.grossLoss = parseNumber(grossLossMatch[1]);

  // Long/Short trades
  const longMatch = pdfText.match(/Long[:\s]*(\d+)\s*\(([0-9.]+)%\)/i);
  if (longMatch) data.longShort.longTrades = parseInt(longMatch[1]);

  const shortMatch = pdfText.match(/Short[:\s]*(\d+)\s*\(([0-9.]+)%\)/i);
  if (shortMatch) data.longShort.shortTrades = parseInt(shortMatch[1]);

  // Average Profit/Loss
  const avgProfitMatch = pdfText.match(/Average\s*Profit[:\s]*([0-9.,]+)/i);
  if (avgProfitMatch) data.longShort.avgWin = parseNumber(avgProfitMatch[1]);

  // Max Consecutive Losses
  const maxLossesMatch = pdfText.match(/Max\.?\s*consecutive\s*losses[:\s]*(\d+)/i);
  if (maxLossesMatch) data.risk.maxConsecutiveLosses = parseInt(maxLossesMatch[1]);

  // Symbol concentration
  const symbolMatches = pdfText.matchAll(/(\w+)\s*\(\s*([0-9.]+)%\s*\)/g);
  const symbols: { symbol: string; percent: number }[] = [];
  for (const match of symbolMatches) {
    const pct = parsePercent(match[2]);
    if (pct && pct > 0) {
      symbols.push({ symbol: match[1], percent: pct });
    }
  }
  if (symbols.length > 0) data.symbols.concentration = symbols;

  return data;
}

// Calculate pillar scores
function calculatePillarScores(data: ExtractedData): PillarScores {
  const scores: PillarScores = {
    drawdownControl: 0,
    riskDiscipline: 0,
    profitQuality: 0,
    consistencyBehavior: 0,
  };

  // PILLAR 1: Drawdown Control (30 points max)
  let pillar1Metrics = 0;
  let pillar1Score = 0;
  
  // Max Drawdown Score (20 pts) - Lower is better
  if (data.summary.maxDrawdownPct !== null) {
    const dd = Math.abs(data.summary.maxDrawdownPct);
    if (dd <= 5) pillar1Score += 20;
    else if (dd <= 10) pillar1Score += 16;
    else if (dd <= 15) pillar1Score += 12;
    else if (dd <= 20) pillar1Score += 8;
    else if (dd <= 30) pillar1Score += 4;
    else pillar1Score += 0;
    pillar1Metrics++;
  }

  // Recovery Factor Score (10 pts) - Higher is better
  if (data.summary.recoveryFactor !== null) {
    const rf = data.summary.recoveryFactor;
    if (rf >= 3) pillar1Score += 10;
    else if (rf >= 2) pillar1Score += 8;
    else if (rf >= 1) pillar1Score += 6;
    else if (rf >= 0.5) pillar1Score += 3;
    else pillar1Score += 0;
    pillar1Metrics++;
  }

  // Reweight if metrics missing
  if (pillar1Metrics > 0) {
    const maxPossible = pillar1Metrics === 2 ? 30 : (data.summary.maxDrawdownPct !== null ? 20 : 10);
    scores.drawdownControl = (pillar1Score / maxPossible) * 30;
  }

  // PILLAR 2: Risk & Trade Discipline (25 points max)
  let pillar2Metrics = 0;
  let pillar2Score = 0;

  // Max Consecutive Losses (10 pts) - Lower is better
  if (data.risk.maxConsecutiveLosses !== null) {
    const mcl = data.risk.maxConsecutiveLosses;
    if (mcl <= 3) pillar2Score += 10;
    else if (mcl <= 5) pillar2Score += 8;
    else if (mcl <= 7) pillar2Score += 5;
    else if (mcl <= 10) pillar2Score += 2;
    else pillar2Score += 0;
    pillar2Metrics++;
  }

  // Trades per Week (8 pts) - Moderate is best
  if (data.summary.tradesPerWeek !== null) {
    const tpw = data.summary.tradesPerWeek;
    if (tpw >= 5 && tpw <= 20) pillar2Score += 8;
    else if (tpw >= 3 && tpw <= 30) pillar2Score += 6;
    else if (tpw >= 1 && tpw <= 50) pillar2Score += 4;
    else pillar2Score += 2;
    pillar2Metrics++;
  }

  // Holding Time (7 pts) - Skipped if null
  if (data.summary.avgHoldTimeMinutes !== null) {
    const ht = data.summary.avgHoldTimeMinutes;
    if (ht >= 60 && ht <= 1440) pillar2Score += 7; // 1hr to 24hr
    else if (ht >= 30 && ht <= 2880) pillar2Score += 5;
    else if (ht >= 10) pillar2Score += 3;
    else pillar2Score += 1;
    pillar2Metrics++;
  }

  if (pillar2Metrics > 0) {
    const maxPossible = (data.risk.maxConsecutiveLosses !== null ? 10 : 0) +
                        (data.summary.tradesPerWeek !== null ? 8 : 0) +
                        (data.summary.avgHoldTimeMinutes !== null ? 7 : 0);
    scores.riskDiscipline = maxPossible > 0 ? (pillar2Score / maxPossible) * 25 : 0;
  }

  // PILLAR 3: Profit Quality (25 points max)
  let pillar3Metrics = 0;
  let pillar3Score = 0;

  // Profit Factor (10 pts) - Higher is better
  if (data.summary.profitFactor !== null) {
    const pf = data.summary.profitFactor;
    if (pf >= 2) pillar3Score += 10;
    else if (pf >= 1.5) pillar3Score += 8;
    else if (pf >= 1.2) pillar3Score += 6;
    else if (pf >= 1) pillar3Score += 3;
    else pillar3Score += 0;
    pillar3Metrics++;
  }

  // TP Efficiency - MFE based (10 pts)
  if (data.risk.mfe !== null && data.profitLoss.grossProfit !== null) {
    const efficiency = data.risk.mfe > 0 ? (data.profitLoss.grossProfit / data.risk.mfe) : 0;
    if (efficiency >= 0.8) pillar3Score += 10;
    else if (efficiency >= 0.6) pillar3Score += 7;
    else if (efficiency >= 0.4) pillar3Score += 4;
    else pillar3Score += 1;
    pillar3Metrics++;
  }

  // Avg Win vs Avg Loss (5 pts)
  if (data.longShort.avgWin !== null && data.longShort.avgLoss !== null) {
    const avgLoss = Math.abs(data.longShort.avgLoss);
    const ratio = avgLoss > 0 ? data.longShort.avgWin / avgLoss : 0;
    if (ratio >= 2) pillar3Score += 5;
    else if (ratio >= 1.5) pillar3Score += 4;
    else if (ratio >= 1) pillar3Score += 2;
    else pillar3Score += 0;
    pillar3Metrics++;
  }

  if (pillar3Metrics > 0) {
    const maxPossible = (data.summary.profitFactor !== null ? 10 : 0) +
                        ((data.risk.mfe !== null && data.profitLoss.grossProfit !== null) ? 10 : 0) +
                        ((data.longShort.avgWin !== null && data.longShort.avgLoss !== null) ? 5 : 0);
    scores.profitQuality = maxPossible > 0 ? (pillar3Score / maxPossible) * 25 : 0;
  }

  // PILLAR 4: Consistency & Behavior (20 points max)
  let pillar4Metrics = 0;
  let pillar4Score = 0;

  // Daily PnL Stability (10 pts)
  if (data.profitLoss.dailyPnL !== null && data.profitLoss.dailyPnL.length > 1) {
    const pnl = data.profitLoss.dailyPnL;
    const mean = pnl.reduce((a, b) => a + b, 0) / pnl.length;
    const variance = pnl.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / pnl.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean !== 0 ? Math.abs(stdDev / mean) : 0; // Coefficient of variation
    
    if (cv <= 0.5) pillar4Score += 10;
    else if (cv <= 1) pillar4Score += 7;
    else if (cv <= 2) pillar4Score += 4;
    else pillar4Score += 1;
    pillar4Metrics++;
  }

  // Instrument Concentration (5 pts) - More diverse is better
  if (data.symbols.concentration !== null && data.symbols.concentration.length > 0) {
    const maxConc = Math.max(...data.symbols.concentration.map(s => s.percent));
    if (maxConc <= 30) pillar4Score += 5;
    else if (maxConc <= 50) pillar4Score += 4;
    else if (maxConc <= 70) pillar4Score += 2;
    else pillar4Score += 1;
    pillar4Metrics++;
  }

  // Directional Balance (5 pts)
  if (data.longShort.longTrades !== null && data.longShort.shortTrades !== null) {
    const total = data.longShort.longTrades + data.longShort.shortTrades;
    if (total > 0) {
      const longPct = (data.longShort.longTrades / total) * 100;
      const balance = Math.abs(50 - longPct);
      if (balance <= 10) pillar4Score += 5;
      else if (balance <= 20) pillar4Score += 4;
      else if (balance <= 30) pillar4Score += 2;
      else pillar4Score += 1;
      pillar4Metrics++;
    }
  }

  if (pillar4Metrics > 0) {
    const maxPossible = ((data.profitLoss.dailyPnL !== null && data.profitLoss.dailyPnL.length > 1) ? 10 : 0) +
                        ((data.symbols.concentration !== null && data.symbols.concentration.length > 0) ? 5 : 0) +
                        ((data.longShort.longTrades !== null && data.longShort.shortTrades !== null) ? 5 : 0);
    scores.consistencyBehavior = maxPossible > 0 ? (pillar4Score / maxPossible) * 20 : 0;
  }

  return scores;
}

// Calculate final score and grade
function calculateFinalScore(pillarScores: PillarScores): { score: number; grade: 'A' | 'B' | 'C' | 'D' } {
  const totalScore = 
    pillarScores.drawdownControl +
    pillarScores.riskDiscipline +
    pillarScores.profitQuality +
    pillarScores.consistencyBehavior;

  const score = Math.round(Math.min(100, Math.max(0, totalScore)));

  let grade: 'A' | 'B' | 'C' | 'D';
  if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 55) grade = 'C';
  else grade = 'D';

  return { score, grade };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfText, pdfBase64, jsonData } = await req.json();

    // Check if we have JSON data input
    if (jsonData) {
      console.log('Processing JSON data input...');
      
      let parsedJson: any;
      try {
        parsedJson = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      } catch (e) {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const extractedData = extractFromJson(parsedJson);
      const pillarScores = calculatePillarScores(extractedData);
      const { score, grade } = calculateFinalScore(pillarScores);

      const roundedPillarScores: PillarScores = {
        drawdownControl: Math.round(pillarScores.drawdownControl * 100) / 100,
        riskDiscipline: Math.round(pillarScores.riskDiscipline * 100) / 100,
        profitQuality: Math.round(pillarScores.profitQuality * 100) / 100,
        consistencyBehavior: Math.round(pillarScores.consistencyBehavior * 100) / 100,
      };

      console.log('JSON scoring complete:', { score, grade });

      return new Response(
        JSON.stringify({
          extractedData,
          pillarScores: roundedPillarScores,
          finalScholarScore: score,
          grade,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle PDF input
    if (!pdfText && !pdfBase64) {
      return new Response(
        JSON.stringify({ error: 'PDF text, base64 content, or JSON data required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting MT5 report parsing...');

    let extractedData: ExtractedData;
    const textToProcess = pdfText || pdfBase64;

    try {
      // Try AI extraction first
      console.log('Attempting AI-powered extraction...');
      extractedData = await extractDataWithAI(textToProcess);
      console.log('AI extraction successful');
    } catch (aiError) {
      // Fallback to regex
      console.log('AI extraction failed, using regex fallback:', aiError);
      extractedData = extractDataWithRegex(textToProcess);
      console.log('Regex extraction completed');
    }

    // Calculate scores
    const pillarScores = calculatePillarScores(extractedData);
    const { score, grade } = calculateFinalScore(pillarScores);

    // Round pillar scores for clean output
    const roundedPillarScores: PillarScores = {
      drawdownControl: Math.round(pillarScores.drawdownControl * 100) / 100,
      riskDiscipline: Math.round(pillarScores.riskDiscipline * 100) / 100,
      profitQuality: Math.round(pillarScores.profitQuality * 100) / 100,
      consistencyBehavior: Math.round(pillarScores.consistencyBehavior * 100) / 100,
    };

    const result: ScoringResult = {
      extractedData,
      pillarScores: roundedPillarScores,
      finalScholarScore: score,
      grade,
    };

    console.log('Scoring complete:', { score, grade });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
