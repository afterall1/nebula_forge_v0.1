# 📖 PROJECT BIBLE - Nebula Forge

> **Version:** 0.4  
> **Status:** LIVE-DATA-INTEGRATED  
> **Last Updated:** 2025-12-28

---

## 1. Vizyon

Görsel programlama (Node-Based) ile çalışan, **kod yazmadan** backtest ve manipülasyon tespiti yapılabilen **WebGL platformu**.

---

## 2. Core Philosophy

- Sistem, Lopez de Prado'nun **"Financial Machine Learning"** prensiplerine sadık kalır:
  - ⚠️ **No Look-Ahead Bias** - Gelecek verisi asla geçmişe sızamaz
  - 🔬 **Purged Cross-Validation** - Veri sızıntısı önlenmiş validasyon
  - 📊 **Triple Barrier Labeling** - Objektif trade çıkış stratejileri

---

## 3. Team & Roles (Deha Konseyi)

| Role | Specialty | Domain |
|------|-----------|--------|
| **Futures Market Specialist** | OI, Funding Rate, Likidite analizi | Vadeli işlem piyasa dinamikleri |
| **Manipulation Detective** | Spoofing, Layering, Squeeze tespiti | Piyasa manipülasyon desenleri |
| **Risk Architect** | SQN, Sharpe, Sortino, Tail-Risk | Risk metrikleri ve portföy analizi |

---

## 4. Proje Rolü

| Attribute | Value |
|-----------|-------|
| **Role** | Data Consumer (Veri Tüketici) |
| **Data Source** | Liquidity Nebula API |
| **Relationship** | Downstream consumer of Nebula ecosystem |

> Bu platform, "Liquidity Nebula" projesinden API aracılığıyla veri çeker. Kendi veri kaynağı yoktur.

---

## 5. Görsel Dil ve Estetik

### Design Language: **Blueprint**

- **Renk Paleti:** Teknik mavi/gri tonlar
- **Arka Plan:** Izgara (grid) pattern
- **Genel Hava:** Mühendislik arayüzü, teknik çizim estetiği
- **Inspirasyon:** Unreal Engine Blueprints, Industrial Schematics

### Visual Keywords
```
[ ] Neon accents on dark backgrounds
[ ] Grid overlay patterns
[ ] Technical font families (monospace)
[ ] Connection lines with glow effects
[ ] Node shadows with depth
```

---

## 6. Mimari

```
┌─────────────────────────────────────────────────────────┐
│                    NEBULA FORGE                         │
├─────────────────────────────────────────────────────────┤
│  Framework     │  Next.js 15 (App Router)               │
│  Node System   │  React Flow (@xyflow/react)            │
│  Graphics      │  PixiJS (v8+)                          │
│  State         │  Zustand                               │
│  Data          │  SWR                                   │
└─────────────────────────────────────────────────────────┘
```

### 6.1. Cognitive Architecture (The Cortex)

Sistemin karar mekanizması ve uzmanlık seviyesi **kalıcı hafıza dosyaları** ile korunmaktadır:

| Dosya | Amaç |
|-------|------|
| `AI_PERSONA.md` | Deha Konseyi rolleri ve operasyonel protokoller |
| `KNOWLEDGE_GRAPH.md` | Akademik literatür ↔ Kod implementasyonu eşleştirmesi |

### 6.2. Memory Architecture

Oturum arası context korunması için kalıcı hafıza yapısı:

| Klasör/Dosya | Amaç |
|--------------|------|
| `memory/` | Kalıcı proje hafızası |
| `memory/updates/` | Oturum güncellemeleri (tarih bazlı) |

**Yeni Oturum Başlatma Protokolü:**
1. Oku: [00_GOVERNANCE.md](cci:7://file:///c:/Users/PC15/Desktop/Projelerim/Nebula%20Forge%20v0.1/.antigravity/memory/00_GOVERNANCE.md:0:0-0:0)
2. Oku: [PROJECT_BIBLE.md](cci:7://file:///c:/Users/PC15/Desktop/Projelerim/Nebula%20Forge%20v0.1/.antigravity/memory/PROJECT_BIBLE.md:0:0-0:0)
3. Oku: `updates/` klasöründeki son dosya
   - ⭐ [2025-12-28_live-data-integration.md](cci:7://file:///c:/Users/PC15/Desktop/Projelerim/Nebula%20Forge%20v0.1/.antigravity/memory/updates/2025-12-28_live-data-integration.md:0:0-0:0) - Live data proxy, drag-drop, metrics grid
4. Hash doğrula: [CONTEXT_HASH.md](cci:7://file:///c:/Users/PC15/Desktop/Projelerim/Nebula%20Forge%20v0.1/.antigravity/memory/CONTEXT_HASH.md:0:0-0:0)

**Cortex Katmanı:**
- 🧠 **AI Persona:** 5 uzman rolü (Architect, Futures Specialist, Detective, Risk Architect, On-Chain Analyst)
- 📚 **Knowledge Graph:** Bilimsel referanslar ve kod implementasyonları arasındaki bağlantı haritası
- ⚙️ **Operational Mode:** Defensive Programming, Type Safety, Edge Case Handling

---

## 7. Core Capabilities 

- 1. **Visual Node Editor** - Drag & drop strategy builder
- 2. **Backtest Engine** - Historical data simulation
- 3. **Manipulation Detection** - Pattern recognition nodes
- 4. **Real-time Data Feed** - Live connection to Liquidity Nebula
+ 1. ✅ **Visual Node Editor** - React Flow with custom nodes + Drag-Drop
+ 2. ✅ **Backtest Engine** - runSimulation() with NodeRegistry
+ 3. ⏳ **Manipulation Detection** - Pattern recognition (PLANNED)
+ 4. ✅ **Real-time Data Feed** - Live proxy + Mock fallback
+ 5. ✅ **Cortex Metrics Grid** - SQN, Sharpe, MaxDD visualization

---

## 8. File Structure

src/ ├── app/ │ ├── page.tsx # Main layout (Palette | Editor | Simulation) │ └── api/system/validate/ # Health check API ├── components/ │ ├── Workbench/ │ │ ├── ForgeEditor.tsx # React Flow canvas │ │ ├── NodePalette.tsx # Node creation toolbar │ │ └── Nodes/ # Custom node components │ └── Simulation/ │ ├── SimulationPanel.tsx # Backtest runner UI │ └── TimelineCanvas.tsx # PixiJS chart ├── lib/ │ ├── engine/ │ │ ├── BacktestEngine.ts # Core simulation logic │ │ └── NodeRegistry.ts # Node type evaluators │ ├── testing/ # Mock data & test runner │ └── api/nexusClient.ts # Liquidity Nebula client └── store/ └── forgeStore.ts # Zustand state management

---

## 9. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/system/validate` | GET | System health check, runs test scenarios |
| `/api/nexus/market` | GET | Secure proxy for Liquidity Nebula market data |

---

## 10. GitHub

- **Repository:** https://github.com/afterall1/nebula_forge_v0.1
- **Branch:** master

*Bu dosya projenin anayasasıdır. Değişiklikler governance protokolüne tabidir.*
