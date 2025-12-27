# 📖 PROJECT BIBLE - Nebula Forge

> **Version:** 0.1  
> **Status:** GENESIS  
> **Last Updated:** 2025-12-27

---

## 1. Vizyon

Görsel programlama (Node-Based) ile çalışan, **kod yazmadan** backtest ve manipülasyon tespiti yapılabilen **WebGL platformu**.

---

## 2. Proje Rolü

| Attribute | Value |
|-----------|-------|
| **Role** | Data Consumer (Veri Tüketici) |
| **Data Source** | Liquidity Nebula API |
| **Relationship** | Downstream consumer of Nebula ecosystem |

> Bu platform, "Liquidity Nebula" projesinden API aracılığıyla veri çeker. Kendi veri kaynağı yoktur.

---

## 3. Görsel Dil ve Estetik

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

## 4. Mimari

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

---

## 5. Core Capabilities 

- 1. **Visual Node Editor** - Drag & drop strategy builder
- 2. **Backtest Engine** - Historical data simulation
- 3. **Manipulation Detection** - Pattern recognition nodes
- 4. **Real-time Data Feed** - Live connection to Liquidity Nebula
+ 1. ✅ **Visual Node Editor** - React Flow with custom nodes
+ 2. ✅ **Backtest Engine** - runSimulation() with NodeRegistry
+ 3. ⏳ **Manipulation Detection** - Pattern recognition (PLANNED)
+ 4. ⏳ **Real-time Data Feed** - Mock data fallback implemented

---

## 6. File Structure

src/ ├── app/ │ ├── page.tsx # Main layout (Palette | Editor | Simulation) │ └── api/system/validate/ # Health check API ├── components/ │ ├── Workbench/ │ │ ├── ForgeEditor.tsx # React Flow canvas │ │ ├── NodePalette.tsx # Node creation toolbar │ │ └── Nodes/ # Custom node components │ └── Simulation/ │ ├── SimulationPanel.tsx # Backtest runner UI │ └── TimelineCanvas.tsx # PixiJS chart ├── lib/ │ ├── engine/ │ │ ├── BacktestEngine.ts # Core simulation logic │ │ └── NodeRegistry.ts # Node type evaluators │ ├── testing/ # Mock data & test runner │ └── api/nexusClient.ts # Liquidity Nebula client └── store/ └── forgeStore.ts # Zustand state management

---

## 7. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/system/validate` | GET | System health check, runs test scenarios |

---

## 8. GitHub

- **Repository:** https://github.com/afterall1/nebula_forge_v0.1
- **Branch:** master

*Bu dosya projenin anayasasıdır. Değişiklikler governance protokolüne tabidir.*
