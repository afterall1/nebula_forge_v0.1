# 📚 NEBULA KNOWLEDGE GRAPH & CITATIONS

> **Status:** ACTIVE  
> **Version:** 1.0  
> **Created:** 2025-12-27  
> **Purpose:** Akademik literatür ↔ Kod implementasyonu eşleştirmesi

---

## 1. BACKTESTING PROTOCOLS

### 1.1 Look-Ahead Bias Prevention

| Field | Value |
|-------|-------|
| **Risk** | Gelecek verisinin geçmişe sızması |
| **Source** | "Look-Ahead Bias" - Corporate Finance Institute & Lopez de Prado |
| **Implementation** | `src/lib/engine/BacktestEngine.ts` |

**Uygulama Detayı:**
```typescript
// Döngülerde t+1 verisi kesinlikle engellendi
const prevCandles = sortedData.slice(0, i); // Sadece geçmiş veri
const currentCandle = sortedData[i];        // Şimdiki mum
// sortedData[i+1] ASLA erişilmez
```

---

### 1.2 Survivorship Bias

| Field | Value |
|-------|-------|
| **Risk** | Delist edilmiş coinlerin analiz dışı bırakılması |
| **Source** | "Survivorship Bias in Backtesting" - LuxAlgo |
| **Implementation** | `MockDataGenerator.ts` (Planlanan) |
| **Status** | ⏳ İleri aşama için ayrıldı |

**Planlanan Senaryo:**
- Delist edilmiş coin simülasyonları
- "Dead coin" portföy etkisi hesaplaması

---

### 1.3 Walk-Forward Analysis

| Field | Value |
|-------|-------|
| **Concept** | Rolling window ile out-of-sample test |
| **Source** | "The Walk Forward Optimization" - Quantreo |
| **Status** | ⏳ İleri aşama optimizasyon modülü için ayrıldı |

---

## 2. RISK METRICS (QUANT GRADE)

### 2.1 System Quality Number (SQN)

| Field | Value |
|-------|-------|
| **Source** | Van Tharp Institute & TraderSync |
| **Implementation** | `src/lib/engine/BacktestEngine.ts` → `calculateSQN()` |
| **Type Definition** | `src/lib/types/backtest.ts` → `BacktestMetrics.sqn` |

**Formül:**
```
SQN = (Average Profit / StdDev of Profits) × √(Trade Count)
```

**Yorumlama Eşikleri:**

| SQN Value | Grade | Yorum |
|-----------|-------|-------|
| < 1.6 | Poor | Sistem güvenilir değil |
| 1.6 - 2.0 | Average | Geliştirme gerekli |
| 2.0 - 2.5 | Good | Kullanılabilir sistem |
| 2.5 - 3.0 | Excellent | Profesyonel kalite |
| > 3.0 | Superb | Dikkat: Overfit riski kontrol et |
| > 7.0 | ⚠️ Holy Grail Warning | Muhtemelen hata veya overfit |

---

### 2.2 Sharpe Ratio

| Field | Value |
|-------|-------|
| **Source** | "Sharpe vs. Sortino" - CARL AI Labs |
| **Implementation** | `src/lib/engine/BacktestEngine.ts` → `calculateSharpeRatio()` |
| **Logic** | Risk-adjusted return ölçümü |

**Formül (Simplified, RF = 0):**
```
Sharpe = Average Daily Return / StdDev of Daily Returns
```

**Yorumlama:**

| Sharpe | Grade |
|--------|-------|
| < 1 | Sub-optimal |
| 1 - 2 | Good |
| 2 - 3 | Very Good |
| > 3 | Excellent |

---

### 2.3 Maximum Drawdown

| Field | Value |
|-------|-------|
| **Concept** | Equity curve'deki zirveden en büyük düşüş |
| **Implementation** | `src/lib/engine/BacktestEngine.ts` → `calculateMaxDrawdown()` |
| **Threshold** | > 30% genellikle kabul edilemez |

---

### 2.4 Profit Factor

