import { jsPDF } from "jspdf";

export function generateScholarScoreSpecPDF(): void {
  const doc = new jsPDF();
  let y = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  const addPage = () => {
    doc.addPage();
    y = 20;
  };

  const checkPageBreak = (height: number) => {
    if (y + height > 270) {
      addPage();
    }
  };

  const addTitle = (text: string) => {
    checkPageBreak(15);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, y);
    y += 10;
  };

  const addSubtitle = (text: string) => {
    checkPageBreak(12);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, y);
    y += 8;
  };

  const addText = (text: string, indent = 0) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    lines.forEach((line: string) => {
      checkPageBreak(6);
      doc.text(line, margin + indent, y);
      y += 5;
    });
    y += 2;
  };

  const addCode = (text: string, indent = 0) => {
    doc.setFontSize(9);
    doc.setFont("courier", "normal");
    const lines = text.split("\n");
    lines.forEach((line) => {
      checkPageBreak(5);
      doc.text(line.substring(0, 80), margin + indent, y);
      y += 4;
    });
    y += 3;
  };

  const addBullet = (text: string) => {
    checkPageBreak(6);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, contentWidth - 10);
    doc.text("•", margin + 5, y);
    lines.forEach((line: string, i: number) => {
      doc.text(line, margin + 12, y + i * 5);
    });
    y += lines.length * 5 + 2;
  };

  // ========== TITLE PAGE ==========
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Scholar Score", pageWidth / 2, 60, { align: "center" });
  doc.text("Technical Specification", pageWidth / 2, 72, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Version 1.0", pageWidth / 2, 90, { align: "center" });
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 100, { align: "center" });

  doc.setFontSize(10);
  doc.text("Complete Technical Documentation for MT5 Trading Report Analysis", pageWidth / 2, 130, { align: "center" });

  // ========== TABLE OF CONTENTS ==========
  addPage();
  addTitle("Table of Contents");
  y += 5;
  addText("1. Overview");
  addText("2. Data Structures");
  addText("3. JSON Data Extraction Mapping");
  addText("4. Scoring Formulas");
  addText("   4.1 Pillar 1: Capital Protection (Max 30 pts)");
  addText("   4.2 Pillar 2: Trade Management (Max 25 pts)");
  addText("   4.3 Pillar 3: Profitability (Max 25 pts)");
  addText("   4.4 Pillar 4: Consistency (Max 20 pts)");
  addText("5. Final Score Calculation & Grading");
  addText("6. Pending Feature: Drawdown Velocity");
  addText("7. API Endpoint Specification");

  // ========== 1. OVERVIEW ==========
  addPage();
  addTitle("1. Overview");
  addText("The Scholar Score system analyzes MetaTrader 5 (MT5) trading reports and calculates a comprehensive performance score based on four key pillars:");
  y += 3;
  addBullet("Capital Protection (Max 30 points) - How well the trader protects their capital");
  addBullet("Trade Management (Max 25 points) - Quality of trade execution and frequency");
  addBullet("Profitability (Max 25 points) - Overall profit generation capability");
  addBullet("Consistency (Max 20 points) - Stability and balance of trading approach");
  y += 5;
  addText("The final score ranges from 0-100 with letter grades: A (85-100), B (70-84), C (55-69), D (0-54).");

  // ========== 2. DATA STRUCTURES ==========
  addPage();
  addTitle("2. Data Structures");

  addSubtitle("2.1 ExtractedData Interface");
  addText("This is the main data structure containing all extracted metrics from the trading report:");
  y += 3;
  addCode(`interface ExtractedData {
  summary: {
    maxDrawdownPct: number | null;      // Maximum drawdown percentage
    recoveryFactor: number | null;      // Net profit / Max drawdown
    profitFactor: number | null;        // Gross profit / Gross loss
    tradesPerWeek: number | null;       // Average trades per week
    avgHoldTimeMinutes: number | null;  // Average trade duration
    winRate: number | null;             // Winning trades percentage
    expectancy: number | null;          // Expected profit per trade
    sharpeRatio: number | null;         // Risk-adjusted return
    netProfit: number | null;           // Total net profit
    totalTrades: number | null;         // Total number of trades
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
    riskRewardRatio: number | null;     // avgWin / |avgLoss|
  };
  risk: {
    maxConsecutiveLosses: number | null;
    maxConsecutiveWins: number | null;
    mfe: number | null;                 // Max favorable excursion
    mae: number | null;                 // Max adverse excursion
    maeRatio: number | null;            // mae / avgWin
  };
}`);

  addPage();
  addSubtitle("2.2 PillarScores Interface");
  addCode(`interface PillarScores {
  capitalProtection: number;  // 0-30 points
  tradeManagement: number;    // 0-25 points
  profitability: number;      // 0-25 points
  consistency: number;        // 0-20 points
}`);

  y += 5;
  addSubtitle("2.3 ScoringResult Interface");
  addCode(`interface ScoringResult {
  extractedData: ExtractedData;
  pillarScores: PillarScores;
  finalScholarScore: number;         // 0-100
  grade: 'A' | 'B' | 'C' | 'D';
}`);

  // ========== 3. JSON EXTRACTION ==========
  addPage();
  addTitle("3. JSON Data Extraction Mapping");
  addText("This table shows how each ExtractedData field is populated from MetaFX/MyFXBook JSON:");
  y += 5;

  addSubtitle("3.1 Direct Mappings");
  addCode(`Field                    | JSON Path
-------------------------|--------------------------------
maxDrawdownPct           | data.gain.maxDrawdown
profitFactor             | data.gain.profitFactor
totalTrades              | data.gain.trades
grossProfit              | data.gain.grossProfit
grossLoss                | data.gain.grossLoss
largestWin               | data.gain.highestWin
largestLoss              | data.gain.highestLoss
longTrades               | data.gain.longTrades
shortTrades              | data.gain.shortTrades
avgWin                   | data.gain.avgWin
avgLoss                  | data.gain.avgLoss
maxConsecutiveWins       | data.gain.maxConsecutiveWins
maxConsecutiveLosses     | data.gain.maxConsecutiveLosses`);

  addPage();
  addSubtitle("3.2 Calculated Fields");
  y += 3;
  addText("Net Profit:");
  addCode(`netProfit = grossProfit + grossLoss
// Note: grossLoss is already negative`);
  y += 3;

  addText("Recovery Factor:");
  addCode(`if (maxDrawdownPct > 0 && deposit > 0) {
  maxDDAmount = deposit * (maxDrawdownPct / 100)
  recoveryFactor = netProfit / maxDDAmount
}`);
  y += 3;

  addText("Win Rate:");
  addCode(`if (data.gain.wonTrades && data.gain.lostTrades) {
  totalTrades = wonTrades + lostTrades
  winRate = (wonTrades / totalTrades) * 100
}`);
  y += 3;

  addText("Expectancy:");
  addCode(`// Per-trade expected profit
if (winRate && avgWin && avgLoss) {
  winProb = winRate / 100
  lossProb = 1 - winProb
  expectancy = (winProb * avgWin) + (lossProb * avgLoss)
}`);
  y += 3;

  addText("Sharpe Ratio:");
  addCode(`// From PnL array standard deviation
if (dailyPnL.length > 1) {
  mean = sum(dailyPnL) / count
  variance = sum((pnl - mean)^2) / count
  stdDev = sqrt(variance)
  sharpeRatio = mean / stdDev
}`);

  addPage();
  addText("Risk-Reward Ratio:");
  addCode(`if (avgWin && avgLoss && avgLoss !== 0) {
  riskRewardRatio = avgWin / Math.abs(avgLoss)
}`);
  y += 3;

  addText("MAE Ratio:");
  addCode(`if (mae && avgWin && avgWin > 0) {
  maeRatio = Math.abs(mae) / avgWin
}`);
  y += 3;

  addText("Profitable Days Percent:");
  addCode(`// From balance.chart - count days with positive change
positiveChanges = 0
for each consecutive day pair:
  if (balance[i+1] > balance[i]) positiveChanges++
profitableDaysPercent = (positiveChanges / totalDays) * 100`);

  // ========== 4. SCORING FORMULAS ==========
  addPage();
  addTitle("4. Scoring Formulas");
  addText("Each pillar uses specific mathematical formulas to convert raw metrics into points.");

  y += 5;
  addSubtitle("4.1 Pillar 1: Capital Protection (Max 30 points)");
  y += 3;

  addText("Component 1: Max Drawdown Score (15 points)");
  addCode(`Formula: 15 × e^(-0.1 × DD)
Where: DD = maxDrawdownPct

Example calculations:
  DD = 5%   → 15 × e^(-0.5)  = 9.10 points
  DD = 10%  → 15 × e^(-1.0)  = 5.52 points
  DD = 20%  → 15 × e^(-2.0)  = 2.03 points
  DD = 30%  → 15 × e^(-3.0)  = 0.75 points`);
  y += 3;

  addText("Component 2: Recovery Factor Score (10 points)");
  addCode(`Formula: min(RF × 3.33, 10)
Where: RF = recoveryFactor

Example calculations:
  RF = 1.0  → min(3.33, 10) = 3.33 points
  RF = 2.0  → min(6.66, 10) = 6.66 points
  RF = 3.0  → min(10.0, 10) = 10.0 points (capped)`);
  y += 3;

  addText("Component 3: MAE Control Score (5 points)");
  addCode(`Formula: 5 × (1 - min(maeRatio, 1))
Where: maeRatio = mae / avgWin

Example calculations:
  maeRatio = 0.2  → 5 × (1 - 0.2) = 4.0 points
  maeRatio = 0.5  → 5 × (1 - 0.5) = 2.5 points
  maeRatio = 1.0+ → 5 × (1 - 1.0) = 0.0 points`);

  addPage();
  addSubtitle("4.2 Pillar 2: Trade Management (Max 25 points)");
  y += 3;

  addText("Component 1: Win Rate Score (10 points)");
  addCode(`Formula: WinRate × 0.1
Where: WinRate = winRate percentage

Example calculations:
  WinRate = 50%  → 50 × 0.1 = 5.0 points
  WinRate = 70%  → 70 × 0.1 = 7.0 points
  WinRate = 100% → 100 × 0.1 = 10.0 points`);
  y += 3;

  addText("Component 2: Consecutive Loss Resilience (8 points)");
  addCode(`Formula: 8 × e^(-0.3 × max(0, MCL - 2))
Where: MCL = maxConsecutiveLosses

Example calculations:
  MCL = 2   → 8 × e^(0)    = 8.0 points (no penalty)
  MCL = 5   → 8 × e^(-0.9) = 3.25 points
  MCL = 8   → 8 × e^(-1.8) = 1.32 points
  MCL = 12  → 8 × e^(-3.0) = 0.40 points`);
  y += 3;

  addText("Component 3: Trade Frequency Score (7 points)");
  addCode(`Formula: 7 × e^(-0.02 × (TPW - 10)²)
Where: TPW = tradesPerWeek
Optimal: 10 trades/week (bell curve)

Example calculations:
  TPW = 10  → 7 × e^(0)     = 7.0 points (optimal)
  TPW = 5   → 7 × e^(-0.5)  = 4.24 points
  TPW = 20  → 7 × e^(-2.0)  = 0.95 points
  TPW = 2   → 7 × e^(-1.28) = 1.94 points`);

  addPage();
  addSubtitle("4.3 Pillar 3: Profitability (Max 25 points)");
  y += 3;

  addText("Component 1: Profit Factor Score (10 points)");
  addCode(`Formula: min((PF - 1) × 5, 10)
Where: PF = profitFactor

Example calculations:
  PF = 1.0  → min(0, 10)  = 0.0 points (breakeven)
  PF = 1.5  → min(2.5, 10) = 2.5 points
  PF = 2.0  → min(5.0, 10) = 5.0 points
  PF = 3.0+ → min(10, 10) = 10.0 points (capped)`);
  y += 3;

  addText("Component 2: Expectancy Score (8 points)");
  addCode(`Formula: min(max(Expectancy / 10, 0), 8)
Where: Expectancy = expected profit per trade

Example calculations:
  Expectancy = $20  → min(2.0, 8) = 2.0 points
  Expectancy = $50  → min(5.0, 8) = 5.0 points
  Expectancy = $80+ → min(8.0, 8) = 8.0 points (capped)
  Expectancy = -$10 → max(-1, 0)  = 0.0 points`);
  y += 3;

  addText("Component 3: Risk-Reward Ratio Score (7 points)");
  addCode(`Formula: min(RR × 3.5, 7)
Where: RR = riskRewardRatio (avgWin / |avgLoss|)

Example calculations:
  RR = 1.0  → min(3.5, 7) = 3.5 points
  RR = 1.5  → min(5.25, 7) = 5.25 points
  RR = 2.0+ → min(7.0, 7) = 7.0 points (capped)`);

  addPage();
  addSubtitle("4.4 Pillar 4: Consistency (Max 20 points)");
  y += 3;

  addText("Component 1: Sharpe Ratio Score (8 points)");
  addCode(`Formula: min(max(Sharpe × 2, 0), 8)
Where: Sharpe = sharpeRatio

Example calculations:
  Sharpe = 1.0  → min(2.0, 8) = 2.0 points
  Sharpe = 2.0  → min(4.0, 8) = 4.0 points
  Sharpe = 4.0+ → min(8.0, 8) = 8.0 points (capped)
  Sharpe = -0.5 → max(-1, 0)  = 0.0 points`);
  y += 3;

  addText("Component 2: Profitable Days Score (7 points)");
  addCode(`Formula: (ProfitableDays% / 100) × 7
Where: ProfitableDays% = percentage of profitable trading days

Example calculations:
  PD = 50%  → 0.5 × 7 = 3.5 points
  PD = 70%  → 0.7 × 7 = 4.9 points
  PD = 100% → 1.0 × 7 = 7.0 points`);
  y += 3;

  addText("Component 3: Directional Balance Score (5 points)");
  addCode(`Formula: 5 × (1 - |LongPct - 50| / 50)
Where: LongPct = (longTrades / totalTrades) × 100

Example calculations:
  LongPct = 50%  → 5 × (1 - 0/50)  = 5.0 points (perfect)
  LongPct = 60%  → 5 × (1 - 10/50) = 4.0 points
  LongPct = 80%  → 5 × (1 - 30/50) = 2.0 points
  LongPct = 100% → 5 × (1 - 50/50) = 0.0 points`);

  // ========== 5. FINAL SCORE ==========
  addPage();
  addTitle("5. Final Score Calculation & Grading");
  y += 3;

  addSubtitle("5.1 Final Score Formula");
  addCode(`finalScore = capitalProtection + tradeManagement 
         + profitability + consistency

// Ensure bounds
finalScore = Math.round(Math.min(Math.max(finalScore, 0), 100))`);
  y += 5;

  addSubtitle("5.2 Grading Thresholds");
  addCode(`Grade | Score Range | Description
------|-------------|------------------
  A   |   85 - 100  | Excellent trader
  B   |   70 - 84   | Good trader
  C   |   55 - 69   | Average trader
  D   |   0 - 54    | Needs improvement`);
  y += 5;

  addSubtitle("5.3 Complete Scoring Example");
  addText("For a trader with:");
  addCode(`maxDrawdownPct: 12%, recoveryFactor: 2.5, maeRatio: 0.3
winRate: 65%, maxConsecutiveLosses: 4, tradesPerWeek: 8
profitFactor: 1.8, expectancy: $45, riskRewardRatio: 1.6
sharpeRatio: 1.5, profitableDays: 60%, longPct: 55%`);
  y += 3;
  addText("Calculations:");
  addCode(`Capital Protection:
  DD Score: 15 × e^(-1.2) = 4.52
  RF Score: min(2.5 × 3.33, 10) = 8.33
  MAE Score: 5 × (1 - 0.3) = 3.5
  Subtotal: 16.35 / 30

Trade Management:
  WR Score: 65 × 0.1 = 6.5
  MCL Score: 8 × e^(-0.6) = 4.39
  TF Score: 7 × e^(-0.08) = 6.46
  Subtotal: 17.35 / 25

Profitability:
  PF Score: min(0.8 × 5, 10) = 4.0
  Exp Score: min(4.5, 8) = 4.5
  RR Score: min(1.6 × 3.5, 7) = 5.6
  Subtotal: 14.1 / 25

Consistency:
  Sharpe Score: min(3.0, 8) = 3.0
  PD Score: 0.6 × 7 = 4.2
  Dir Score: 5 × (1 - 5/50) = 4.5
  Subtotal: 11.7 / 20

FINAL SCORE: 16.35 + 17.35 + 14.1 + 11.7 = 59.5
GRADE: C`);

  // ========== 6. DRAWDOWN VELOCITY ==========
  addPage();
  addTitle("6. Pending Feature: Drawdown Velocity");
  addText("This feature calculates how fast the account dropped during drawdown periods. Data source: balance.chart array containing [timestamp, balance] pairs.");
  y += 5;

  addSubtitle("6.1 Data Structure");
  addCode(`interface DrawdownVelocity {
  maxVelocity: number | null;      // Worst velocity (%/day)
  avgVelocity: number | null;      // Average during DD periods
  timeToMaxDD: number | null;      // Days from peak to max DD
  velocityRating: 'controlled' | 'moderate' | 'fast' | 'crash';
  phases: Array<{
    startDate: number;             // Timestamp
    endDate: number;               // Timestamp
    startBalance: number;
    endBalance: number;
    ddPercent: number;             // % drop
    days: number;                  // Duration
    velocity: number;              // %/day
  }> | null;
}`);
  y += 5;

  addSubtitle("6.2 Velocity Calculation");
  addCode(`Algorithm:
1. Iterate through balance.chart chronologically
2. Track running peak balance
3. When balance < peak, we're in drawdown
4. When balance rises above previous peak, DD phase ends
5. For each DD phase:
   velocity = ddPercent / days`);
  y += 5;

  addSubtitle("6.3 Rating Thresholds");
  addCode(`Rating      | Velocity (%/day) | Color
------------|------------------|-------
Controlled  |      < 0.5       | Green
Moderate    |    0.5 - 2.0     | Yellow
Fast        |    2.0 - 5.0     | Orange
Crash       |      > 5.0       | Red`);

  // ========== 7. API ENDPOINT ==========
  addPage();
  addTitle("7. API Endpoint Specification");
  y += 3;

  addSubtitle("7.1 Endpoint");
  addCode(`POST /functions/v1/parse-mt5-report`);
  y += 3;

  addSubtitle("7.2 Request Body");
  addCode(`// Option 1: JSON data from MetaFX/MyFXBook
{
  "jsonData": "{...raw JSON string...}"
}

// Option 2: PDF text content
{
  "pdfText": "...extracted text from PDF..."
}`);
  y += 3;

  addSubtitle("7.3 Response");
  addCode(`{
  "extractedData": ExtractedData,
  "pillarScores": PillarScores,
  "finalScholarScore": number,
  "grade": "A" | "B" | "C" | "D"
}`);
  y += 5;

  addSubtitle("7.4 Error Response");
  addCode(`{
  "error": "Error message description"
}`);

  // Save the PDF
  doc.save("scholar-score-technical-specification.pdf");
}
