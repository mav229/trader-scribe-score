import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Type definitions for extracted data - UPDATED with new metrics
interface ExtractedData {
  summary: {
    maxDrawdownPct: number | null;
    recoveryFactor: number | null;
    profitFactor: number | null;
    tradesPerWeek: number | null;
    avgHoldTimeMinutes: number | null;
    winRate: number | null;
    expectancy: number | null;
    sharpeRatio: number | null;
    netProfit: number | null;
    totalTrades: number | null;
  };
  profitLoss: {
    grossProfit: number | null;
    grossLoss: number | null;
    dailyPnL: number[] | null;
    profitableDaysPercent: number | null;
    largestWin: number | null;
    largestLoss: number | null;
  };
  longShort: {
    avgWin: number | null;
    avgLoss: number | null;
    longTrades: number | null;
    shortTrades: number | null;
    riskRewardRatio: number | null;
  };
  risk: {
    maxConsecutiveLosses: number | null;
    maxConsecutiveWins: number | null;
    mfe: number | null;
    mae: number | null;
    maeRatio: number | null;
  };
}

// Updated pillar names
interface PillarScores {
  capitalProtection: number;
  tradeManagement: number;
  profitability: number;
  consistency: number;
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

// Extract data from structured JSON
function extractFromJson(jsonData: any): ExtractedData {
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
      winRate: null,
      expectancy: null,
      sharpeRatio: null,
      netProfit: null,
      totalTrades: null,
    },
    profitLoss: {
      grossProfit: null,
      grossLoss: null,
      dailyPnL: null,
      profitableDaysPercent: null,
      largestWin: null,
      largestLoss: null,
    },
    longShort: {
      avgWin: null,
      avgLoss: null,
      longTrades: null,
      shortTrades: null,
      riskRewardRatio: null,
    },
    risk: {
      maxConsecutiveLosses: null,
      maxConsecutiveWins: null,
      mfe: null,
      mae: null,
      maeRatio: null,
    },
  };

  // Extract Max Drawdown % from growth.drawdown
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

  // Extract Long/Short totals and calculate total trades
  if (data.longShortTotal) {
    extracted.longShort.longTrades = data.longShortTotal.long ?? null;
    extracted.longShort.shortTrades = data.longShortTotal.short ?? null;
    extracted.summary.totalTrades = (data.longShortTotal.long || 0) + (data.longShortTotal.short || 0);
  }

  // Calculate trades per week
  if (extracted.summary.totalTrades && data.balance?.chart && data.balance.chart.length > 1) {
    const firstTimestamp = data.balance.chart[0]?.x;
    const lastTimestamp = data.balance.chart[data.balance.chart.length - 1]?.x;
    if (firstTimestamp && lastTimestamp) {
      const weeks = (lastTimestamp - firstTimestamp) / (7 * 24 * 60 * 60);
      if (weeks > 0) {
        extracted.summary.tradesPerWeek = extracted.summary.totalTrades / weeks;
      }
    }
  }

  // Extract Gross Profit and Loss
  if (data.profitTotal) {
    extracted.profitLoss.grossProfit = data.profitTotal.profit ?? data.profitTotal.profit_gross ?? null;
    extracted.profitLoss.grossLoss = data.profitTotal.loss ?? data.profitTotal.loss_gross ?? null;
  }

  // Calculate Net Profit
  if (extracted.profitLoss.grossProfit !== null && extracted.profitLoss.grossLoss !== null) {
    extracted.summary.netProfit = extracted.profitLoss.grossProfit + extracted.profitLoss.grossLoss;
  }

  // Calculate Recovery Factor: |Net Profit| / Max Drawdown Amount
  if (extracted.summary.netProfit !== null && 
      extracted.summary.maxDrawdownPct !== null &&
      extracted.summary.maxDrawdownPct > 0) {
    const initialBalance = data.evaluation?.metrics?.initial_balance || data.balance?.balance || 1000;
    const drawdownAmount = (extracted.summary.maxDrawdownPct / 100) * initialBalance;
    if (drawdownAmount > 0) {
      extracted.summary.recoveryFactor = Math.abs(extracted.summary.netProfit) / drawdownAmount;
    }
  }

  // Extract Win Rate from longShortIndicators.share_profit
  if (data.longShortIndicators?.share_profit) {
    const shareProfit = data.longShortIndicators.share_profit;
    // Average of long and short win rates
    const avgWinRate = (shareProfit[0] + shareProfit[1]) / 2;
    extracted.summary.winRate = avgWinRate * 100; // Convert to percentage
  }

  // Extract Average Win/Loss from longShortIndicators
  if (data.longShortIndicators) {
    if (data.longShortIndicators.average_profit) {
      const avgProfits = data.longShortIndicators.average_profit;
      // Take the maximum positive value
      extracted.longShort.avgWin = Math.max(avgProfits[0] || 0, avgProfits[1] || 0);
    }
    if (data.longShortIndicators.average_loss) {
      const avgLosses = data.longShortIndicators.average_loss;
      // Take the minimum (most negative) value
      extracted.longShort.avgLoss = Math.min(avgLosses[0] || 0, avgLosses[1] || 0);
    }
  }

  // Calculate Risk-Reward Ratio: |Avg Win| / |Avg Loss|
  if (extracted.longShort.avgWin !== null && extracted.longShort.avgLoss !== null) {
    const avgLossAbs = Math.abs(extracted.longShort.avgLoss);
    if (avgLossAbs > 0) {
      extracted.longShort.riskRewardRatio = extracted.longShort.avgWin / avgLossAbs;
    }
  }

  // Extract Max Consecutive Wins/Losses from risksIndicators
  if (data.risksIndicators?.max_consecutive_trades) {
    const maxConsec = data.risksIndicators.max_consecutive_trades;
    extracted.risk.maxConsecutiveWins = maxConsec[0] ?? null;
    extracted.risk.maxConsecutiveLosses = maxConsec[1] ?? null;
  }

  // Extract largest win/loss from risksIndicators
  if (data.risksIndicators?.max_profit) {
    extracted.profitLoss.largestWin = data.risksIndicators.max_profit[0] ?? null;
  }
  if (data.risksIndicators?.max_loss) {
    extracted.profitLoss.largestLoss = data.risksIndicators.max_loss[0] ?? null;
  }

  // Extract Daily PnL and calculate profitable days %
  if (data.profitMoney?.profit && data.profitMoney?.loss) {
    const profits = data.profitMoney.profit;
    const losses = data.profitMoney.loss;
    const dailyPnL: number[] = [];
    let profitableDays = 0;
    
    for (let i = 0; i < Math.min(profits.length, losses.length); i++) {
      const profitVal = profits[i]?.y?.[0] || 0;
      const lossVal = losses[i]?.y?.[0] || 0;
      const daily = profitVal + lossVal;
      if (daily !== 0) {
        dailyPnL.push(daily);
        if (daily > 0) profitableDays++;
      }
    }
    
    if (dailyPnL.length > 0) {
      extracted.profitLoss.dailyPnL = dailyPnL;
      extracted.profitLoss.profitableDaysPercent = (profitableDays / dailyPnL.length) * 100;
    }
  }

  // Calculate Expectancy: (Win Rate × Avg Win) + ((1 - Win Rate) × Avg Loss)
  if (extracted.summary.winRate !== null && 
      extracted.longShort.avgWin !== null && 
      extracted.longShort.avgLoss !== null) {
    const winRateDecimal = extracted.summary.winRate / 100;
    extracted.summary.expectancy = (winRateDecimal * extracted.longShort.avgWin) + 
                                   ((1 - winRateDecimal) * extracted.longShort.avgLoss);
  }

  // Extract MFE/MAE and calculate ratio
  if (data.risksMfeMaeMoney?.chart) {
    let totalMfe = 0;
    let totalMae = 0;
    let count = 0;

    for (const chartArray of data.risksMfeMaeMoney.chart) {
      if (Array.isArray(chartArray)) {
        for (const point of chartArray) {
          if (point?.y && Array.isArray(point.y) && point.y.length >= 4) {
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
      // MAE Ratio: How much of your potential profit you lose to adverse movement
      if (totalMfe > 0) {
        extracted.risk.maeRatio = totalMae / totalMfe;
      }
    }
  }

  // Calculate Sharpe Ratio from daily PnL
  if (extracted.profitLoss.dailyPnL && extracted.profitLoss.dailyPnL.length > 1) {
    const pnl = extracted.profitLoss.dailyPnL;
    const mean = pnl.reduce((a, b) => a + b, 0) / pnl.length;
    const variance = pnl.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / pnl.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev > 0) {
      // Annualized Sharpe = (Daily Mean / Daily StdDev) × √252
      extracted.summary.sharpeRatio = (mean / stdDev) * Math.sqrt(252);
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
1. Summary: Max Drawdown %, Recovery Factor, Profit Factor, Trades per Week, Win Rate %, Net Profit, Total Trades
2. Profit & Loss: Gross Profit, Gross Loss, Largest Win, Largest Loss
3. Long & Short: Average Win, Average Loss, Long trade count, Short trade count
4. Risks: Max Consecutive Losses, Max Consecutive Wins, MFE, MAE

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
    "avgHoldTimeMinutes": <number or null>,
    "winRate": <number or null>,
    "expectancy": <number or null>,
    "sharpeRatio": <number or null>,
    "netProfit": <number or null>,
    "totalTrades": <number or null>
  },
  "profitLoss": {
    "grossProfit": <number or null>,
    "grossLoss": <number or null>,
    "dailyPnL": <array of numbers or null>,
    "profitableDaysPercent": <number or null>,
    "largestWin": <number or null>,
    "largestLoss": <number or null>
  },
  "longShort": {
    "avgWin": <number or null>,
    "avgLoss": <number or null>,
    "longTrades": <number or null>,
    "shortTrades": <number or null>,
    "riskRewardRatio": <number or null>
  },
  "risk": {
    "maxConsecutiveLosses": <number or null>,
    "maxConsecutiveWins": <number or null>,
    "mfe": <number or null>,
    "mae": <number or null>,
    "maeRatio": <number or null>
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

  const aiData = await response.json();
  const content = aiData.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content in AI response');
  }

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
      winRate: null,
      expectancy: null,
      sharpeRatio: null,
      netProfit: null,
      totalTrades: null,
    },
    profitLoss: {
      grossProfit: null,
      grossLoss: null,
      dailyPnL: null,
      profitableDaysPercent: null,
      largestWin: null,
      largestLoss: null,
    },
    longShort: {
      avgWin: null,
      avgLoss: null,
      longTrades: null,
      shortTrades: null,
      riskRewardRatio: null,
    },
    risk: {
      maxConsecutiveLosses: null,
      maxConsecutiveWins: null,
      mfe: null,
      mae: null,
      maeRatio: null,
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

  // Win Rate
  const winRateMatch = pdfText.match(/Win\s*Rate[:\s]*([0-9.,]+)%/i);
  if (winRateMatch) data.summary.winRate = parsePercent(winRateMatch[1]);

  // Gross Profit and Loss
  const grossProfitMatch = pdfText.match(/Gross\s*Profit[:\s]*\+?([0-9.,]+)/i);
  if (grossProfitMatch) data.profitLoss.grossProfit = parseNumber(grossProfitMatch[1]);

  const grossLossMatch = pdfText.match(/Gross\s*Loss[:\s]*-?([0-9.,]+)/i);
  if (grossLossMatch) data.profitLoss.grossLoss = parseNumber(grossLossMatch[1]);

  // Long/Short trades
  const longMatch = pdfText.match(/Long[:\s]*(\d+)/i);
  if (longMatch) data.longShort.longTrades = parseInt(longMatch[1]);

  const shortMatch = pdfText.match(/Short[:\s]*(\d+)/i);
  if (shortMatch) data.longShort.shortTrades = parseInt(shortMatch[1]);

  // Max Consecutive Losses
  const maxLossesMatch = pdfText.match(/Max\.?\s*consecutive\s*losses[:\s]*(\d+)/i);
  if (maxLossesMatch) data.risk.maxConsecutiveLosses = parseInt(maxLossesMatch[1]);

  const maxWinsMatch = pdfText.match(/Max\.?\s*consecutive\s*wins[:\s]*(\d+)/i);
  if (maxWinsMatch) data.risk.maxConsecutiveWins = parseInt(maxWinsMatch[1]);

  return data;
}

// ========================================
// NEW SCORING SYSTEM WITH CUSTOM FORMULAS
// ========================================

function calculatePillarScores(data: ExtractedData): PillarScores {
  const scores: PillarScores = {
    capitalProtection: 0,
    tradeManagement: 0,
    profitability: 0,
    consistency: 0,
  };

  // ========================================
  // PILLAR 1: CAPITAL PROTECTION (30 points)
  // ========================================
  // How well does the trader protect their capital from large losses?
  
  let pillar1Score = 0;
  let pillar1MaxPossible = 0;

  // 1A. Max Drawdown Score (15 pts) - Exponential Decay Formula
  // Formula: Score = 15 × e^(-0.1 × DD)
  // DD at 0% = 15 pts, DD at 10% = 5.5 pts, DD at 30% = 0.7 pts
  if (data.summary.maxDrawdownPct !== null) {
    const dd = Math.abs(data.summary.maxDrawdownPct);
    const ddScore = 15 * Math.exp(-0.1 * dd);
    pillar1Score += Math.max(0, Math.min(15, ddScore));
    pillar1MaxPossible += 15;
  }

  // 1B. Recovery Factor Score (10 pts) - Linear with cap
  // Formula: Score = min(RF × 3.33, 10)
  // RF of 0 = 0 pts, RF of 1 = 3.33 pts, RF of 3+ = 10 pts
  if (data.summary.recoveryFactor !== null) {
    const rf = Math.max(0, data.summary.recoveryFactor);
    const rfScore = Math.min(rf * 3.33, 10);
    pillar1Score += rfScore;
    pillar1MaxPossible += 10;
  }

  // 1C. MAE Control Score (5 pts) - Lower is better
  // Formula: Score = 5 × (1 - min(maeRatio, 1))
  // maeRatio of 0 = 5 pts (perfect), maeRatio of 1+ = 0 pts
  if (data.risk.maeRatio !== null) {
    const maeRatio = Math.max(0, data.risk.maeRatio);
    const maeScore = 5 * (1 - Math.min(maeRatio, 1));
    pillar1Score += Math.max(0, maeScore);
    pillar1MaxPossible += 5;
  }

  // Scale to 30 points
  if (pillar1MaxPossible > 0) {
    scores.capitalProtection = (pillar1Score / pillar1MaxPossible) * 30;
  }

  // ========================================
  // PILLAR 2: TRADE MANAGEMENT (25 points)
  // ========================================
  // How well does the trader manage individual trades?
  
  let pillar2Score = 0;
  let pillar2MaxPossible = 0;

  // 2A. Win Rate Score (10 pts) - Linear
  // Formula: Score = WR × 0.1 (where WR is percentage)
  // 50% = 5 pts, 60% = 6 pts, 70% = 7 pts, 100% = 10 pts
  if (data.summary.winRate !== null) {
    const wr = Math.max(0, Math.min(100, data.summary.winRate));
    const wrScore = wr * 0.1;
    pillar2Score += wrScore;
    pillar2MaxPossible += 10;
  }

  // 2B. Consecutive Loss Resilience (8 pts) - Exponential Penalty
  // Formula: Score = 8 × e^(-0.3 × (MCL - 2))
  // 2 losses = 8 pts, 5 losses = 3.2 pts, 8 losses = 1.3 pts
  if (data.risk.maxConsecutiveLosses !== null) {
    const mcl = Math.max(0, data.risk.maxConsecutiveLosses);
    const mclScore = 8 * Math.exp(-0.3 * Math.max(0, mcl - 2));
    pillar2Score += Math.max(0, Math.min(8, mclScore));
    pillar2MaxPossible += 8;
  }

  // 2C. Trade Frequency (7 pts) - Bell Curve (optimal 5-15 trades/week)
  // Formula: Score = 7 × e^(-0.02 × (TPW - 10)²)
  // 10 trades/week = 7 pts, 5 or 15 = 6.1 pts, 0 or 20 = 4.5 pts
  if (data.summary.tradesPerWeek !== null) {
    const tpw = Math.max(0, data.summary.tradesPerWeek);
    const tpwScore = 7 * Math.exp(-0.02 * Math.pow(tpw - 10, 2));
    pillar2Score += Math.max(0, Math.min(7, tpwScore));
    pillar2MaxPossible += 7;
  }

  // Scale to 25 points
  if (pillar2MaxPossible > 0) {
    scores.tradeManagement = (pillar2Score / pillar2MaxPossible) * 25;
  }

  // ========================================
  // PILLAR 3: PROFITABILITY (25 points)
  // ========================================
  // Is the trader actually making money efficiently?
  
  let pillar3Score = 0;
  let pillar3MaxPossible = 0;

  // 3A. Profit Factor Score (10 pts) - Linear with cap
  // Formula: Score = min((PF - 1) × 5, 10)
  // PF of 1 = 0 pts, PF of 1.5 = 2.5 pts, PF of 2 = 5 pts, PF of 3+ = 10 pts
  if (data.summary.profitFactor !== null) {
    const pf = Math.max(0, data.summary.profitFactor);
    const pfScore = Math.min((pf - 1) * 5, 10);
    pillar3Score += Math.max(0, pfScore);
    pillar3MaxPossible += 10;
  }

  // 3B. Expectancy Score (8 pts) - Based on average profit per trade
  // Formula: Score = min(max(Exp / 10, 0), 8)
  // Positive expectancy = good, higher = better
  if (data.summary.expectancy !== null) {
    const exp = data.summary.expectancy;
    // Normalize based on typical trade sizes (assume $10 is decent expectancy)
    const expScore = Math.min(Math.max(exp / 10, 0), 8);
    pillar3Score += Math.max(0, expScore);
    pillar3MaxPossible += 8;
  }

  // 3C. Risk-Reward Ratio Score (7 pts) - Linear with cap
  // Formula: Score = min(RR × 3.5, 7)
  // RR of 1 = 3.5 pts, RR of 2 = 7 pts
  if (data.longShort.riskRewardRatio !== null) {
    const rr = Math.max(0, data.longShort.riskRewardRatio);
    const rrScore = Math.min(rr * 3.5, 7);
    pillar3Score += Math.max(0, rrScore);
    pillar3MaxPossible += 7;
  }

  // Scale to 25 points
  if (pillar3MaxPossible > 0) {
    scores.profitability = (pillar3Score / pillar3MaxPossible) * 25;
  }

  // ========================================
  // PILLAR 4: CONSISTENCY (20 points)
  // ========================================
  // Is the trader consistent over time?
  
  let pillar4Score = 0;
  let pillar4MaxPossible = 0;

  // 4A. Sharpe Ratio Score (8 pts) - Linear with cap
  // Formula: Score = min(max(Sharpe × 2, 0), 8)
  // Sharpe of 0 = 0 pts, Sharpe of 1 = 2 pts, Sharpe of 2 = 4 pts, Sharpe of 4+ = 8 pts
  if (data.summary.sharpeRatio !== null) {
    const sharpe = data.summary.sharpeRatio;
    const sharpeScore = Math.min(Math.max(sharpe * 2, 0), 8);
    pillar4Score += sharpeScore;
    pillar4MaxPossible += 8;
  }

  // 4B. Profitable Days % Score (7 pts) - Linear
  // Formula: Score = (profitableDays% / 100) × 7
  // 50% = 3.5 pts, 70% = 4.9 pts, 100% = 7 pts
  if (data.profitLoss.profitableDaysPercent !== null) {
    const pd = Math.max(0, Math.min(100, data.profitLoss.profitableDaysPercent));
    const pdScore = (pd / 100) * 7;
    pillar4Score += pdScore;
    pillar4MaxPossible += 7;
  }

  // 4C. Directional Balance (5 pts) - Closer to 50/50 is better
  // Formula: Score = 5 × (1 - |longPct - 50| / 50)
  if (data.longShort.longTrades !== null && data.longShort.shortTrades !== null) {
    const total = data.longShort.longTrades + data.longShort.shortTrades;
    if (total > 0) {
      const longPct = (data.longShort.longTrades / total) * 100;
      const imbalance = Math.abs(longPct - 50) / 50;
      const balanceScore = 5 * (1 - imbalance);
      pillar4Score += Math.max(0, balanceScore);
      pillar4MaxPossible += 5;
    }
  }

  // Scale to 20 points
  if (pillar4MaxPossible > 0) {
    scores.consistency = (pillar4Score / pillar4MaxPossible) * 20;
  }

  return scores;
}

// Calculate final score and grade
function calculateFinalScore(pillarScores: PillarScores): { score: number; grade: 'A' | 'B' | 'C' | 'D' } {
  const totalScore = 
    pillarScores.capitalProtection +
    pillarScores.tradeManagement +
    pillarScores.profitability +
    pillarScores.consistency;

  const score = Math.round(Math.min(100, Math.max(0, totalScore)));

  let grade: 'A' | 'B' | 'C' | 'D';
  if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 55) grade = 'C';
  else grade = 'D';

  return { score, grade };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfText, pdfBase64, jsonData } = await req.json();

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
        capitalProtection: Math.round(pillarScores.capitalProtection * 100) / 100,
        tradeManagement: Math.round(pillarScores.tradeManagement * 100) / 100,
        profitability: Math.round(pillarScores.profitability * 100) / 100,
        consistency: Math.round(pillarScores.consistency * 100) / 100,
      };

      console.log('JSON scoring complete:', { score, grade, pillarScores: roundedPillarScores });

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
      console.log('Attempting AI-powered extraction...');
      extractedData = await extractDataWithAI(textToProcess);
      console.log('AI extraction successful');
    } catch (aiError) {
      console.log('AI extraction failed, using regex fallback:', aiError);
      extractedData = extractDataWithRegex(textToProcess);
      console.log('Regex extraction completed');
    }

    const pillarScores = calculatePillarScores(extractedData);
    const { score, grade } = calculateFinalScore(pillarScores);

    const roundedPillarScores: PillarScores = {
      capitalProtection: Math.round(pillarScores.capitalProtection * 100) / 100,
      tradeManagement: Math.round(pillarScores.tradeManagement * 100) / 100,
      profitability: Math.round(pillarScores.profitability * 100) / 100,
      consistency: Math.round(pillarScores.consistency * 100) / 100,
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
