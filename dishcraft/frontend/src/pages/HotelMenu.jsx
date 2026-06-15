import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { auth as authApi, dishes as dishApi, categories as catApi, analytics, imageUrl } from '../api/client.js'

;(function injectStyles() {
  let s = document.getElementById('hm-css')
  if (!s) { s = document.createElement('style'); s.id = 'hm-css'; document.head.appendChild(s) }
  s.textContent = `
    /* ── Section wrapper ── */
    .cf-section { margin-bottom: 400px; }

    /* ── Title ── */
    .cf-title-row {
      text-align: center; margin-bottom: 30px;
      display: flex; flex-direction: column; align-items: center; gap: 6px;
    }
    .cf-title {
      font-family: 'Barlow Condensed', serif;
      font-size: clamp(28px, 4vw, 50px);
      font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase;
      margin: 0;
    }
    .cf-title-white { color: #fff; }
    .cf-title-gold  { color: #f5a623; text-shadow: 0 0 28px rgba(245,166,35,.45); }
    .cf-count {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px; color: var(--text-3);
      text-transform: uppercase; letter-spacing: .18em;
    }

    /* ── Scene (showroom box) ── */
    .cf-scene {
      position: relative; height: 600px; border-radius: 24px;
      overflow: hidden;
      background:
        linear-gradient(rgba(0,80,160,.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,80,160,.05) 1px, transparent 1px),
        radial-gradient(ellipse at 50% 60%, #071830 0%, #020508 80%);
      background-size: 44px 44px, 44px 44px, 100% 100%;
    }
    .cf-scene::before {
      content: '';
      position: absolute; top: 0; left: 50%; transform: translateX(-50%);
      width: 260px; height: 300px;
      background: radial-gradient(ellipse at 50% 0%, rgba(0,150,255,.16) 0%, transparent 65%);
      pointer-events: none; z-index: 1;
    }
    .cf-scene::after {
      content: '';
      position: absolute; bottom: 0; left: 0; right: 0; height: 160px;
      background: linear-gradient(to top, rgba(0,40,80,.55) 0%, transparent 100%);
      pointer-events: none; z-index: 1;
    }

    /* glowing platform circle */
    .cf-platform {
      position: absolute; bottom: 90px; left: 50%; transform: translateX(-50%);
      width: 330px; height: 6px; border-radius: 50%;
      background: rgba(0,160,255,.65);
      filter: blur(14px);
      box-shadow: 0 0 55px 28px rgba(0,130,255,.4), 0 0 110px 50px rgba(0,90,200,.18);
      z-index: 2;
    }

    /* ── Perspective stage ── */
    .cf-stage {
      position: absolute; inset: 0;
      perspective: 1400px; perspective-origin: 50% 44%;
      z-index: 3;
    }

    /* ── Card shell ── */
    .cfc {
      position: absolute;
      top: 24px; left: calc(50% - 160px);
      width: 320px; height: 440px;
      transition: transform .52s cubic-bezier(.25,.8,.25,1),
                  opacity .52s ease, filter .52s ease;
    }
    .cfc-inner {
      width: 100%; height: 100%;
      background: linear-gradient(155deg, #0d1e32 0%, #060c18 100%);
      border-radius: 18px; overflow: hidden;
      display: flex; flex-direction: column;
      transition: box-shadow .52s ease;
    }

    /* name bar */
    .cfc-name {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px; letter-spacing: .22em; text-transform: uppercase;
      color: rgba(255,255,255,.85);
      padding: 14px 18px 0; flex-shrink: 0;
    }

    /* cover */
    .cfc-cover {
      flex: 1; position: relative;
      overflow: hidden; margin: 8px 12px 6px;
      border-radius: 12px;
    }
    .cfc-cover img, .cfc-cover video {
      width: 100%; height: 100%; object-fit: cover; display: block;
    }
    .cfc-cover-empty {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      font-size: 52px; opacity: .1;
      background: rgba(0,80,160,.08);
    }
    .cfc-unavail {
      position: absolute; inset: 0;
      background: rgba(0,0,0,.58);
      display: flex; align-items: center; justify-content: center;
    }
    .cfc-unavail span {
      font-family: 'JetBrains Mono', monospace; font-size: 7.5px;
      text-transform: uppercase; letter-spacing: .18em;
      color: #fff; background: rgba(220,38,38,.82);
      padding: 3px 8px; border-radius: 4px;
    }
    /* qty badge on cover */
    .cfc-qty-badge {
      position: absolute; top: 8px; right: 8px; z-index: 4;
      width: 26px; height: 26px; border-radius: 50%;
      background: linear-gradient(135deg,#f5a623,#f0c040);
      color: #000; font-family: 'JetBrains Mono', monospace;
      font-size: 10px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 3px 12px rgba(245,166,35,.6);
    }

    /* stats */
    .cfc-stats {
      display: flex; align-items: center; justify-content: center;
      gap: 12px; padding: 5px 18px 3px; flex-shrink: 0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px; color: rgba(255,255,255,.65);
    }
    .cfc-stat-div { width: 1px; height: 10px; background: rgba(255,255,255,.16); }

    /* view dish button (gold) */
    .cfc-btn-view {
      display: block; text-decoration: none;
      margin: 5px 14px 4px;
      padding: 9px 0;
      background: linear-gradient(110deg, #f5a623 0%, #f0c040 100%);
      color: #000; font-family: 'JetBrains Mono', monospace;
      font-size: 9px; font-weight: 800; letter-spacing: .22em;
      text-transform: uppercase; text-align: center;
      border-radius: 10px; flex-shrink: 0;
      transition: filter .2s, transform .15s;
    }
    .cfc-btn-view:hover { filter: brightness(1.14); transform: scaleY(1.04); }

    /* add to budget button (cyan) */
    .cfc-btn-add {
      display: block; margin: 0 14px 12px;
      padding: 9px 0; border: none; cursor: pointer;
      background: rgba(0,210,230,.12);
      border: 1px solid rgba(0,210,230,.35);
      color: #00d2e6;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px; font-weight: 800; letter-spacing: .22em;
      text-transform: uppercase; text-align: center;
      border-radius: 10px; flex-shrink: 0;
      transition: background .2s, border-color .2s, box-shadow .2s;
    }
    .cfc-btn-add:hover {
      background: rgba(0,210,230,.22);
      border-color: rgba(0,210,230,.65);
      box-shadow: 0 0 18px rgba(0,210,230,.28);
    }

    /* qty controls (center card when qty > 0) */
    .cfc-qty-row {
      display: flex; align-items: center; justify-content: center;
      gap: 12px; margin: 0 14px 12px; flex-shrink: 0;
    }
    .cfc-qty-btn {
      width: 34px; height: 34px; border-radius: 10px;
      border: 1px solid rgba(0,210,230,.4);
      background: rgba(0,210,230,.1);
      color: #00d2e6; font-size: 18px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .18s, border-color .18s, box-shadow .18s;
      flex-shrink: 0;
    }
    .cfc-qty-btn:hover {
      background: rgba(0,210,230,.24);
      border-color: rgba(0,210,230,.7);
      box-shadow: 0 0 12px rgba(0,210,230,.3);
    }
    .cfc-qty-num {
      font-family: 'JetBrains Mono', monospace; font-size: 18px;
      font-weight: 800; color: #fff; min-width: 30px; text-align: center;
    }

    /* ── Arrows ── */
    .cf-arrow {
      position: absolute; top: 50%; transform: translateY(-50%);
      width: 52px; height: 52px; border-radius: 50%;
      background: rgba(0,0,0,.75);
      border: 1px solid rgba(255,255,255,.1);
      color: rgba(255,255,255,.72); font-size: 18px; font-weight: 700;
      cursor: pointer; z-index: 20;
      display: flex; align-items: center; justify-content: center;
      transition: background .22s, border-color .22s, color .22s, box-shadow .22s;
    }
    .cf-arrow:hover {
      background: rgba(245,166,35,.18); border-color: rgba(245,166,35,.65);
      color: #f5a623; box-shadow: 0 0 22px rgba(245,166,35,.32);
    }
    .cf-arrow-l { left: 20px; }
    .cf-arrow-r { right: 20px; }

    /* ── Dots ── */
    .cf-dots {
      position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
      display: flex; align-items: center; gap: 6px; z-index: 20;
    }
    .cf-dot {
      height: 5px; border-radius: 3px; border: none; cursor: pointer; padding: 0;
      background: rgba(255,255,255,.18);
      transition: width .3s cubic-bezier(.34,1.56,.64,1), background .25s;
    }
    .cf-dot.active { background: #f5a623; }
    .cf-page-num {
      position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
      font-family: 'JetBrains Mono', monospace; font-size: 9px;
      letter-spacing: .18em; color: rgba(255,255,255,.4); z-index: 20;
    }

    /* ── Responsive wrapper ── */
    .hm-wrap { max-width: 1200px; margin: 0 auto; padding: 0 40px; }
    @media (max-width: 640px) { .hm-wrap { padding: 0 14px; } }

    /* ── Tablet ── */
    @media (min-width: 641px) and (max-width: 960px) {
      .cf-scene { height: 520px; }
      .cfc { top: 20px; left: calc(50% - 135px); width: 270px; height: 390px; }
      .cf-platform { width: 280px; bottom: 74px; }
      .cf-arrow-l { left: 14px; }
      .cf-arrow-r { right: 14px; }
    }

    /* ── Mobile ── */
    @media (max-width: 640px) {
      .cf-section { margin-bottom: 100px; }
      .cf-title { font-size: clamp(22px, 8vw, 34px); }
      .cf-scene { height: 340px; border-radius: 16px; }
      /* Edge fade hints — sits above cards, pointer-events off */
      .cf-scene .cf-edge-l,
      .cf-scene .cf-edge-r {
        position: absolute; top: 0; bottom: 0; width: 36px; z-index: 15;
        pointer-events: none;
      }
      .cf-scene .cf-edge-l { left: 0; background: linear-gradient(to right, rgba(2,5,10,.72) 0%, transparent 100%); }
      .cf-scene .cf-edge-r { right: 0; background: linear-gradient(to left, rgba(2,5,10,.72) 0%, transparent 100%); }
      .cfc { top: 14px; left: calc(50% - 88px); width: 175px; height: 240px; }
      .cfc-name { font-size: 8px; padding: 10px 10px 0; }
      .cfc-stats { font-size: 9.5px; padding: 4px 9px 2px; gap: 7px; }
      .cfc-btn-view { margin: 4px 9px 3px; padding: 8px 0; font-size: 7.5px; }
      .cfc-btn-add  { margin: 0 9px 10px; padding: 8px 0; font-size: 7.5px; }
      .cfc-qty-row  { margin: 0 9px 10px; gap: 8px; }
      .cfc-qty-btn  { width: 28px; height: 28px; font-size: 15px; }
      .cfc-qty-num  { font-size: 14px; }
      .cf-platform  { width: 185px; bottom: 38px; }
      .cf-arrow     { width: 38px; height: 38px; font-size: 14px; }
      .cf-arrow-l   { left: 8px; }
      .cf-arrow-r   { right: 8px; }
      .cf-dots      { bottom: 10px; }
      .hm-budget-bar { padding: 12px 16px; flex-wrap: wrap; gap: 8px; }
    }

    /* ── Sticky budget bar ── */
    @keyframes hm-bar-in { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
    .hm-budget-bar {
      position: fixed; bottom: 0; left: 0; right: 0;
      padding: 14px 40px;
      background: rgba(6,12,24,.94);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid rgba(245,166,35,.22);
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      z-index: 800;
      animation: hm-bar-in .38s cubic-bezier(.22,1,.36,1) both;
    }
    @media(max-width:600px) { .hm-budget-bar { padding: 12px 16px; flex-wrap: wrap; gap: 10px; } }
    .hm-budget-bar-info { display: flex; align-items: center; gap: 14px; }
    .hm-budget-count {
      background: linear-gradient(135deg,#f5a623,#f0c040);
      color: #000; font-family: 'JetBrains Mono',monospace;
      font-size: 10px; font-weight: 700;
      padding: 4px 13px; border-radius: 20px;
      box-shadow: 0 4px 14px rgba(245,166,35,.38);
    }
    .hm-budget-label {
      font-family: 'JetBrains Mono',monospace; font-size: 8px;
      text-transform: uppercase; letter-spacing: .2em;
      color: rgba(255,255,255,.38); margin-bottom: 1px;
    }
    .hm-budget-total {
      font-family: 'Barlow Condensed',serif; font-weight: 700; font-size: 22px;
      letter-spacing: 0.02em;
      background: linear-gradient(135deg,#f5a623,#f0c040);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hm-budget-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .hm-budget-clear {
      font-family: 'JetBrains Mono',monospace; font-size: 9px;
      text-transform: uppercase; letter-spacing: .16em;
      background: none; color: rgba(255,255,255,.35);
      border: 1px solid rgba(255,255,255,.12); border-radius: 10px;
      padding: 10px 16px; cursor: pointer;
      transition: border-color .18s, color .18s;
    }
    .hm-budget-clear:hover { border-color: rgba(239,68,68,.5); color: rgba(239,68,68,.8); }
    .hm-budget-view {
      font-family: 'JetBrains Mono',monospace; font-size: 10px;
      text-transform: uppercase; letter-spacing: .18em;
      background: linear-gradient(135deg,#f5a623,#f0c040);
      color: #000; border: none; border-radius: 13px;
      padding: 11px 24px; cursor: pointer;
      box-shadow: 0 6px 24px rgba(245,166,35,.38);
      transition: filter .18s, transform .18s;
    }
    .hm-budget-view:hover { filter: brightness(1.12); transform: scale(1.04); }

    /* ── Budget modal ── */
    @keyframes hm-modal-bg { from{opacity:0} to{opacity:1} }
    @keyframes hm-modal-in { from{opacity:0;transform:scale(.92) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
    .hm-modal-bg {
      position: fixed; inset: 0;
      background: rgba(2,3,10,.85);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      animation: hm-modal-bg .22s ease both;
    }
    .hm-modal {
      background: linear-gradient(155deg,#0d1e32,#060c18);
      border: 1px solid rgba(245,166,35,.22);
      border-radius: 24px; overflow: hidden;
      width: 100%; max-width: 480px; max-height: 88vh;
      display: flex; flex-direction: column;
      box-shadow: 0 32px 96px rgba(0,0,0,.9), 0 0 60px rgba(245,166,35,.06);
      animation: hm-modal-in .3s cubic-bezier(.22,1,.36,1) both;
    }
    .hm-modal-head {
      padding: 22px 24px 18px;
      border-bottom: 1px solid rgba(245,166,35,.12);
      background: linear-gradient(155deg,#0f2338,#080e1c);
      flex-shrink: 0; display: flex; align-items: center; gap: 12px;
    }
    .hm-modal-title {
      font-family: 'Barlow Condensed',serif; font-weight: 800;
      font-size: 22px; color: #fff; margin: 0; flex: 1;
    }
    .hm-modal-close {
      background: none; border: 1px solid rgba(255,255,255,.12);
      border-radius: 8px; width: 30px; height: 30px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: rgba(255,255,255,.4); font-size: 18px;
      transition: border-color .18s, color .18s; flex-shrink: 0;
    }
    .hm-modal-close:hover { border-color: rgba(239,68,68,.5); color: rgba(239,68,68,.8); }
    .hm-modal-body { overflow-y: auto; flex: 1; padding: 14px 24px; }
    .hm-modal-body::-webkit-scrollbar { width: 3px; }
    .hm-modal-body::-webkit-scrollbar-thumb { background: rgba(245,166,35,.3); border-radius: 4px; }
    .hm-modal-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 11px 0; border-bottom: 1px solid rgba(255,255,255,.05);
    }
    .hm-modal-row:last-child { border-bottom: none; }
    .hm-modal-dish { font-family:'Barlow Condensed',serif; font-weight:700; font-size:15px; color:#fff; }
    .hm-modal-sub  { font-family:'JetBrains Mono',monospace; font-size:9px; color:rgba(255,255,255,.35); margin-top:2px; }
    .hm-modal-price { font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:700; color:#f5a623; flex-shrink:0; }
    .hm-modal-qty-row { display:flex; align-items:center; gap:8px; flex-shrink:0; }
    .hm-modal-qty-btn {
      width:28px; height:28px; border-radius:8px; flex-shrink:0;
      border:1px solid rgba(245,166,35,.3); background:rgba(245,166,35,.08);
      color:#f5a623; font-size:16px; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition:background .15s, border-color .15s;
    }
    .hm-modal-qty-btn:hover { background:rgba(245,166,35,.2); border-color:rgba(245,166,35,.6); }
    .hm-modal-qty-btn.remove { border-color:rgba(239,68,68,.3); background:rgba(239,68,68,.08); color:#ef4444; }
    .hm-modal-qty-btn.remove:hover { background:rgba(239,68,68,.2); border-color:rgba(239,68,68,.6); }
    .hm-modal-qty-num {
      font-family:'JetBrains Mono',monospace; font-size:14px; font-weight:700;
      color:#fff; min-width:22px; text-align:center;
    }
    .hm-modal-foot {
      padding: 18px 24px;
      border-top: 1px solid rgba(245,166,35,.12);
      background: #060c18; flex-shrink: 0;
    }
    .hm-modal-total-row {
      display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 16px;
    }
    .hm-modal-total-lbl {
      font-family:'JetBrains Mono',monospace; font-size:9px;
      text-transform:uppercase; letter-spacing:.2em; color:rgba(255,255,255,.35);
    }
    .hm-modal-total-val {
      font-family:'Barlow Condensed',serif; font-weight:800; font-size:30px;
      background:linear-gradient(135deg,#f5a623,#f0c040);
      -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    }
    .hm-modal-note {
      font-family:'JetBrains Mono',monospace; font-size:7.5px;
      color:rgba(255,255,255,.25); text-transform:uppercase; letter-spacing:.13em; line-height:1.8;
      margin-top:14px; text-align:center;
    }

    /* ── Budget input + progress ── */
    .hm-budget-set-row {
      display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
    }
    .hm-budget-set-lbl {
      font-family:'JetBrains Mono',monospace; font-size:8.5px;
      text-transform:uppercase; letter-spacing:.18em; color:rgba(255,255,255,.35);
      white-space:nowrap; flex-shrink:0;
    }
    .hm-budget-input {
      flex:1; background:rgba(255,255,255,.06);
      border:1px solid rgba(255,255,255,.12); border-radius:10px;
      padding:9px 14px;
      font-family:'JetBrains Mono',monospace; font-size:12px; color:#fff;
      outline:none; transition:border-color .18s; width:0;
    }
    .hm-budget-input:focus { border-color:rgba(245,166,35,.5); }
    .hm-budget-input::placeholder { color:rgba(255,255,255,.2); font-size:10px; }
    .hm-progress-wrap { margin-bottom:14px; }
    .hm-progress-track {
      height:7px; border-radius:4px; background:rgba(255,255,255,.08);
      overflow:hidden; margin-bottom:7px;
    }
    .hm-progress-fill {
      height:100%; border-radius:4px;
      transition:width .45s cubic-bezier(.22,1,.36,1), background .3s;
    }
    .hm-progress-labels {
      display:flex; justify-content:space-between; align-items:baseline;
      font-family:'JetBrains Mono',monospace; font-size:8.5px;
      text-transform:uppercase; letter-spacing:.13em;
    }
    /* bar budget indicator */
    .hm-bar-budget-pill {
      display:flex; align-items:center; gap:6px;
      font-family:'JetBrains Mono',monospace; font-size:9px;
      color:rgba(255,255,255,.45);
    }
    .hm-bar-budget-dot {
      width:7px; height:7px; border-radius:50%; flex-shrink:0;
    }

    /* ── Filter bar ── */
    .hm-fb-wrap {
      /* Sticky wrapper — dropdown is absolute inside, always below the bar */
      position: sticky; top: 0; z-index: 60;
    }
    .hm-fb {
      background: rgba(5,11,22,.97);
      border-bottom: 1px solid rgba(255,255,255,.07);
      padding: 10px 60px;
      display: flex; align-items: center; gap: 10px;
      backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    }
    @media(max-width:768px) { .hm-fb { padding: 10px 20px; } }
    @media(max-width:640px) { .hm-fb { padding: 9px 12px; gap: 7px; } }
    .hm-fb-search-wrap { position: relative; flex: 1; min-width: 0; }
    .hm-fb-search {
      width: 100%; background: rgba(255,255,255,.06);
      border: 1.5px solid rgba(255,255,255,.1); border-radius: 11px;
      padding: 10px 36px 10px 40px;
      font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #fff;
      outline: none; transition: border-color .2s, background .2s; box-sizing: border-box;
    }
    /* iOS Safari: font-size < 16px causes auto-zoom on focus */
    @media(max-width:640px) {
      .hm-fb-search { font-size: 16px; padding: 9px 34px 9px 38px; }
    }
    .hm-fb-search:focus { border-color: rgba(245,166,35,.5); background: rgba(245,166,35,.03); }
    .hm-fb-search::placeholder { color: rgba(255,255,255,.2); }
    .hm-fb-sico {
      position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
      color: rgba(255,255,255,.3); font-size: 16px; pointer-events: none; line-height:1;
    }
    .hm-fb-sx {
      position: absolute; right: 9px; top: 50%; transform: translateY(-50%);
      background: rgba(255,255,255,.1); border: none; width: 22px; height: 22px;
      border-radius: 50%; cursor: pointer; color: rgba(255,255,255,.5); font-size: 15px;
      display: flex; align-items: center; justify-content: center; transition: background .18s;
    }
    .hm-fb-sx:hover { background: rgba(255,255,255,.2); color: #fff; }
    .hm-fb-btn {
      display: flex; align-items: center; gap: 6px; flex-shrink: 0;
      font-family: 'JetBrains Mono', monospace; font-size: 10px;
      text-transform: uppercase; letter-spacing: .1em;
      background: rgba(255,255,255,.06); border: 1.5px solid rgba(255,255,255,.12);
      color: rgba(255,255,255,.55); border-radius: 11px; padding: 9px 14px;
      cursor: pointer; transition: all .18s; white-space: nowrap;
    }
    @media(max-width:480px) {
      .hm-fb-btn { padding: 9px 11px; font-size: 9px; letter-spacing: .06em; gap: 5px; }
    }
    .hm-fb-btn:hover { background: rgba(255,255,255,.11); color: #fff; border-color: rgba(255,255,255,.22); }
    .hm-fb-btn.fd-open { background: rgba(245,166,35,.12); border-color: rgba(245,166,35,.45); color: #f5a623; }
    .hm-fb-btn.fd-active { border-color: rgba(245,166,35,.45); color: #f5a623; }
    .hm-fb-badge {
      background: #f5a623; color: #000; font-size: 8px; font-weight: 700;
      min-width: 17px; height: 17px; border-radius: 9px; padding: 0 5px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .hm-fb-chevron { font-size: 9px; opacity: .5; transition: transform .2s; display: inline-block; }
    .hm-fb-chevron.up { transform: rotate(180deg); }
    .hm-fb-count {
      font-family: 'JetBrains Mono', monospace; font-size: 9px;
      text-transform: uppercase; letter-spacing: .12em;
      color: rgba(255,255,255,.22); white-space: nowrap; flex-shrink: 0;
    }
    .hm-fb-count b { color: #f5a623; }
    @media(max-width:400px) { .hm-fb-count { display: none; } }

    /* ── Dropdown panel (position:absolute → always below the sticky bar) ── */
    @keyframes fdIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
    .hm-fd {
      position: absolute; top: 100%; left: 0; right: 0;
      background: rgba(5,11,22,.99);
      border-top: 2px solid rgba(245,166,35,.4);
      border-bottom: 1px solid rgba(255,255,255,.07);
      box-shadow: 0 20px 60px rgba(0,0,0,.8);
      backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px);
      padding: 24px 60px 26px;
      animation: fdIn .18s ease;
      max-height: calc(100vh - 60px); overflow-y: auto;
    }
    @media(max-width:768px) { .hm-fd { padding: 18px 20px 22px; } }
    @media(max-width:640px) { .hm-fd { padding: 14px 12px 18px; } }
    .hm-fd-groups {
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px 36px;
    }
    @media(max-width:900px) { .hm-fd-groups { grid-template-columns: 1fr 1fr; gap: 18px 24px; } }
    @media(max-width:560px) { .hm-fd-groups { grid-template-columns: 1fr; gap: 16px; } }
    .hm-fd-label {
      font-family: 'JetBrains Mono', monospace; font-size: 8px;
      text-transform: uppercase; letter-spacing: .2em;
      color: rgba(255,255,255,.3); margin-bottom: 11px;
      display: flex; align-items: center; gap: 8px;
    }
    .hm-fd-label::after { content:''; flex:1; height:1px; background:rgba(255,255,255,.07); }
    .hm-fd-pills { display: flex; flex-wrap: wrap; gap: 7px; }
    .hm-fd-pill {
      font-family: 'JetBrains Mono', monospace; font-size: 10px;
      text-transform: uppercase; letter-spacing: .08em;
      padding: 8px 16px; border-radius: 24px; cursor: pointer;
      border: 1.5px solid rgba(255,255,255,.1);
      background: rgba(255,255,255,.04); color: rgba(255,255,255,.42);
      transition: background .18s, color .18s, border-color .18s; white-space: nowrap;
    }
    @media(max-width:640px) { .hm-fd-pill { padding: 8px 14px; font-size: 9px; } }
    .hm-fd-pill:hover { background: rgba(255,255,255,.1); color: rgba(255,255,255,.9); border-color: rgba(255,255,255,.22); }
    .hm-fd-pill.fp-active { background: rgba(245,166,35,.16); border-color: rgba(245,166,35,.55); color: #f5a623; box-shadow: 0 0 0 3px rgba(245,166,35,.08); }
    .hm-fd-pill.fv-active { background: rgba(34,197,94,.13); border-color: rgba(34,197,94,.45); color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,.07); }
    .hm-fd-pill.fn-active { background: rgba(239,68,68,.11); border-color: rgba(239,68,68,.4); color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,.07); }
    .hm-fd-price { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .hm-fd-price-pre {
      font-family: 'JetBrains Mono', monospace; font-size: 9px;
      text-transform: uppercase; letter-spacing: .1em; color: rgba(255,255,255,.28); flex-shrink: 0;
    }
    .hm-fd-price-in {
      flex: 1; min-width: 70px; background: rgba(255,255,255,.055);
      border: 1.5px solid rgba(255,255,255,.1); border-radius: 10px;
      padding: 9px 12px; font-family: 'JetBrains Mono', monospace;
      font-size: 12px; color: #fff; outline: none;
      transition: border-color .2s, box-shadow .2s; -moz-appearance: textfield;
    }
    /* iOS Safari zoom prevention */
    @media(max-width:640px) { .hm-fd-price-in { font-size: 16px; } }
    .hm-fd-price-in::-webkit-outer-spin-button,
    .hm-fd-price-in::-webkit-inner-spin-button { -webkit-appearance: none; }
    .hm-fd-price-in:focus { border-color: rgba(245,166,35,.55); box-shadow: 0 0 0 4px rgba(245,166,35,.07); }
    .hm-fd-price-in::placeholder { color: rgba(255,255,255,.18); }
    .hm-fd-price-sep { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: rgba(255,255,255,.25); flex-shrink: 0; }
    .hm-fd-foot {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,.06);
    }
    @media(max-width:400px) {
      .hm-fd-foot { flex-direction: column; }
      .hm-fd-clear, .hm-fd-done { width: 100%; text-align: center; }
    }
    .hm-fd-clear {
      font-family: 'JetBrains Mono', monospace; font-size: 9px;
      text-transform: uppercase; letter-spacing: .12em;
      background: rgba(239,68,68,.1); border: 1.5px solid rgba(239,68,68,.25);
      color: rgba(239,68,68,.7); border-radius: 10px; padding: 9px 18px;
      cursor: pointer; transition: all .18s;
    }
    .hm-fd-clear:hover { background: rgba(239,68,68,.18); color: #ef4444; border-color: rgba(239,68,68,.5); }
    .hm-fd-done {
      font-family: 'JetBrains Mono', monospace; font-size: 9px;
      text-transform: uppercase; letter-spacing: .12em;
      background: rgba(245,166,35,.14); border: 1.5px solid rgba(245,166,35,.4);
      color: #f5a623; border-radius: 10px; padding: 9px 20px;
      cursor: pointer; transition: all .18s;
    }
    .hm-fd-done:hover { background: rgba(245,166,35,.24); border-color: rgba(245,166,35,.7); }

    /* ── Light mode overrides ── */
    [data-theme="light"] .hm-fb {
      background: var(--bg-2);
      border-bottom: 1px solid var(--border);
    }
    [data-theme="light"] .hm-fb-search {
      background: var(--bg-3);
      border-color: var(--border-mid);
      color: var(--text);
    }
    [data-theme="light"] .hm-fb-search::placeholder { color: var(--text-3); }
    [data-theme="light"] .hm-fb-search:focus { background: var(--bg-3); }
    [data-theme="light"] .hm-fb-sico { color: var(--text-3); }
    [data-theme="light"] .hm-fb-sx {
      background: var(--bg-4);
      color: var(--text-2);
    }
    [data-theme="light"] .hm-fb-sx:hover { background: var(--glass); color: var(--text); }
    [data-theme="light"] .hm-fb-btn {
      background: var(--bg-3);
      border-color: var(--border-mid);
      color: var(--text-2);
    }
    [data-theme="light"] .hm-fb-btn:hover { background: var(--glass); color: var(--text); border-color: var(--border-mid); }
    [data-theme="light"] .hm-fb-count { color: var(--text-3); }

    [data-theme="light"] .hm-fd {
      background: var(--bg-2);
      border-top-color: rgba(245,166,35,.4);
      border-bottom: 1px solid var(--border);
      box-shadow: 0 20px 60px rgba(0,0,0,.12);
    }
    [data-theme="light"] .hm-fd-label { color: var(--text-3); }
    [data-theme="light"] .hm-fd-label::after { background: var(--border); }
    [data-theme="light"] .hm-fd-pill {
      border-color: var(--border-mid);
      background: var(--bg-3);
      color: var(--text-2);
    }
    [data-theme="light"] .hm-fd-pill:hover { background: var(--glass); color: var(--text); border-color: var(--border-mid); }
    [data-theme="light"] .hm-fd-price-pre { color: var(--text-3); }
    [data-theme="light"] .hm-fd-price-in {
      background: var(--bg-3);
      border-color: var(--border-mid);
      color: var(--text);
    }
    [data-theme="light"] .hm-fd-price-in::placeholder { color: var(--text-3); }
    [data-theme="light"] .hm-fd-price-sep { color: var(--text-3); }
    [data-theme="light"] .hm-fd-foot { border-top-color: var(--border); }

    [data-theme="light"] .hm-budget-bar {
      background: var(--bg-2);
      border-top-color: rgba(245,166,35,.3);
    }
    [data-theme="light"] .hm-budget-label { color: var(--text-3); }
    [data-theme="light"] .hm-budget-clear {
      color: var(--text-2);
      border-color: var(--border-mid);
    }
    [data-theme="light"] .hm-bar-budget-pill { color: var(--text-2); }

    [data-theme="light"] .hm-modal {
      background: var(--bg-2);
    }
    [data-theme="light"] .hm-modal-head {
      background: var(--bg-3);
      border-bottom-color: var(--border);
    }
    [data-theme="light"] .hm-modal-title { color: var(--text); }
    [data-theme="light"] .hm-modal-close {
      border-color: var(--border-mid);
      color: var(--text-2);
    }
    [data-theme="light"] .hm-modal-row { border-bottom-color: var(--border); }
    [data-theme="light"] .hm-modal-dish { color: var(--text); }
    [data-theme="light"] .hm-modal-sub { color: var(--text-3); }
    [data-theme="light"] .hm-modal-qty-num { color: var(--text); }
    [data-theme="light"] .hm-modal-foot {
      background: var(--bg-3);
      border-top-color: var(--border);
    }
    [data-theme="light"] .hm-modal-total-lbl { color: var(--text-3); }
    [data-theme="light"] .hm-modal-note { color: var(--text-3); }

    [data-theme="light"] .hm-budget-set-lbl { color: var(--text-3); }
    [data-theme="light"] .hm-budget-input {
      background: var(--bg-3);
      border-color: var(--border-mid);
      color: var(--text);
    }
    [data-theme="light"] .hm-budget-input::placeholder { color: var(--text-3); }
    [data-theme="light"] .hm-progress-track { background: var(--bg-4); }
  `
})()

