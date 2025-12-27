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

## 5. Core Capabilities (Planned)

1. **Visual Node Editor** - Drag & drop strategy builder
2. **Backtest Engine** - Historical data simulation
3. **Manipulation Detection** - Pattern recognition nodes
4. **Real-time Data Feed** - Live connection to Liquidity Nebula

---

*Bu dosya projenin anayasasıdır. Değişiklikler governance protokolüne tabidir.*