| Field | Value |
|-------|-------|
| **Source** | Standard trading metrics |
| **Implementation** | `src/lib/engine/BacktestEngine.ts` → `calculateProfitFactor()` |

**Formül:**
```
Profit Factor = Gross Profit / Gross Loss
```

---

## 3. MARKET REGIMES & MANIPULATION

### 3.1 Volatility Regime Classification

| Field | Value |
|-------|-------|
| **Source** | "Market Regimes Explained" - LuxAlgo & Van Tharp |
| **Implementation** | `src/lib/engine/NodeRegistry.ts` → `RegimeCheck` filter |

**Mantık:**
```typescript
// ATR-based volatility regime
if (atrPercent > 2%) → "HIGH_VOLATILITY"  // Momentum strategies
if (atrPercent < 1%) → "LOW_VOLATILITY"   // Mean reversion
else → "NORMAL"
```

**Strateji Önerileri:**

| Regime | Recommended Strategy |
|--------|---------------------|
| High Volatility | Wide stops, trend-following |
| Low Volatility | Tight stops, mean reversion |
| Normal | Standard parameters |

---

### 3.2 Funding Anomaly (Short Squeeze Detection)

| Field | Value |
|-------|-------|
| **Source** | "Three models of market impact" - Baruch MFE |
| **Implementation** | `src/lib/engine/NodeRegistry.ts` → `FundingAnomaly` |

**Mantık:**
```
IF Price ↑ (>1%) AND FundingRate < 0
THEN "Short Squeeze Warning"
```

**Açıklama:** Negatif funding = Short pozisyonlar ağır basıyor. Fiyat bu durumda yükseliyorsa, short'lar kapanmaya zorlanıyor (squeeze).

---

### 3.3 Absorption Detection

| Field | Value |
|-------|-------|
| **Concept** | Büyük oyuncuların pozisyon yüklemesi |
| **Implementation** | `src/lib/engine/NodeRegistry.ts` → `Absorption` |

**Mantık:**
```
IF Price ≈ FLAT (<0.2%)
AND OpenInterest ↑ (>2%)
AND Volume/CVD HIGH
THEN "Accumulation/Distribution"
```

---

### 3.4 Smart Money Flow

| Field | Value |
|-------|-------|
| **Source** | On-chain analytics principles |
| **Implementation** | `src/lib/engine/NodeRegistry.ts` → `InflowDivergence` |

**Mantık:**
```
IF Price ↓ AND NetInflow > 0
THEN "Bullish Divergence - Smart Money Accumulating"
```

---

## 4. DATA STRUCTURES

### 4.1 UnifiedMarketData Interface

| Field | Value |
|-------|-------|
| **Location** | `src/lib/types/nexus.ts` |
| **Purpose** | Tüm piyasa verilerinin birleşik yapısı |

**CORTEX Metrikleri:**
- `openInterest` - Açık pozisyon
- `fundingRate` - Fonlama oranı
- `longShortRatio` - Trader hissiyatı
- `netInflow` - Para akışı
- `cvd` - Cumulative Volume Delta

---

## 5. REFERENCE INDEX

| Kaynak | Konu | Kullanıldığı Dosya |
|--------|------|-------------------|
| Lopez de Prado | Look-Ahead Bias, Purged CV | BacktestEngine.ts |
| Van Tharp | SQN, Market Regimes | BacktestEngine.ts, NodeRegistry.ts |
| LuxAlgo | Survivorship Bias, Regimes | MockDataGenerator.ts (Planlanan) |
| TraderSync | SQN Implementation | backtest.ts types |
| CARL AI Labs | Sharpe vs Sortino | BacktestEngine.ts |
| Baruch MFE | Market Impact Models | NodeRegistry.ts |
| Corporate Finance Institute | Look-Ahead Bias | BacktestEngine.ts |
| Quantreo | Walk-Forward Analysis | (Planlanan) |

---

*Bu dosya, sistemin bilimsel temelini ve "Neden?" sorularına verilecek referansları içerir.*