/* ── Card transform by offset ── */
function cardStyle(offset, isMobile, isTablet, winW) {
  const abs  = Math.abs(offset)
  const sign = offset >= 0 ? 1 : -1
  if (abs === 0) return {
    transform: 'translateX(0px) scale(1.0) rotateY(0deg)',
    zIndex: 10, opacity: 1, filter: 'brightness(1)',
  }
  if (isMobile) {
    // abs=1: 175px card, scale 0.87 → peek visual left aligns with center card right (~78px visible)
    if (abs === 1) {
      return {
        transform: `translateX(${sign * 164}px) scale(0.87)`,
        zIndex: 5, opacity: 0.7, filter: 'brightness(0.68)',
      }
    }
    return {
      transform: `translateX(${sign * 900}px) scale(0.4)`,
      zIndex: 0, opacity: 0, pointerEvents: 'none',
    }
  }
  if (abs === 1) return {
    transform: `translateX(${sign * (isTablet ? 240 : 285)}px) scale(0.74) rotateY(${sign * -26}deg)`,
    zIndex: 6, opacity: 1, filter: 'brightness(0.58)',
  }
  if (abs === 2) return {
    transform: `translateX(${sign * (isTablet ? 415 : 490)}px) scale(0.52) rotateY(${sign * -40}deg)`,
    zIndex: 2, opacity: 0.72, filter: 'brightness(0.4)',
  }
  return {
    transform: `translateX(${sign * 820}px) scale(0.35)`,
    zIndex: 0, opacity: 0, pointerEvents: 'none',
  }
}

/* ── Veg / Spice helpers ── */
const VEG_COLORS = { veg: '#22c55e', vegan: '#16a34a', 'non-veg': '#ef4444' }
function VegPill({ type }) {
  const color = VEG_COLORS[type] ?? VEG_COLORS['non-veg']
  const isVeg = type === 'veg' || type === 'vegan'
  return (
    <span style={{ display:'inline-flex', alignItems:'center', width:16, height:16 }}>
      <svg width="16" height="16" viewBox="0 0 20 20">
        <rect x="1" y="1" width="18" height="18" rx="3" fill="none" stroke={color} strokeWidth="2"/>
        {isVeg ? <circle cx="10" cy="10" r="5" fill={color}/> : <polygon points="10,4 17,16 3,16" fill={color}/>}
      </svg>
    </span>
  )
}
function SpiceDots({ level }) {
  const active = Math.ceil(level / 2)
  return (
    <div style={{ display:'flex', gap:1 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ fontSize:8, lineHeight:1, opacity: i < active ? 1 : 0.15 }}>🌶️</span>
      ))}
    </div>
  )
}

/* ── Single coverflow card ── */
function DishCard({ dish, offset, onSelect, qty, onQtyChange, isMobile, isTablet, winW }) {
  const isCenter = offset === 0
  const abs      = Math.abs(offset)
  const hasVideo = !!dish.video_path
  const hasPng   = !!dish.png_path
  const hasImg   = !!dish.image_path
  const rating   = dish.avg_rating ? Number(dish.avg_rating).toFixed(1) : '—'
  const price    = `LKR ${Number(dish.price).toLocaleString()}`
  const unavail  = dish.available == 0

  if (abs > 2) return null

  return (
    <div
      className="cfc"
      style={{ ...cardStyle(offset, isMobile, isTablet, winW), cursor: isCenter ? 'default' : 'pointer' }}
      onClick={!isCenter ? onSelect : undefined}
    >
      <div
        className="cfc-inner"
        style={{
          boxShadow: isCenter
            ? '0 0 0 2px #f5a623, 0 0 44px rgba(245,166,35,.55), 0 0 90px rgba(245,166,35,.22), 0 32px 80px rgba(0,0,0,.95)'
            : '0 0 0 1px rgba(255,255,255,.06), 0 20px 60px rgba(0,0,0,.7)',
        }}
      >
        {/* Name */}
        <div className="cfc-name" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>{dish.name.toUpperCase()}</span>
          {isCenter && dish.food_type && <VegPill type={dish.food_type}/>}
        </div>

        {/* Cover */}
        <div className="cfc-cover">
          {hasVideo ? (
            <video src={imageUrl(dish.video_path)} autoPlay muted loop playsInline />
          ) : hasPng ? (
            <img src={imageUrl(dish.png_path)} alt={dish.name} />
          ) : hasImg ? (
            <img src={imageUrl(dish.image_path)} alt={dish.name} />
          ) : (
            <div className="cfc-cover-empty">🍽️</div>
          )}
          {unavail && <div className="cfc-unavail"><span>Unavailable</span></div>}
          {qty > 0 && <div className="cfc-qty-badge">{qty}</div>}
        </div>

        {/* Center card controls */}
        {isCenter && (
          <>
            <div className="cfc-stats">
              <span>⭐ {rating}</span>
              <div className="cfc-stat-div"/>
              {dish.spice_level > 0 && <><SpiceDots level={dish.spice_level}/><div className="cfc-stat-div"/></>}
              <span>{price}</span>
            </div>

            <Link to={`/dish/${dish.id}`} className="cfc-btn-view">
              VIEW DISH
            </Link>

            {qty === 0 ? (
              <button className="cfc-btn-add" onClick={() => onQtyChange(dish, 1)}>
                + Add to Budget
              </button>
            ) : (
              <div className="cfc-qty-row">
                <button className="cfc-qty-btn" onClick={() => onQtyChange(dish, qty - 1)}>−</button>
                <span className="cfc-qty-num">{qty}</span>
                <button className="cfc-qty-btn" onClick={() => onQtyChange(dish, qty + 1)}>+</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ── Coverflow carousel ── */
function CategoryCarousel({ title, dishes, cart, onQtyChange }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [winW,   setWinW]   = useState(window.innerWidth)
  const touchX = useRef(null)
  const len    = dishes.length

  useEffect(() => {
    const onResize = () => setWinW(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const isMobile = winW < 640
  const isTablet = winW >= 640 && winW < 960

  useEffect(() => {
    if (len <= 1 || paused) return
    const t = setInterval(() => setActive(a => (a + 1) % len), 3800)
    return () => clearInterval(t)
  }, [len, paused])

  const prev = () => setActive(a => (a - 1 + len) % len)
  const next = () => setActive(a => (a + 1) % len)

  const onTouchStart = e => { touchX.current = e.touches[0].clientX }
  const onTouchEnd   = e => {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 40) { dx < 0 ? next() : prev() }
    touchX.current = null
  }

  const slots = [-2, -1, 0, 1, 2].map(o => {
    const idx = ((active + o) % len + len) % len
    return { dish: dishes[idx], offset: o, idx }
  })

  const showDots = len > 1 && len <= 14

  return (
    <div
      className="cf-section"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="cf-title-row">
        <h2 className="cf-title">
          <span className="cf-title-white">Our </span>
          <span className="cf-title-gold">{title}</span>
        </h2>
        <span className="cf-count">{len} {len === 1 ? 'dish' : 'dishes'}</span>
      </div>

      <div className="cf-scene" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="cf-platform" />
        {isMobile && <><div className="cf-edge-l" /><div className="cf-edge-r" /></>}

        <div className="cf-stage">
          {slots.map(({ dish, offset, idx }) => (
            <DishCard
              key={idx}
              dish={dish}
              offset={offset}
              onSelect={() => setActive(idx)}
              qty={cart[dish.id]?.qty ?? 0}
              onQtyChange={onQtyChange}
              isMobile={isMobile}
              isTablet={isTablet}
              winW={winW}
            />
          ))}
        </div>

        {len > 1 && (
          <>
            <button className="cf-arrow cf-arrow-l" onClick={prev}>‹‹</button>
            <button className="cf-arrow cf-arrow-r" onClick={next}>››</button>
          </>
        )}

        {showDots && (
          <div className="cf-dots">
            {dishes.map((_, i) => (
              <button
                key={i}
                className={`cf-dot${i === active ? ' active' : ''}`}
                style={{ width: i === active ? 22 : 5 }}
                onClick={() => setActive(i)}
              />
            ))}
          </div>
        )}
        {!showDots && len > 1 && (
          <div className="cf-page-num">{active + 1} / {len}</div>
        )}
      </div>
    </div>
  )
}

/* ── Group dishes by category ── */
function buildGroups(dishes, cats) {
  if (cats.length === 0) return dishes.length > 0 ? [{ id: 'all', name: 'All Dishes', dishes }] : []
  const catMap = new Map()
  cats.forEach(c => catMap.set(String(c.id), { ...c, dishes: [] }))
  const uncategorized = []
  dishes.forEach(d => {
    const key = String(d.category_id)
    if (d.category_id && catMap.has(key)) catMap.get(key).dishes.push(d)
    else uncategorized.push(d)
  })
  const groups = cats.map(c => catMap.get(String(c.id))).filter(g => g.dishes.length > 0)
  if (uncategorized.length > 0) groups.push({ id: 'other', name: 'Other', dishes: uncategorized })
  return groups
}

function fmt12(time) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function HotelHours({ opening, closing }) {
  const toMins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const now    = new Date()
  const cur    = now.getHours() * 60 + now.getMinutes()
  const open   = opening ? toMins(opening) : null
  const close  = closing ? toMins(closing) : null
  const isOpen = open !== null && close !== null && cur >= open && cur < close
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:18 }}>
      <span style={{
        display:'inline-flex', alignItems:'center', gap:6, padding:'5px 14px', borderRadius:20,
        background: isOpen ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.10)',
        border: `1px solid ${isOpen ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.25)'}`,
      }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background: isOpen ? '#22c55e' : '#ef4444' }} />
        <span style={{ fontFamily:'JetBrains Mono', fontSize:10, textTransform:'uppercase', letterSpacing:'0.18em', color: isOpen ? '#22c55e' : '#ef4444' }}>
          {isOpen ? 'Open now' : 'Closed'}
        </span>
      </span>
      {opening && closing && (
        <span style={{ fontFamily:'JetBrains Mono', fontSize:10, textTransform:'uppercase', letterSpacing:'0.14em', color:'var(--text-3)' }}>
          {fmt12(opening)} – {fmt12(closing)}
        </span>
      )}
    </div>
  )
}

/* ── Main page ── */
export default function HotelMenu() {
  const { token } = useParams()
  const navigate  = useNavigate()

  const [hotel,   setHotel]   = useState(null)
  const [dishes,  setDishes]  = useState([])
  const [cats,    setCats]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  /* ── Filters ── */
  const [search,      setSearch]      = useState('')
  const [activeCat,   setActiveCat]   = useState('all')
  const [foodType,    setFoodType]    = useState('all')
  const [minPrice,    setMinPrice]    = useState('')
  const [maxPrice,    setMaxPrice]    = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filterRef = useRef(null)

  useEffect(() => {
    if (!filtersOpen) return
    const handler = e => {
      if (filterRef.current && !filterRef.current.contains(e.target))
        setFiltersOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [filtersOpen])

  /* ── Budget cart ── */
  const [cart,       setCart]       = useState({})
  const [showBudget, setShowBudget] = useState(false)
  const [budget,     setBudget]     = useState('')

  const onQtyChange = useCallback((dish, qty) => {
    setCart(prev => {
      if (qty <= 0) { const n = { ...prev }; delete n[dish.id]; return n }
      return { ...prev, [dish.id]: { dish, qty } }
    })
  }, [])

  const cartItems  = Object.values(cart)
  const totalItems = cartItems.reduce((s, { qty }) => s + qty, 0)
  const total      = cartItems.reduce((s, { dish, qty }) => s + Number(dish.price) * qty, 0)

  useEffect(() => {
    Promise.all([
      authApi.hotelInfo(token),
      dishApi.list(token),
      catApi.listPublic(token),
    ])
      .then(([h, d, c]) => {
        setHotel(h.hotel)
        setDishes(d.dishes)
        setCats(c.categories)
        if (h.hotel?.id) analytics.track(h.hotel.id).catch(() => {})
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  const hasFilter = !!(search || activeCat !== 'all' || foodType !== 'all' || minPrice || maxPrice)

  const filteredDishes = dishes.filter(d => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false
    if (activeCat !== 'all' && String(d.category_id) !== String(activeCat)) return false
    if (foodType !== 'all' && d.food_type !== foodType) return false
    const p = Number(d.price)
    if (minPrice && p < Number(minPrice)) return false
    if (maxPrice && p > Number(maxPrice)) return false
    return true
  })

  const clearFilters = () => {
    setSearch(''); setActiveCat('all'); setFoodType('all'); setMinPrice(''); setMaxPrice('')
  }

  const groups    = buildGroups(filteredDishes, cats)
  const hasBanner = !!hotel?.banner_path

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.2em' }}>Loading menu…</p>
    </div>
  )

  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:48, color:'var(--bad)' }}>✕</div>
      <p style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--bad)', textTransform:'uppercase', letterSpacing:'0.2em' }}>{error}</p>
      <button className="btn btn-ghost" onClick={() => navigate('/')}>← Back</button>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'transparent', paddingBottom: totalItems > 0 ? 140 : 100, position:'relative', zIndex:1 }}>

      {/* Hero */}
      <div className="menu-hero" style={hasBanner && !hotel?.drone_footage_path ? { backgroundImage:`url(${imageUrl(hotel.banner_path)})` } : {}}>
        {/* Drone footage video background */}
        {hotel?.drone_footage_path && (
          <video
            key={hotel.drone_footage_path}
            autoPlay muted loop playsInline
            style={{
              position:'absolute', inset:0, width:'100%', height:'100%',
              objectFit:'cover', zIndex:0,
            }}
          >
            <source src={imageUrl(hotel.drone_footage_path)} />
          </video>
        )}
        <div className="menu-hero-overlay" style={{ zIndex:1 }} />
        <button className="menu-hero-back" onClick={() => navigate('/')} style={{ zIndex:2 }}>← Back</button>
        <div className="menu-hero-body" style={{ zIndex:2 }}>
          {hotel?.logo_path
            ? <img src={imageUrl(hotel.logo_path)} alt={hotel.hotel_name} className="menu-hero-logo" />
            : <div className="menu-hero-logo-fallback">{(hotel?.hotel_name || '?')[0].toUpperCase()}</div>
          }
          <h1 className="menu-hero-name">{hotel?.hotel_name}</h1>
          <div className="menu-hero-meta">
            <span>{dishes.length} dish{dishes.length === 1 ? '' : 'es'}</span>
            {cats.length > 0 && <><span style={{ opacity:.3 }}>·</span><span>{cats.length} {cats.length === 1 ? 'category' : 'categories'}</span></>}
          </div>
          {(hotel?.opening_time || hotel?.closing_time) && (
            <HotelHours opening={hotel.opening_time} closing={hotel.closing_time} />
          )}
          {groups.length > 0 && (
            <div className="menu-hero-tabs">
              {groups.map(g => <a key={g.id} href={`#cat-${g.id}`} className="menu-hero-tab">{g.name}</a>)}
            </div>
          )}
        </div>
      </div>

      {/* ── Filter bar + dropdown ── */}
      {dishes.length > 0 && (() => {
        const activeCount = [
          search, activeCat !== 'all', foodType !== 'all', minPrice, maxPrice
        ].filter(Boolean).length
        return (
          <div className="hm-fb-wrap" ref={filterRef}>
            {/* Compact sticky bar */}
            <div className="hm-fb">
              {/* Search input */}
              <div className="hm-fb-search-wrap">
                <span className="hm-fb-sico">⌕</span>
                <input
                  className="hm-fb-search"
                  placeholder="Search dishes…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button className="hm-fb-sx" onClick={() => setSearch('')}>×</button>
                )}
              </div>

              {/* Filters toggle button */}
              <button
                className={`hm-fb-btn${filtersOpen ? ' fd-open' : activeCount > 0 ? ' fd-active' : ''}`}
                onClick={() => setFiltersOpen(o => !o)}
              >
                ⚙ Filters
                {activeCount > 0 && <span className="hm-fb-badge">{activeCount}</span>}
                <span className={`hm-fb-chevron${filtersOpen ? ' up' : ''}`}>▼</span>
              </button>

              {/* Result count */}
              <div className="hm-fb-count">
                <b>{filteredDishes.length}</b> / {dishes.length}
              </div>
            </div>

            {/* Dropdown panel */}
            {filtersOpen && (
              <div className="hm-fd">
                <div className="hm-fd-groups">
                  {/* Category */}
                  {cats.length > 1 && (
                    <div>
                      <div className="hm-fd-label">Category</div>
                      <div className="hm-fd-pills">
                        <button
                          className={`hm-fd-pill${activeCat === 'all' ? ' fp-active' : ''}`}
                          onClick={() => setActiveCat('all')}
                        >All</button>
                        {cats.map(c => (
                          <button
                            key={c.id}
                            className={`hm-fd-pill${String(activeCat) === String(c.id) ? ' fp-active' : ''}`}
                            onClick={() => setActiveCat(String(activeCat) === String(c.id) ? 'all' : String(c.id))}
                          >{c.name}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Food type */}
                  <div>
                    <div className="hm-fd-label">Food Type</div>
                    <div className="hm-fd-pills">
                      {[
                        ['all',     'All'],
                        ['veg',     '● Veg'],
                        ['vegan',   '● Vegan'],
                        ['non-veg', '▲ Non-veg'],
                      ].map(([val, label]) => (
                        <button
                          key={val}
                          className={`hm-fd-pill${foodType === val
                            ? (val === 'veg' || val === 'vegan') ? ' fv-active'
                              : val === 'non-veg' ? ' fn-active' : ' fp-active'
                            : ''}`}
                          onClick={() => setFoodType(foodType === val && val !== 'all' ? 'all' : val)}
                        >{label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Price range */}
                  <div>
                    <div className="hm-fd-label">Price Range</div>
                    <div className="hm-fd-price">
                      <span className="hm-fd-price-pre">LKR</span>
                      <input
                        className="hm-fd-price-in"
                        type="number" min="0" placeholder="Min"
                        value={minPrice}
                        onChange={e => setMinPrice(e.target.value)}
                      />
                      <span className="hm-fd-price-sep">—</span>
                      <input
                        className="hm-fd-price-in"
                        type="number" min="0" placeholder="Max"
                        value={maxPrice}
                        onChange={e => setMaxPrice(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="hm-fd-foot">
                  {activeCount > 0
                    ? <button className="hm-fd-clear" onClick={clearFilters}>✕ Clear all</button>
                    : <span />
                  }
                  <button className="hm-fd-done" onClick={() => setFiltersOpen(false)}>Done ✓</button>
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* Category sections */}
      <div className="hm-wrap" style={{ paddingTop: 64 }}>
        {groups.length === 0 ? (
          <div className="empty">
            <div className="empty-mark">◌</div>
            <div className="empty-title">{hasFilter ? 'No dishes match' : 'No dishes yet'}</div>
            <div className="empty-sub">
              {hasFilter ? 'Try different filters or clear to see all dishes' : "This hotel hasn't published anything"}
            </div>
            {hasFilter && (
              <button
                className="btn btn-ghost"
                style={{ marginTop: 20, fontSize: 11, letterSpacing: '0.15em' }}
                onClick={clearFilters}
              >Clear filters</button>
            )}
          </div>
        ) : (
          groups.map(g => (
            <div key={g.id} id={`cat-${g.id}`}>
              <CategoryCarousel
                title={g.name}
                dishes={g.dishes}
                cart={cart}
                onQtyChange={onQtyChange}
              />
            </div>
          ))
        )}
      </div>

      {/* ── Sticky budget bar ── */}
      {totalItems > 0 && (() => {
        const budgetLimit = Number(budget)
        const hasBudget   = budgetLimit > 0
        const pct         = hasBudget ? Math.min((total / budgetLimit) * 100, 100) : 0
        const over        = hasBudget && total > budgetLimit
        const dotColor    = !hasBudget ? '#aaa' : pct < 75 ? '#22c55e' : pct < 100 ? '#f5a623' : '#ef4444'
        return (
          <div className="hm-budget-bar">
            <div className="hm-budget-bar-info">
              <div className="hm-budget-count">{totalItems} item{totalItems !== 1 ? 's' : ''}</div>
              <div>
                <div className="hm-budget-label">Estimated total</div>
                <div className="hm-budget-total">LKR {total.toLocaleString()}</div>
              </div>
              {hasBudget && (
                <div className="hm-bar-budget-pill">
                  <div className="hm-bar-budget-dot" style={{ background: dotColor }} />
                  <span style={{ color: over ? '#ef4444' : '#22c55e' }}>
                    {over
                      ? `Over by LKR ${(total - budgetLimit).toLocaleString()}`
                      : `LKR ${(budgetLimit - total).toLocaleString()} left`}
                  </span>
                </div>
              )}
            </div>
            <div className="hm-budget-actions">
              <button className="hm-budget-clear" onClick={() => setCart({})}>Clear</button>
              <button className="hm-budget-view"  onClick={() => setShowBudget(true)}>
                {hasBudget ? 'Budget →' : 'Set Budget →'}
              </button>
            </div>
          </div>
        )
      })()}

      {/* ── Budget modal ── */}
      {showBudget && (
        <div className="hm-modal-bg" onClick={e => e.target === e.currentTarget && setShowBudget(false)}>
          <div className="hm-modal">
            {/* Head */}
            <div className="hm-modal-head">
              {hotel?.logo_path ? (
                <div style={{ width:36, height:36, borderRadius:9, overflow:'hidden', flexShrink:0 }}>
                  <img src={imageUrl(hotel.logo_path)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                </div>
              ) : (
                <div style={{ width:36, height:36, borderRadius:9, background:'rgba(245,166,35,.15)', border:'1px solid rgba(245,166,35,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Barlow Condensed,serif', fontWeight:700, fontSize:18, color:'#f5a623', flexShrink:0 }}>
                  {hotel?.hotel_name?.[0]}
                </div>
              )}
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:8, textTransform:'uppercase', letterSpacing:'.22em', color:'rgba(255,255,255,.35)', marginBottom:2 }}>Budget summary</div>
                <div className="hm-modal-title">{hotel?.hotel_name}</div>
              </div>
              <button className="hm-modal-close" onClick={() => setShowBudget(false)}>×</button>
            </div>

            {/* Items */}
            <div className="hm-modal-body">
              {cartItems.map(({ dish, qty }) => (
                <div key={dish.id} className="hm-modal-row">
                  {/* Name + unit price */}
                  <div style={{ flex:1, minWidth:0, marginRight:10 }}>
                    <div className="hm-modal-dish">{dish.name}</div>
                    <div className="hm-modal-sub">LKR {Number(dish.price).toLocaleString()} each</div>
                  </div>

                  {/* Qty controls */}
                  <div className="hm-modal-qty-row">
                    <button
                      className={`hm-modal-qty-btn${qty === 1 ? ' remove' : ''}`}
                      onClick={() => onQtyChange(dish, qty - 1)}
                      title={qty === 1 ? 'Remove' : 'Decrease'}
                    >
                      {qty === 1 ? '×' : '−'}
                    </button>
                    <span className="hm-modal-qty-num">{qty}</span>
                    <button
                      className="hm-modal-qty-btn"
                      onClick={() => onQtyChange(dish, qty + 1)}
                      title="Increase"
                    >
                      +
                    </button>
                  </div>

                  {/* Row total */}
                  <div className="hm-modal-price" style={{ marginLeft:10 }}>
                    LKR {(Number(dish.price) * qty).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="hm-modal-foot">
              <div className="hm-modal-total-row">
                <div className="hm-modal-total-lbl">Estimated total</div>
                <div className="hm-modal-total-val">LKR {total.toLocaleString()}</div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button
                  onClick={() => setShowBudget(false)}
                  style={{ flex:1, fontFamily:'JetBrains Mono', fontSize:9.5, textTransform:'uppercase', letterSpacing:'.18em', background:'linear-gradient(135deg,#f5a623,#f0c040)', color:'#000', border:'none', borderRadius:12, padding:'13px', cursor:'pointer', transition:'filter .18s', boxShadow:'0 6px 22px rgba(245,166,35,.35)' }}
                >
                  ← Continue browsing
                </button>
                <button
                  onClick={() => { setCart({}); setShowBudget(false) }}
                  style={{ fontFamily:'JetBrains Mono', fontSize:9.5, textTransform:'uppercase', letterSpacing:'.18em', background:'none', color:'rgba(255,255,255,.3)', border:'1px solid rgba(255,255,255,.1)', borderRadius:12, padding:'13px 18px', cursor:'pointer', transition:'border-color .18s,color .18s' }}
                >
                  Clear
                </button>
              </div>
              <div className="hm-modal-note">Prices are indicative only. Final amounts may vary at the restaurant.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
