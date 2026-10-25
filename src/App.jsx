import React, { useState, useEffect, useRef, useCallback } from "react";
import { storage } from "./lib/storage.js";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Home, MessageCircle, MapPin, CalendarDays, Users, Wallet, Image as ImageIcon,
  FileText, AlertTriangle, Send, Plus, Battery, CheckCircle2, X, ChevronRight,
  Compass, Ticket, LogOut, Clock, Utensils, Hotel, Bus, ShoppingBag, Sunrise,
  UserCircle2, Shield, Navigation2, Radio, Heart, Skull, CloudRain, Baby, Search,
  Sparkles, Loader2, Languages
} from "lucide-react";

/* ---------------------------------------------------------------
   TourLink — group pilgrimage / tour coordination companion
   Design: dawn-departure palette. Ink-indigo night fading to
   marigold sunrise — the hour every group tour actually leaves.
---------------------------------------------------------------- */

const STYLES = `
:root{
  --ink:#1B1E3D;
  --ink-soft:#2C3060;
  --sand:#F3E8D0;
  --sand-deep:#E9D9B4;
  --saffron:#E8871E;
  --saffron-deep:#C96A0C;
  --teal:#1F6F78;
  --alert:#D64545;
  --success:#3B8256;
  --line: rgba(27,30,61,0.12);
  --paper:#FFFDF8;
}
*{box-sizing:border-box;}
.tl-root{
  font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
  background:var(--ink);
  color:var(--ink);
  height:calc(100vh - 48px);
  height:calc(100dvh - 48px);
  max-height:900px;
  min-height:560px;
  max-width:480px;
  margin:0 auto;
  border-radius:22px;
  overflow:hidden;
  position:relative;
  box-shadow:0 30px 60px rgba(27,30,61,0.35);
  display:flex;
  flex-direction:column;
}
.tl-display{font-family:'Fraunces',Georgia,serif;}
.tl-mono{font-family:'IBM Plex Mono',monospace;}

/* ---- Onboarding ---- */
.tl-onboard{
  background: linear-gradient(180deg,var(--ink) 0%, var(--ink-soft) 55%, var(--saffron-deep) 130%);
  flex:1;
  overflow-y:auto;
  padding:40px 28px 28px;
  color:var(--sand);
  display:flex;
  flex-direction:column;
}
.tl-brand{display:flex;align-items:center;gap:10px;margin-bottom:36px;}
.tl-brand-mark{
  width:40px;height:40px;border-radius:11px;
  background:var(--saffron);
  display:flex;align-items:center;justify-content:center;
  color:var(--ink);
}
.tl-brand-name{font-size:20px;font-weight:700;letter-spacing:0.01em;}
.tl-brand-tag{font-size:11px;color:var(--sand-deep);opacity:0.75;letter-spacing:0.04em;text-transform:uppercase;}

.tl-hero-line{font-family:'Fraunces',serif;font-size:34px;line-height:1.12;font-weight:600;margin:6px 0 10px;}
.tl-hero-sub{font-size:14px;color:var(--sand-deep);opacity:0.85;margin-bottom:32px;line-height:1.5;}

.tl-role-row{display:flex;gap:10px;margin-bottom:20px;}
.tl-role-btn{
  flex:1;padding:14px 10px;border-radius:14px;
  border:1.5px solid rgba(243,232,208,0.25);
  background:rgba(255,255,255,0.04);
  color:var(--sand);
  font-size:13px;font-weight:600;
  cursor:pointer;transition:all .15s ease;
  text-align:left;
}
.tl-role-btn.active{
  background:var(--saffron);
  border-color:var(--saffron);
  color:var(--ink);
}
.tl-role-btn div.sub{font-weight:400;font-size:11px;opacity:0.75;margin-top:3px;}

.tl-field{margin-bottom:14px;}
.tl-field label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:var(--sand-deep);opacity:0.8;margin-bottom:6px;}
.tl-input{
  width:100%;padding:13px 14px;border-radius:12px;
  border:1.5px solid rgba(243,232,208,0.22);
  background:rgba(255,255,255,0.05);
  color:var(--sand);font-size:15px;font-family:'IBM Plex Mono',monospace;
  letter-spacing:0.03em;
}
.tl-input::placeholder{color:rgba(243,232,208,0.4);font-family:'Inter',sans-serif;}
.tl-input:focus{outline:none;border-color:var(--saffron);}

.tl-primary-btn{
  width:100%;padding:15px;border-radius:13px;border:none;
  background:var(--saffron);color:var(--ink);font-weight:700;font-size:14px;
  cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;
  transition:transform .1s;
}
.tl-primary-btn:active{transform:scale(0.98);}
.tl-primary-btn:disabled{opacity:0.4;cursor:not-allowed;}
.tl-ghost-btn{
  width:100%;padding:13px;border-radius:13px;
  background:transparent;border:1.5px solid rgba(243,232,208,0.25);
  color:var(--sand);font-weight:600;font-size:13px;cursor:pointer;margin-top:10px;
}
.tl-err{color:#F4B9B9;font-size:12px;margin-top:-6px;margin-bottom:12px;}

/* ---- Ticket / boarding-pass signature element ---- */
.tl-ticket{
  background:var(--paper);
  border-radius:16px;
  position:relative;
  display:flex;
  color:var(--ink);
  box-shadow:0 10px 24px rgba(27,30,61,0.18);
  margin:18px 0;
}
.tl-ticket-main{flex:1;padding:16px 14px;}
.tl-ticket-stub{
  width:86px;
  border-left:2px dashed rgba(27,30,61,0.22);
  padding:16px 10px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  position:relative;
}
.tl-ticket::before,.tl-ticket::after{
  content:"";position:absolute;width:16px;height:16px;background:var(--ink-soft);
  border-radius:50%;top:50%;transform:translateY(-50%);
}
.tl-ticket::before{left:calc(100% - 93px - 8px);}
.tl-ticket::after{right:calc(93px - 8px);}
.tl-ticket-label{font-size:10px;text-transform:uppercase;letter-spacing:0.08em;opacity:0.55;margin-bottom:3px;}
.tl-ticket-name{font-family:'Fraunces',serif;font-size:17px;font-weight:600;}
.tl-ticket-code{font-family:'IBM Plex Mono',monospace;font-size:22px;font-weight:700;letter-spacing:0.06em;color:var(--saffron-deep);writing-mode:vertical-rl;}

/* ---- App shell ---- */
.tl-app{background:var(--sand);flex:1;min-height:0;position:relative;display:flex;flex-direction:column;}
.tl-topbar{
  background:var(--ink);color:var(--sand);
  padding:16px 18px 14px;
  display:flex;align-items:center;justify-content:space-between;
}
.tl-topbar-tour{font-family:'Fraunces',serif;font-size:16px;font-weight:600;}
.tl-topbar-role{font-size:10px;color:var(--saffron);text-transform:uppercase;letter-spacing:0.06em;font-weight:700;}
.tl-topbar-icon{
  width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,0.08);
  display:flex;align-items:center;justify-content:center;cursor:pointer;
}

.tl-content{flex:1;min-height:0;overflow-y:auto;padding:16px 16px 90px;}
.tl-content::-webkit-scrollbar{width:0px;}

.tl-card{
  background:var(--paper);border-radius:16px;padding:16px;margin-bottom:14px;
  border:1px solid var(--line);
}
.tl-card-title{font-family:'Fraunces',serif;font-size:15px;font-weight:600;margin-bottom:10px;display:flex;align-items:center;gap:7px;}
.tl-eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:var(--saffron-deep);font-weight:700;margin-bottom:4px;}

.tl-countdown-card{
  background:linear-gradient(135deg,var(--ink) 0%, var(--ink-soft) 100%);
  color:var(--sand);border-radius:18px;padding:20px;margin-bottom:14px;position:relative;overflow:hidden;
}
.tl-countdown-card::after{
  content:"";position:absolute;right:-30px;top:-30px;width:140px;height:140px;border-radius:50%;
  background:radial-gradient(circle, rgba(232,135,30,0.35), transparent 70%);
}
.tl-countdown-num{font-family:'Fraunces',serif;font-size:38px;font-weight:600;}

.tl-sos-fab{
  position:absolute;right:16px;bottom:82px;z-index:20;
  width:60px;height:60px;border-radius:50%;
  background:var(--alert);color:white;border:none;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  box-shadow:0 8px 20px rgba(214,69,69,0.5);
  cursor:pointer;font-size:10px;font-weight:800;letter-spacing:0.04em;
  animation:tl-pulse 2.4s infinite;
}
@keyframes spin{ from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
@keyframes tl-pulse{
  0%{box-shadow:0 0 0 0 rgba(214,69,69,0.45);}
  70%{box-shadow:0 0 0 14px rgba(214,69,69,0);}
  100%{box-shadow:0 0 0 0 rgba(214,69,69,0);}
}

.tl-navbar{
  position:absolute;left:0;right:0;bottom:0;
  background:var(--paper);border-top:1px solid var(--line);
  display:flex;padding:8px 6px 10px;z-index:15;
}
.tl-navitem{
  flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;
  padding:6px 2px;border-radius:10px;cursor:pointer;color:rgba(27,30,61,0.45);
}
.tl-navitem.active{color:var(--saffron-deep);}
.tl-navitem span{font-size:9.5px;font-weight:700;letter-spacing:0.01em;}

/* chat */
.tl-msg-row{display:flex;margin-bottom:10px;}
.tl-msg-row.me{justify-content:flex-end;}
.tl-bubble{
  max-width:75%;padding:9px 12px;border-radius:14px;font-size:13.5px;line-height:1.4;
  background:white;border:1px solid var(--line);
}
.tl-msg-row.me .tl-bubble{background:var(--saffron);color:var(--ink);border:none;}
.tl-msg-sender{font-size:10px;font-weight:700;opacity:0.55;margin-bottom:2px;}
.tl-msg-time{font-size:9px;opacity:0.45;margin-top:3px;}
.tl-chat-input-row{
  display:flex;gap:8px;padding:10px 12px;background:var(--paper);
  border-top:1px solid var(--line);position:absolute;left:0;right:0;bottom:62px;
}
.tl-chat-input{
  flex:1;border-radius:20px;border:1px solid var(--line);padding:10px 14px;font-size:13.5px;background:var(--sand);
}
.tl-send-btn{
  width:38px;height:38px;border-radius:50%;background:var(--ink);color:var(--sand);
  border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;
}

/* itinerary */
.tl-day-tab{padding:7px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;}
.tl-day-tab.active{background:var(--ink);color:var(--sand);}
.tl-day-tab:not(.active){background:white;border:1px solid var(--line);color:var(--ink);}
.tl-timeline-item{display:flex;gap:12px;margin-bottom:4px;}
.tl-timeline-rail{display:flex;flex-direction:column;align-items:center;width:20px;}
.tl-timeline-dot{width:9px;height:9px;border-radius:50%;background:var(--saffron);margin-top:5px;}
.tl-timeline-line{width:1.5px;flex:1;background:var(--line);}
.tl-timeline-body{flex:1;padding-bottom:18px;}
.tl-timeline-time{font-size:11px;font-weight:700;color:var(--saffron-deep);font-family:'IBM Plex Mono',monospace;}
.tl-timeline-title{font-weight:700;font-size:14px;margin:2px 0;}
.tl-timeline-meta{font-size:12px;color:rgba(27,30,61,0.6);display:flex;align-items:center;gap:4px;}

/* map */
.tl-map{
  background:var(--ink);border-radius:16px;height:260px;position:relative;overflow:hidden;
  background-image: radial-gradient(rgba(243,232,208,0.07) 1px, transparent 1px);
  background-size:16px 16px;
}
.tl-map-pin{
  position:absolute;display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);
}
.tl-map-dot{width:26px;height:26px;border-radius:50%;background:var(--saffron);border:2.5px solid var(--paper);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:var(--ink);}
.tl-map-dot.guide{background:var(--teal);}
.tl-map-label{font-size:9px;color:var(--sand);background:rgba(0,0,0,0.35);padding:1px 5px;border-radius:6px;margin-top:3px;}
.tl-map-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:rgba(243,232,208,0.5);}

/* members / list rows */
.tl-row{display:flex;align-items:center;gap:11px;padding:10px 0;border-bottom:1px solid var(--line);}
.tl-row:last-child{border-bottom:none;}
.tl-avatar{width:38px;height:38px;border-radius:50%;background:var(--ink-soft);color:var(--sand);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;}
.tl-badge{font-size:9.5px;font-weight:800;padding:3px 8px;border-radius:20px;text-transform:uppercase;letter-spacing:0.03em;}
.tl-badge.in{background:rgba(59,130,86,0.15);color:var(--success);}
.tl-badge.out{background:rgba(214,69,69,0.12);color:var(--alert);}
.tl-badge.wait{background:rgba(232,135,30,0.15);color:var(--saffron-deep);}

/* segment control for More tab */
.tl-segment{display:flex;gap:6px;overflow-x:auto;margin-bottom:14px;}
.tl-seg-btn{padding:8px 13px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap;cursor:pointer;border:1px solid var(--line);background:white;color:var(--ink);}
.tl-seg-btn.active{background:var(--ink);color:var(--sand);border-color:var(--ink);}

/* modal */
.tl-modal-backdrop{position:absolute;inset:0;background:rgba(27,30,61,0.55);display:flex;align-items:flex-end;z-index:40;}
.tl-modal{background:var(--paper);width:100%;border-radius:20px 20px 0 0;padding:20px 18px 26px;max-height:80%;overflow-y:auto;}
.tl-modal-handle{width:36px;height:4px;background:var(--line);border-radius:4px;margin:0 auto 14px;}
.tl-emg-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:14px 0;}
.tl-emg-btn{
  display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px;border-radius:14px;
  border:1.5px solid var(--line);background:white;cursor:pointer;font-size:11.5px;font-weight:700;color:var(--ink);
}
.tl-emg-btn.active{border-color:var(--alert);background:rgba(214,69,69,0.06);color:var(--alert);}

.tl-alert-banner{
  background:rgba(214,69,69,0.1);border:1.5px solid rgba(214,69,69,0.35);border-radius:14px;
  padding:12px 14px;margin-bottom:14px;display:flex;gap:10px;align-items:flex-start;
}
.tl-empty{text-align:center;padding:30px 10px;color:rgba(27,30,61,0.45);font-size:13px;}
.tl-pill-row{display:flex;flex-wrap:wrap;gap:6px;}
.tl-pill{font-size:11px;padding:5px 10px;border-radius:20px;background:var(--sand-deep);color:var(--ink);font-weight:600;}

/* AI assistant */
.tl-ai-header{
  background:linear-gradient(135deg,var(--ink) 0%, var(--teal) 130%);
  border-radius:16px;padding:16px;color:var(--sand);margin-bottom:14px;display:flex;gap:12px;align-items:flex-start;
}
.tl-ai-msg-row{display:flex;margin-bottom:10px;gap:8px;}
.tl-ai-msg-row.user{justify-content:flex-end;}
.tl-ai-avatar{width:26px;height:26px;border-radius:8px;background:var(--teal);color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.tl-ai-bubble{max-width:80%;padding:10px 13px;border-radius:14px;font-size:13px;line-height:1.5;background:white;border:1px solid var(--line);white-space:pre-wrap;}
.tl-ai-msg-row.user .tl-ai-bubble{background:var(--ink);color:var(--sand);border:none;}
.tl-ai-chip-row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;}
.tl-ai-chip{font-size:11.5px;padding:7px 11px;border-radius:20px;background:white;border:1px solid var(--line);color:var(--ink);font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px;}
.tl-ai-chip:hover{border-color:var(--teal);}
.tl-ai-loading{display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(27,30,61,0.55);padding:4px 0;}
.tl-ai-input-row{display:flex;gap:8px;margin-top:12px;}

/* ---- header SOS, toast, strips ---- */
.tl-topbar-left{min-width:0;flex:1;}
.tl-topbar-tour{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.tl-topbar-actions{display:flex;align-items:center;gap:10px;flex-shrink:0;margin-left:10px;}
.tl-sos-btn{
  display:flex;align-items:center;gap:5px;background:var(--alert);color:#fff;border:none;border-radius:10px;
  padding:0 14px;height:34px;font-weight:800;font-size:13px;letter-spacing:0.05em;cursor:pointer;
  animation:tl-pulse 2.4s infinite;font-family:inherit;
}
.tl-sos-strip{background:var(--alert);color:#fff;font-size:12.5px;font-weight:700;padding:8px 16px;display:flex;align-items:center;gap:8px;cursor:pointer;}
.tl-toast{position:absolute;left:16px;right:16px;bottom:78px;background:var(--ink);color:var(--sand);padding:10px 14px;border-radius:12px;font-size:12.5px;z-index:30;text-align:center;}

/* ---- real map ---- */
.tl-leaflet{height:340px;border-radius:16px;overflow:hidden;border:1px solid var(--line);position:relative;z-index:0;isolation:isolate;}
.leaflet-container{font-family:'Inter',sans-serif;}
.tl-pin-wrap{background:transparent;border:none;}
.tl-pin{
  width:32px;height:32px;border-radius:50%;background:var(--saffron);border:3px solid #fff;color:var(--ink);
  font:800 11px 'Inter',sans-serif;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.35);
}
.tl-pin.guide{background:var(--teal);color:#fff;}
.tl-pin.me{outline:3px solid var(--ink);}
.tl-pin.stale{background:#9a9a9a;color:#fff;opacity:.85;}
.tl-geo-status{font-size:12px;font-weight:600;border:1.5px solid;border-radius:12px;padding:8px 12px;margin-bottom:10px;background:var(--paper);line-height:1.4;}
.tl-chip-btn{flex:1;padding:9px 10px;border-radius:10px;border:1px solid var(--line);background:var(--paper);color:var(--ink);font-weight:700;font-size:12px;cursor:pointer;font-family:inherit;}
.tl-chip-btn:disabled{opacity:.4;cursor:not-allowed;}
.tl-toggle-row{display:flex;align-items:center;gap:10px;font-size:13px;padding:6px 0;cursor:pointer;}
.tl-toggle-row input{width:18px;height:18px;accent-color:var(--saffron-deep);}
.tl-nav-link{display:inline-block;margin-top:4px;font-size:11.5px;font-weight:700;color:var(--teal);text-decoration:none;}
.tl-mini-btn{font-size:10.5px;font-weight:700;background:var(--ink);color:var(--sand);border:none;border-radius:8px;padding:5px 9px;cursor:pointer;display:inline-block;font-family:inherit;}

/* ---- inputs/buttons inside the light app area (the base styles are for the dark onboarding screen) ---- */
.tl-app .tl-input{background:var(--paper);color:var(--ink);border-color:var(--line);font-family:'Inter',sans-serif;letter-spacing:0;}
.tl-app .tl-input::placeholder{color:rgba(27,30,61,0.4);}
.tl-app .tl-field label{color:rgba(27,30,61,0.6);}
.tl-app .tl-ghost-btn{color:var(--ink);border-color:var(--line);}
 .tl-primary-btn:disabled{opacity:0.5;}
.tl-field-row{display:flex;gap:10px;}
.tl-field-row .tl-field{flex:1;min-width:0;}
.tl-call-btn{display:block;text-align:center;background:var(--alert);color:#fff;text-decoration:none;font-weight:800;font-size:14px;padding:13px;border-radius:13px;margin-top:8px;}
.tl-cal{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:12px;margin-bottom:14px;}
.tl-cal-head{display:flex;align-items:center;gap:6px;margin-bottom:10px;}
.tl-cal-head select{flex:1;min-width:0;padding:8px 6px;border-radius:10px;border:1px solid var(--line);background:#fff;font:600 13px 'Inter',sans-serif;color:var(--ink);}
.tl-cal-nav{width:34px;height:34px;border-radius:10px;border:1px solid var(--line);background:#fff;font-size:20px;cursor:pointer;color:var(--ink);line-height:1;flex-shrink:0;}
.tl-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;}
.tl-cal-wd{text-align:center;font-size:10px;font-weight:800;color:rgba(27,30,61,.45);padding:4px 0;}
.tl-cal-day{position:relative;aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;color:var(--ink);}
.tl-cal-day:hover{background:var(--sand);}
.tl-cal-day.in-trip{background:rgba(232,135,30,.16);}
.tl-cal-day.today{outline:2px solid var(--teal);outline-offset:-2px;}
.tl-cal-day.selected{background:var(--ink);color:var(--sand);}
.tl-cal-dot{position:absolute;bottom:4px;width:5px;height:5px;border-radius:50%;background:var(--saffron-deep);}
.tl-cal-day.selected .tl-cal-dot{background:var(--saffron);}

@media (max-width:520px){
  .tl-root{height:100vh;height:100dvh;max-height:none;border-radius:0;box-shadow:none;max-width:none;}
}
`;

const EMERGENCY_TYPES = [
  { id: "medical", label: "Medical", icon: Heart },
  { id: "lost", label: "Lost", icon: Compass },
  { id: "accident", label: "Accident", icon: AlertTriangle },
  { id: "police", label: "Police", icon: Shield },
  { id: "passport", label: "Passport Lost", icon: FileText },
  { id: "disaster", label: "Natural Disaster", icon: CloudRain },
  { id: "women", label: "Women Safety", icon: Users },
  { id: "child", label: "Child Missing", icon: Baby },
];

const NAV = [
  { id: "home", label: "Home", icon: Home },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "itinerary", label: "Plan", icon: CalendarDays },
  { id: "map", label: "Map", icon: MapPin },
  { id: "more", label: "More", icon: Users },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}
// Simple 4-digit joining code (1000-9999). Uniqueness is checked against the server when a tour is created.
function genCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}
function initials(name) {
  return (name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}
function timeNow() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function systemMsg(text) {
  return { id: uid(), sender: "TourLink", text, time: timeNow(), system: true };
}
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---- calendar / date helpers (always in the phone's own local time) ---- */
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const pad2 = (n) => String(n).padStart(2, "0");
function toISO(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function parseISO(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
function todayISO() { return toISO(new Date()); }
function addDaysISO(iso, n) { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); }
function daysBetween(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }
function fmtDateLong(iso) { return parseISO(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" }); }
function fmtDateShort(iso) { return parseISO(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" }); }
function relDay(iso) {
  const n = daysBetween(todayISO(), iso);
  return n === 0 ? "Today" : n === 1 ? "Tomorrow" : n === -1 ? "Yesterday" : null;
}
// The real date of a stop. Stops saved earlier with only "Day N" get their date from the trip start date.
function stopDate(it, trip) {
  if (it.date) return it.date;
  if (it.day && trip && trip.start) return addDaysISO(trip.start, it.day - 1);
  return null;
}
function stopAt(it, iso) {
  const [h, m] = String(it.time || "00:00").split(":").map(Number);
  const d = parseISO(iso);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}
function sortedStops(itinerary, trip) {
  return itinerary
    .map((it) => { const date = stopDate(it, trip); return { ...it, date, at: date ? stopAt(it, date) : null }; })
    .sort((a, b) => (a.at && b.at ? a.at - b.at : a.at ? -1 : b.at ? 1 : 0));
}
function nextStop(itinerary, trip) {
  const now = new Date();
  return sortedStops(itinerary, trip).find((s) => s.at && s.at >= now) || null;
}
function fmtUntil(at) {
  const mins = Math.round((at - new Date()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `in ${mins} min`;
  if (mins < 1440) return `in ${Math.floor(mins / 60)} h ${mins % 60} min`;
  const d = daysBetween(todayISO(), toISO(at));
  return `in ${d} day${d > 1 ? "s" : ""}`;
}
// A sensible starting currency symbol from the phone's time zone; the guide can change it per tour.
function defaultCurrency() {
  let tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { /* ignore */ }
  if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "₹";
  if (tz === "Asia/Manila") return "₱";
  if (tz === "Asia/Tokyo") return "¥";
  if (tz === "Asia/Singapore") return "S$";
  if (tz === "Asia/Bangkok") return "฿";
  if (tz === "Asia/Dubai") return "AED";
  if (tz === "Europe/London") return "£";
  if (tz.startsWith("Europe/")) return "€";
  return "$";
}

/* ---- location helpers ---- */
const STALE_MS = 5 * 60 * 1000; // no update for 5 min = shown as offline / last seen
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
function fmtDistance(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}
function fmtAgo(ts) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  return `${Math.floor(m / 60)} h ago`;
}
function walkMinutes(m) {
  return Math.max(1, Math.round(m / 80)); // ~4.8 km/h
}
function directionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}

/* ---- storage helpers ---- */
// storeGet/storeSet never throw (used by background polling).
async function storeGet(key, shared) {
  try {
    const r = await storage.get(key, shared);
    return r ? JSON.parse(r.value) : null;
  } catch (e) {
    return null;
  }
}
async function storeSet(key, value, shared) {
  try {
    await storage.set(key, JSON.stringify(value), shared);
  } catch (e) {
    console.error("storage set failed", e);
  }
}
// Strict versions throw when the server can't be reached, so we never overwrite data by mistake.
async function storeGetStrict(key, shared) {
  const r = await storage.get(key, shared);
  return r ? JSON.parse(r.value) : null;
}
async function storeSetStrict(key, value, shared) {
  await storage.set(key, JSON.stringify(value), shared);
}
async function storeListValues(prefix) {
  try {
    const items = await storage.listValues(prefix);
    const out = {};
    for (const it of items) {
      try {
        out[it.key.split(":").slice(3).join(":")] = JSON.parse(it.value);
      } catch (e) { /* skip bad row */ }
    }
    return out;
  } catch (e) {
    return null;
  }
}

const ITEM_ICON = { bus: Bus, meal: Utensils, hotel: Hotel, sight: Sunrise };
const CURRENCIES = ["₹", "$", "€", "£", "¥", "₱", "S$", "฿", "AED", "RM", "Rp"];
const MOCK_NAMES = ["Priya Sharma", "Rahul Verma", "Ananya Iyer", "Vikram Rao", "Fatima Khan", "Joseph Thomas", "Meera Nair", "Arjun Pillai", "Divya Krishnan", "Sanjay Reddy"];
const SAMPLE_ITINERARY = [
  { day: 1, time: "09:00", title: "Arrival & hotel check-in", location: "Hotel", notes: "Sample stop - edit or remove", type: "hotel" },
  { day: 1, time: "14:00", title: "City walking tour", location: "Meeting point", notes: "Meet in the hotel lobby", type: "sight" },
  { day: 1, time: "19:00", title: "Group dinner", location: "Restaurant (to be confirmed)", notes: "", type: "meal" },
  { day: 2, time: "08:30", title: "Bus departure", location: "Hotel lobby", notes: "Please be on time", type: "bus" },
  { day: 2, time: "10:30", title: "Museum visit", location: "Main entrance", notes: "", type: "sight" },
];

export default function TourLinkApp() {
  const [stage, setStage] = useState("loading"); // loading | onboard | app
  const [loadingMsg, setLoadingMsg] = useState("Loading TourLink…");
  const [role, setRole] = useState("member");
  const [name, setName] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [tourName, setTourName] = useState("");
  const [tripStart, setTripStart] = useState("");
  const [tripEnd, setTripEnd] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [tour, setTour] = useState(null); // {code, name, guideName}
  const [me, setMe] = useState(null); // {id, name, role}
  const [tab, setTab] = useState("home");

  const [members, setMembers] = useState([]);
  const [chat, setChat] = useState([]);
  const [itinerary, setItinerary] = useState([]);
  const [sos, setSos] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [currency, setCurrencyState] = useState(defaultCurrency);
  const [tripDates, setTripDatesState] = useState({ start: "", end: "", emergency: "" });
  const [showSosModal, setShowSosModal] = useState(false);
  const [attendanceSession, setAttendanceSession] = useState({ active: false, stopTitle: "", startTimestamp: null });
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  // live location
  const [locations, setLocations] = useState({}); // memberId -> {lat,lng,acc,ts,battery}
  const [myPos, setMyPos] = useState(null);
  const [sharing, setSharing] = useState(true);
  const [geoStatus, setGeoStatus] = useState("idle"); // idle | asking | on | off | denied | unavailable | error
  const [keepAwake, setKeepAwake] = useState(false);
  const [mapFocus, setMapFocus] = useState(null);

  const myPosRef = useRef(null);
  const lastWriteRef = useRef({ ts: 0, lat: null, lng: null });
  const batteryRef = useRef(null);
  const pullingRef = useRef(false);
  const seenSosRef = useRef(null);
  const toastTimer = useRef(null);

  function showToast(msg) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4000);
  }

  // ---- restore local session ----
  useEffect(() => {
    (async () => {
      const pref = await storeGet("tl-sharing", false);
      if (pref === false) setSharing(false);
      const session = await storeGet("tl-session", false);
      if (!session || !session.code) {
        setStage("onboard");
        return;
      }
      setLoadingMsg("Connecting to your tour… the first load can take up to a minute.");
      try {
        const exists = await storeGetStrict(`tour:${session.code}`, true);
        if (!exists) {
          await storeSet("tl-session", null, false);
          setError("That tour is no longer on the server (it may have been reset). Please create or join again.");
          setStage("onboard");
          return;
        }
      } catch (e) {
        /* server unreachable: keep the saved session; polling will retry */
      }
      setTour({ code: session.code, name: session.tourName, guideName: session.guideName });
      setMe({ id: session.myId, name: session.myName, role: session.myRole });
      setRole(session.myRole);
      setStage("app");
    })();
  }, []);

  // ---- battery level (Chrome/Android only; other browsers don't expose it) ----
  useEffect(() => {
    if (!navigator.getBattery) return;
    let batt;
    const upd = () => { batteryRef.current = Math.round(batt.level * 100); };
    navigator.getBattery().then((b) => { batt = b; upd(); b.addEventListener("levelchange", upd); }).catch(() => {});
    return () => { if (batt) batt.removeEventListener("levelchange", upd); };
  }, []);

  // ---- poll shared data while in app ----
  const pull = useCallback(async () => {
    if (!tour || pullingRef.current) return;
    pullingRef.current = true;
    try {
      const c = tour.code;
      const [m, ch, it, so, ex, ga, doc, asess, ahist, cur, locs, dts] = await Promise.all([
        storeGet(`tour:${c}:members`, true),
        storeGet(`tour:${c}:chat`, true),
        storeGet(`tour:${c}:itinerary`, true),
        storeGet(`tour:${c}:sos`, true),
        storeGet(`tour:${c}:expenses`, true),
        storeGet(`tour:${c}:gallery`, true),
        storeGet(`tour:${c}:documents`, true),
        storeGet(`tour:${c}:attendanceSession`, true),
        storeGet(`tour:${c}:attendanceHistory`, true),
        storeGet(`tour:${c}:currency`, true),
        storeListValues(`tour:${c}:loc:`),
        storeGet(`tour:${c}:dates`, true),
      ]);
      if (m) setMembers(m);
      if (ch) setChat(ch);
      if (it) setItinerary(it);
      if (so) {
        const ids = new Set(so.filter((s) => !s.resolved).map((s) => s.id));
        if (seenSosRef.current) {
          for (const id of ids) {
            if (!seenSosRef.current.has(id)) {
              try { navigator.vibrate?.([300, 150, 300]); } catch (e) { /* ignore */ }
              break;
            }
          }
        }
        seenSosRef.current = ids;
        setSos(so);
      }
      if (ex) setExpenses(ex);
      if (ga) setGallery(ga);
      if (doc) setDocuments(doc);
      if (asess) setAttendanceSession(asess);
      if (ahist) setAttendanceHistory(ahist);
      if (cur) setCurrencyState(cur);
      if (locs) setLocations(locs);
      if (dts) setTripDatesState({ start: dts.start || "", end: dts.end || "", emergency: dts.emergency || "" });
    } finally {
      pullingRef.current = false;
    }
  }, [tour]);

  useEffect(() => {
    if (stage !== "app" || !tour) return;
    pull();
    const iv = setInterval(pull, 4000);
    const onVis = () => { if (document.visibilityState === "visible") pull(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(iv); document.removeEventListener("visibilitychange", onVis); };
  }, [stage, tour, pull]);

  // ---- share my real GPS position with the group ----
  useEffect(() => {
    if (stage !== "app" || !tour || !me) return;
    if (!sharing) { setGeoStatus("off"); return; }
    if (!("geolocation" in navigator)) { setGeoStatus("unavailable"); return; }
    setGeoStatus("asking");
    const key = `tour:${tour.code}:loc:${me.id}`;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const p = { lat: latitude, lng: longitude, acc: Math.round(accuracy), ts: Date.now() };
        myPosRef.current = p;
        setMyPos(p);
        setGeoStatus("on");
        const last = lastWriteRef.current;
        const moved = last.lat == null ? Infinity : distanceMeters(last.lat, last.lng, latitude, longitude);
        if (p.ts - last.ts > 10000 || moved > 25) {
          lastWriteRef.current = { ts: p.ts, lat: latitude, lng: longitude };
          const payload = { ...p, battery: batteryRef.current };
          storeSet(key, payload, true);
          setLocations((cur) => ({ ...cur, [me.id]: payload }));
        }
      },
      (err) => setGeoStatus(err.code === 1 ? "denied" : "error"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    // heartbeat: keeps "last updated" fresh even when standing still
    const hb = setInterval(() => {
      const p = myPosRef.current;
      if (!p) return;
      const now = Date.now();
      lastWriteRef.current.ts = now;
      storeSet(key, { ...p, ts: now, battery: batteryRef.current }, true);
    }, 20000);
    return () => { navigator.geolocation.clearWatch(watchId); clearInterval(hb); };
  }, [stage, tour, me, sharing]);

  // ---- optional: keep the screen awake so tracking isn't paused ----
  useEffect(() => {
    if (!keepAwake || !("wakeLock" in navigator)) return;
    let lock = null;
    let cancelled = false;
    const acquire = async () => {
      try { lock = await navigator.wakeLock.request("screen"); } catch (e) { /* ignore */ }
    };
    acquire();
    const onVis = () => { if (document.visibilityState === "visible" && !cancelled) acquire(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      if (lock && lock.release) lock.release();
    };
  }, [keepAwake]);

  async function toggleSharing(on) {
    setSharing(on);
    await storeSet("tl-sharing", on, false);
    if (!on && tour && me) {
      myPosRef.current = null;
      lastWriteRef.current = { ts: 0, lat: null, lng: null };
      setMyPos(null);
      try { await storage.delete(`tour:${tour.code}:loc:${me.id}`, true); } catch (e) { /* ignore */ }
      setLocations((cur) => { const n = { ...cur }; delete n[me.id]; return n; });
    }
  }

  // ---- safe shared-list updates: always read the latest copy from the server first ----
  async function mutateList(key, setter, fn) {
    let latest;
    try {
      latest = (await storeGetStrict(key, true)) || [];
    } catch (e) {
      showToast("Can't reach the server - please try again.");
      return null;
    }
    const updated = fn(latest);
    setter(updated);
    try {
      await storeSetStrict(key, updated, true);
    } catch (e) {
      showToast("Couldn't save - check your connection.");
    }
    return updated;
  }
  const K = (suffix) => `tour:${tour.code}:${suffix}`;
  const postSystem = (text) => mutateList(K("chat"), setChat, (l) => [...l, systemMsg(text)].slice(-500));

  async function createTour() {
    setError("");
    if (!name.trim()) return setError("Enter your name to continue.");
    if (!tourName.trim()) return setError("Give your tour a name.");
    if (tripStart && tripEnd && tripEnd < tripStart) return setError("The trip end date can't be before the start date.");
    setBusy(true);
    try {
      let code = null;
      for (let i = 0; i < 30; i++) {
        const c = genCode();
        if (!(await storeGetStrict(`tour:${c}`, true))) { code = c; break; }
      }
      if (!code) throw new Error("no free code");
      const myId = uid();
      const guideName = name.trim();
      const meObj = { id: myId, name: guideName, role: "guide", checkedIn: true, lastSeen: timeNow() };
      await storeSetStrict(`tour:${code}`, { name: tourName.trim(), guideName, createdAt: Date.now() }, true);
      await storeSetStrict(`tour:${code}:members`, [meObj], true);
      await storeSetStrict(`tour:${code}:itinerary`, [], true);
      await storeSetStrict(`tour:${code}:chat`, [systemMsg(`Tour "${tourName.trim()}" created. Share code ${code} with your group.`)], true);
      await storeSetStrict(`tour:${code}:sos`, [], true);
      await storeSetStrict(`tour:${code}:expenses`, [], true);
      await storeSetStrict(`tour:${code}:gallery`, [], true);
      await storeSetStrict(`tour:${code}:documents`, [], true);
      await storeSetStrict(`tour:${code}:attendanceSession`, { active: false, stopTitle: "", startTimestamp: null }, true);
      await storeSetStrict(`tour:${code}:attendanceHistory`, [], true);
      const dates = { start: tripStart || "", end: tripStart ? (tripEnd && tripEnd >= tripStart ? tripEnd : tripStart) : "", emergency: "" };
      await storeSetStrict(`tour:${code}:dates`, dates, true);
      await storeSetStrict(`tour:${code}:currency`, currency, true);
      await storeSet("tl-session", { code, tourName: tourName.trim(), guideName, myId, myName: guideName, myRole: "guide" }, false);
      setTour({ code, name: tourName.trim(), guideName });
      setMe({ id: myId, name: guideName, role: "guide" });
      setMembers([meObj]);
      setItinerary([]);
      setTripDatesState(dates);
      setChat([systemMsg(`Tour "${tourName.trim()}" created. Share code ${code} with your group.`)]);
      setTab("home");
      setStage("app");
    } catch (e) {
      setError("Can't reach the TourLink server. Check your internet and try again (the first request after a quiet period can take up to a minute).");
    } finally {
      setBusy(false);
    }
  }

  async function joinTour() {
    setError("");
    if (!name.trim()) return setError("Enter your name to continue.");
    const code = codeInput.trim();
    if (!/^\d{4}$/.test(code)) return setError("Enter the 4-digit tour code from your guide.");
    setBusy(true);
    try {
      const t = await storeGetStrict(`tour:${code}`, true);
      if (!t) { setError("No tour found with that code. Check the 4 digits with your guide."); return; }
      const roster = (await storeGetStrict(`tour:${code}:members`, true)) || [];
      const clean = name.trim();
      const existing = roster.find((m) => m.role !== "guide" && !m.mock && m.name.toLowerCase() === clean.toLowerCase());
      const myId = existing ? existing.id : uid();
      if (!existing) {
        const meObj = { id: myId, name: clean, role: "member", checkedIn: false, lastSeen: timeNow() };
        await storeSetStrict(`tour:${code}:members`, [...roster, meObj], true);
        const chatNow = (await storeGetStrict(`tour:${code}:chat`, true)) || [];
        await storeSetStrict(`tour:${code}:chat`, [...chatNow, systemMsg(`${clean} joined the tour.`)].slice(-500), true);
      }
      await storeSet("tl-session", { code, tourName: t.name, guideName: t.guideName, myId, myName: clean, myRole: "member" }, false);
      setTour({ code, name: t.name, guideName: t.guideName });
      setMe({ id: myId, name: clean, role: "member" });
      setTab("home");
      setStage("app");
    } catch (e) {
      setError("Can't reach the TourLink server. Check your internet and try again (the first request after a quiet period can take up to a minute).");
    } finally {
      setBusy(false);
    }
  }

  async function leaveTour() {
    if (!window.confirm("Leave this tour on this device? Your live location will stop being shared.")) return;
    if (tour && me) {
      try { await storage.delete(`tour:${tour.code}:loc:${me.id}`, true); } catch (e) { /* ignore */ }
    }
    await storeSet("tl-session", null, false);
    myPosRef.current = null;
    lastWriteRef.current = { ts: 0, lat: null, lng: null };
    seenSosRef.current = null;
    setMyPos(null); setLocations({}); setMembers([]); setChat([]); setItinerary([]); setSos([]);
    setExpenses([]); setGallery([]); setDocuments([]); setAttendanceHistory([]);
    setAttendanceSession({ active: false, stopTitle: "", startTimestamp: null });
    setCodeInput(""); setError(""); setTripStart(""); setTripEnd("");
    setTripDatesState({ start: "", end: "", emergency: "" });
    setTour(null); setMe(null); setTab("home"); setStage("onboard");
  }

  async function sendMessage(text) {
    if (!text.trim() || !tour) return;
    const msg = { id: uid(), sender: me.name, senderId: me.id, text: text.trim(), time: timeNow() };
    await mutateList(K("chat"), setChat, (l) => [...l, msg].slice(-500));
  }

  async function fileSos(typeId) {
    const type = EMERGENCY_TYPES.find((e) => e.id === typeId);
    const p = myPosRef.current || locations[me.id] || null;
    const entry = {
      id: uid(), member: me.name, memberId: me.id, type: type.label, time: timeNow(), resolved: false,
      battery: batteryRef.current, lat: p ? p.lat : null, lng: p ? p.lng : null, acc: p ? p.acc ?? null : null,
    };
    setShowSosModal(false);
    await mutateList(K("sos"), setSos, (l) => [entry, ...l]);
    await postSystem(`🚨 SOS from ${me.name}: ${type.label}.${p ? " Location shared." : " (No location available.)"}`);
  }

  async function resolveSos(id) {
    await mutateList(K("sos"), setSos, (l) => l.map((s) => (s.id === id ? { ...s, resolved: true } : s)));
  }

  async function toggleCheckIn(memberId) {
    await mutateList(K("members"), setMembers, (l) =>
      l.map((m) => (m.id === memberId ? { ...m, checkedIn: !m.checkedIn, checkInTimestamp: !m.checkedIn ? Date.now() : null, late: false } : m))
    );
  }

  // ---- Smart attendance: checkpoint session ----
  const LATE_THRESHOLD_MS = 3 * 60 * 1000;

  async function startAttendanceCheckpoint(stopTitle) {
    const session = { active: true, stopTitle: stopTitle || "Headcount", startTimestamp: Date.now() };
    setAttendanceSession(session);
    await storeSet(K("attendanceSession"), session, true);
    await mutateList(K("members"), setMembers, (l) =>
      l.map((m) => (m.role === "guide" ? m : { ...m, checkedIn: false, checkInTimestamp: null, late: false }))
    );
    await postSystem(`📍 Attendance opened for "${session.stopTitle}". Open the app and tap "Check in now".`);
  }

  async function closeAttendanceCheckpoint() {
    const nonGuide = members.filter((m) => m.role !== "guide");
    const present = nonGuide.filter((m) => m.checkedIn && !m.late).length;
    const late = nonGuide.filter((m) => m.checkedIn && m.late).length;
    const absent = nonGuide.filter((m) => !m.checkedIn);
    const record = {
      id: uid(), stopTitle: attendanceSession.stopTitle, time: timeNow(),
      total: nonGuide.length, present, late, absentNames: absent.map((m) => m.name),
    };
    await mutateList(K("attendanceHistory"), setAttendanceHistory, (l) => [record, ...l]);
    const session = { active: false, stopTitle: "", startTimestamp: null };
    setAttendanceSession(session);
    await storeSet(K("attendanceSession"), session, true);
    if (absent.length > 0) {
      await postSystem(`🚌 Departure lock: ${absent.length} member${absent.length > 1 ? "s" : ""} not checked in for "${record.stopTitle}" - ${absent.map((m) => m.name).join(", ")}.`);
    }
  }

  async function selfCheckIn() {
    if (!attendanceSession.active) return;
    const now = Date.now();
    const isLate = Boolean(attendanceSession.startTimestamp && now - attendanceSession.startTimestamp > LATE_THRESHOLD_MS);
    await mutateList(K("members"), setMembers, (l) =>
      l.map((m) => (m.id === me.id ? { ...m, checkedIn: true, checkInTimestamp: now, late: isLate, lastSeen: timeNow() } : m))
    );
  }

  async function notifyMissing(memberName) {
    await postSystem(`⏰ Reminder sent to ${memberName}: please check in with your guide.`);
  }
  async function notifyAllMissing(names) {
    await postSystem(`⏰ Missing headcount reminder sent to: ${names.join(", ")}.`);
  }

  async function setTripDates(next) {
    setTripDatesState(next);
    try { await storeSetStrict(K("dates"), next, true); } catch (e) { showToast("Couldn't save the trip details - check your connection."); }
  }
  async function addItineraryItem(item) {
    await mutateList(K("itinerary"), setItinerary, (l) => [...l, { ...item, id: uid() }]);
  }
  async function deleteItineraryItem(id) {
    await mutateList(K("itinerary"), setItinerary, (l) => l.filter((i) => i.id !== id));
  }
  async function addExpense(exp) {
    await mutateList(K("expenses"), setExpenses, (l) => [{ ...exp, id: uid(), time: timeNow() }, ...l]);
  }
  async function setCurrency(c) {
    setCurrencyState(c);
    await storeSet(K("currency"), c, true);
  }
  async function addGalleryPost(caption) {
    const palette = ["#E8871E", "#1F6F78", "#C96A0C", "#2C3060", "#3B8256"];
    const post = { id: uid(), caption, by: me.name, time: timeNow(), color: palette[Math.floor(Math.random() * palette.length)] };
    await mutateList(K("gallery"), setGallery, (l) => [post, ...l]);
  }
  async function addDocument(title, type) {
    await mutateList(K("documents"), setDocuments, (l) => [{ id: uid(), title, type, addedBy: me.name }, ...l]);
  }

  // ---- Test tools: exercise the app solo ----
  async function addMockMembers(count) {
    const base = myPosRef.current || locations[me.id] || null;
    if (!base) { showToast("Turn on location first so test members can be placed near you."); return; }
    const used = new Set(members.map((m) => m.name));
    const picks = MOCK_NAMES.filter((n) => !used.has(n)).sort(() => Math.random() - 0.5).slice(0, count);
    if (picks.length === 0) { showToast("All mock names are already added."); return; }
    const newMembers = picks.map((nm) => {
      const checkedIn = Math.random() > 0.4;
      return { id: uid(), name: nm, role: "member", mock: true, checkedIn, checkInTimestamp: checkedIn ? Date.now() : null, late: checkedIn && Math.random() > 0.7, lastSeen: timeNow() };
    });
    await mutateList(K("members"), setMembers, (l) => [...l, ...newMembers]);
    const now = Date.now();
    const results = await Promise.all(newMembers.map((m) => {
      const loc = {
        lat: base.lat + (Math.random() - 0.5) * 0.006, lng: base.lng + (Math.random() - 0.5) * 0.006,
        acc: 15, ts: now, battery: Math.floor(15 + Math.random() * 85), mock: true,
      };
      return storeSet(K(`loc:${m.id}`), loc, true).then(() => [m.id, loc]);
    }));
    setLocations((cur) => ({ ...cur, ...Object.fromEntries(results) }));
  }

  async function moveMockMembers() {
    const mocks = members.filter((m) => m.mock && locations[m.id]);
    if (mocks.length === 0) { showToast("Add mock members first."); return; }
    const now = Date.now();
    const results = await Promise.all(mocks.map((m, i) => {
      const cur = locations[m.id];
      const goQuiet = i % 4 === 3; // every 4th mock stops reporting, to test the "offline / last seen" state
      const loc = {
        ...cur,
        lat: cur.lat + (Math.random() - 0.5) * 0.002, lng: cur.lng + (Math.random() - 0.5) * 0.002,
        ts: goQuiet ? cur.ts : now, battery: Math.max(5, (cur.battery ?? 60) - Math.floor(Math.random() * 4)), mock: true,
      };
      return storeSet(K(`loc:${m.id}`), loc, true).then(() => [m.id, loc]);
    }));
    setLocations((cur) => ({ ...cur, ...Object.fromEntries(results) }));
  }

  async function removeMockMembers() {
    const mocks = members.filter((m) => m.mock);
    if (mocks.length === 0) return;
    const ids = new Set(mocks.map((m) => m.id));
    await mutateList(K("members"), setMembers, (l) => l.filter((m) => !ids.has(m.id)));
    await Promise.all(mocks.map((m) => storage.delete(K(`loc:${m.id}`), true).catch(() => {})));
    setLocations((cur) => { const n = { ...cur }; ids.forEach((id) => delete n[id]); return n; });
  }

  async function triggerTestSos() {
    const pool = members.filter((m) => m.role !== "guide");
    if (pool.length === 0) { showToast("Add mock members first."); return; }
    const m = pool[Math.floor(Math.random() * pool.length)];
    const type = EMERGENCY_TYPES[Math.floor(Math.random() * EMERGENCY_TYPES.length)];
    const loc = locations[m.id];
    const entry = { id: uid(), member: m.name, memberId: m.id, type: type.label, time: timeNow(), resolved: false, battery: loc ? loc.battery ?? null : null, lat: loc ? loc.lat : null, lng: loc ? loc.lng : null, acc: loc ? loc.acc ?? null : null };
    await mutateList(K("sos"), setSos, (l) => [entry, ...l]);
    await postSystem(`🚨 [Test] SOS from ${m.name}: ${type.label}.`);
  }

  async function seedTestChat() {
    const samples = ["Are we leaving on time?", "Can someone share the hotel address?", "Loved the view today!", "What time is dinner?", "Is the bus AC working today?"];
    const pool = members.filter((m) => m.id !== me.id);
    const msgs = samples.map((s) => {
      const sender = pool.length ? pool[Math.floor(Math.random() * pool.length)] : { name: "Test Member", id: uid() };
      return { id: uid(), sender: sender.name, senderId: sender.id, text: s, time: timeNow() };
    });
    await mutateList(K("chat"), setChat, (l) => [...l, ...msgs].slice(-500));
  }

  async function loadSampleItinerary() {
    const base = tripDates.start || todayISO();
    await mutateList(K("itinerary"), setItinerary, (l) => [...l, ...SAMPLE_ITINERARY.map(({ day, ...rest }) => ({ ...rest, date: addDaysISO(base, day - 1), id: uid() }))]);
  }

  async function resetTourData() {
    await mutateList(K("members"), setMembers, (l) =>
      l.map((m) => (m.role === "guide" ? { ...m, checkedIn: true, checkInTimestamp: null, late: false } : { ...m, checkedIn: false, checkInTimestamp: null, late: false }))
    );
    setSos([]);
    await storeSet(K("sos"), [], true);
    setAttendanceHistory([]);
    await storeSet(K("attendanceHistory"), [], true);
    const session = { active: false, stopTitle: "", startTimestamp: null };
    setAttendanceSession(session);
    await storeSet(K("attendanceSession"), session, true);
    await postSystem("🧪 Test data reset. Attendance, SOS log and history cleared.");
  }

  const onShowOnMap = (id) => { setMapFocus(id); setTab("map"); };

  if (stage === "loading") {
    return (
      <div className="tl-root">
        <style>{STYLES}</style>
        <div style={{ padding: 60, textAlign: "center", color: "var(--sand)", background: "var(--ink)", flex: 1 }}>{loadingMsg}</div>
      </div>
    );
  }

  if (stage === "onboard") {
    return (
      <div className="tl-root">
        <style>{STYLES}</style>
        <div className="tl-onboard">
          <div className="tl-brand">
            <div className="tl-brand-mark"><Compass size={22} /></div>
            <div>
              <div className="tl-brand-name">TourLink</div>
              <div className="tl-brand-tag">Group Tour Companion</div>
            </div>
          </div>

          <div className="tl-hero-line">One code.<br/>Every traveler, together.</div>
          <div className="tl-hero-sub">Chat, itinerary, live location, check-ins and a one-tap SOS — one place your whole tour can rely on.</div>

          <div className="tl-role-row">
            <div className={`tl-role-btn ${role === "guide" ? "active" : ""}`} onClick={() => setRole("guide")}>
              Tour Guide
              <div className="sub">Create a tour, manage the group</div>
            </div>
            <div className={`tl-role-btn ${role === "member" ? "active" : ""}`} onClick={() => setRole("member")}>
              Tour Member
              <div className="sub">Join with a 4-digit code</div>
            </div>
          </div>

          <div className="tl-field">
            <label>Your name</label>
            <input className="tl-input" style={{ fontFamily: "Inter, sans-serif" }} placeholder="e.g. Asha Menon" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {role === "guide" ? (
            <div className="tl-field">
              <label>Tour name</label>
              <input className="tl-input" style={{ fontFamily: "Inter, sans-serif" }} placeholder="e.g. Summer Study Tour" value={tourName} onChange={(e) => setTourName(e.target.value)} />
            </div>
          ) : (
            <div className="tl-field">
              <label>Tour joining code</label>
              <input className="tl-input" inputMode="numeric" maxLength={4} placeholder="4721" value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 4))} />
            </div>
          )}

          {role === "guide" && (
            <div className="tl-field-row">
              <div className="tl-field"><label>Trip start (optional)</label>
                <input className="tl-input" type="date" style={{ colorScheme: "dark" }} value={tripStart} onChange={(e) => setTripStart(e.target.value)} /></div>
              <div className="tl-field"><label>Trip end (optional)</label>
                <input className="tl-input" type="date" style={{ colorScheme: "dark" }} min={tripStart || undefined} value={tripEnd} onChange={(e) => setTripEnd(e.target.value)} /></div>
            </div>
          )}

          {error && <div className="tl-err">{error}</div>}

          <button className="tl-primary-btn" disabled={busy} onClick={role === "guide" ? createTour : joinTour}>
            {busy ? "Connecting…" : role === "guide" ? <>Create tour <ChevronRight size={16} /></> : <>Join tour <ChevronRight size={16} /></>}
          </button>
          <div style={{ fontSize: 11, color: "var(--sand-deep)", opacity: 0.7, textAlign: "center", marginTop: 14 }}>
            Anyone who has your 4-digit code can join and see this tour's chat and locations. Share it only with your group.
          </div>
        </div>
      </div>
    );
  }

  // ---- MAIN APP ----
  const isGuide = me.role === "guide";
  const checkedInCount = members.filter((m) => m.checkedIn).length;
  const activeSos = sos.filter((s) => !s.resolved);
  const emergencyNumber = (tripDates.emergency || "").replace(/[^\d+]/g, "");

  return (
    <div className="tl-root">
      <style>{STYLES}</style>
      <div className="tl-app">
        <div className="tl-topbar">
          <div className="tl-topbar-left">
            <div className="tl-topbar-tour">{tour.name}</div>
            <div className="tl-topbar-role">{isGuide ? "Guide" : "Member"} · Code {tour.code}</div>
          </div>
          <div className="tl-topbar-actions">
            <button className="tl-sos-btn" onClick={() => setShowSosModal(true)} aria-label="Send SOS emergency alert">
              <AlertTriangle size={15} /> SOS
            </button>
            <div className="tl-topbar-icon" onClick={leaveTour} title="Leave tour"><LogOut size={16} /></div>
          </div>
        </div>

        {activeSos.length > 0 && (
          <div className="tl-sos-strip" onClick={() => setTab("home")}>
            <Radio size={14} /> {activeSos.length} active SOS alert{activeSos.length > 1 ? "s" : ""} — tap to view
          </div>
        )}

        <div className="tl-content">
          {tab === "home" && (
            <HomeTab tripDates={tripDates} me={me} isGuide={isGuide} tour={tour} members={members} itinerary={itinerary}
              activeSos={activeSos} resolveSos={resolveSos} checkedInCount={checkedInCount} setTab={setTab}
              attendanceSession={attendanceSession} selfCheckIn={selfCheckIn}
              myPos={myPos} onShowOnMap={onShowOnMap} />
          )}
          {tab === "chat" && <ChatTab chat={chat} me={me} onSend={sendMessage} />}
          {tab === "itinerary" && <ItineraryTab tripDates={tripDates} setTripDates={setTripDates} itinerary={itinerary} isGuide={isGuide} onAdd={addItineraryItem} onDelete={deleteItineraryItem} />}
          {tab === "map" && (
            <MapTab members={members} me={me} locations={locations} myPos={myPos}
              sharing={sharing} toggleSharing={toggleSharing} geoStatus={geoStatus}
              keepAwake={keepAwake} setKeepAwake={setKeepAwake}
              focusId={mapFocus} clearFocus={() => setMapFocus(null)} />
          )}
          {tab === "more" && (
            <MoreTab tripDates={tripDates} members={members} me={me} isGuide={isGuide} toggleCheckIn={toggleCheckIn}
              attendanceSession={attendanceSession} attendanceHistory={attendanceHistory}
              startAttendanceCheckpoint={startAttendanceCheckpoint} closeAttendanceCheckpoint={closeAttendanceCheckpoint}
              selfCheckIn={selfCheckIn}
              notifyMissing={notifyMissing} notifyAllMissing={notifyAllMissing}
              expenses={expenses} addExpense={addExpense} currency={currency} setCurrency={setCurrency}
              gallery={gallery} addGalleryPost={addGalleryPost}
              documents={documents} addDocument={addDocument}
              tour={tour} itinerary={itinerary}
              locations={locations} myPos={myPos} onShowOnMap={onShowOnMap}
              addMockMembers={addMockMembers} moveMockMembers={moveMockMembers} removeMockMembers={removeMockMembers}
              triggerTestSos={triggerTestSos} seedTestChat={seedTestChat}
              loadSampleItinerary={loadSampleItinerary} resetTourData={resetTourData} sos={sos} />
          )}
        </div>

        {toast && <div className="tl-toast">{toast}</div>}

        <div className="tl-navbar">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <div key={n.id} className={`tl-navitem ${tab === n.id ? "active" : ""}`} onClick={() => setTab(n.id)}>
                <Icon size={19} />
                <span>{n.label}</span>
              </div>
            );
          })}
        </div>

        {showSosModal && (
          <div className="tl-modal-backdrop" onClick={() => setShowSosModal(false)}>
            <div className="tl-modal" onClick={(e) => e.stopPropagation()}>
              <div className="tl-modal-handle" />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <AlertTriangle size={18} color="var(--alert)" />
                <div className="tl-display" style={{ fontWeight: 700, fontSize: 17 }}>Send emergency alert</div>
              </div>
              <div style={{ fontSize: 12.5, color: "rgba(27,30,61,0.7)", marginBottom: 4, lineHeight: 1.5 }}>
                Your guide and the group will see your alert, location and battery in the app while they have it open.
                <strong> This does not call emergency services.</strong>
              </div>
              {emergencyNumber ? (
                <a className="tl-call-btn" href={`tel:${emergencyNumber}`}>Call local emergency number: {tripDates.emergency}</a>
              ) : (
                <div style={{ fontSize: 12, color: "rgba(27,30,61,0.7)", lineHeight: 1.5, marginTop: 6 }}>
                  Call the emergency number for where you are (for example 112 in India and the EU, 911 in the USA and the Philippines).{" "}
                  {isGuide ? "Add the local number for your group in Plan → Trip details." : "Your guide can add the local number in Plan → Trip details."}
                </div>
              )}
              <div className="tl-emg-grid">
                {EMERGENCY_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <div key={t.id} className="tl-emg-btn" onClick={() => fileSos(t.id)}>
                      <Icon size={20} />
                      {t.label}
                    </div>
                  );
                })}
              </div>
              <button className="tl-ghost-btn" style={{ color: "var(--ink)", borderColor: "var(--line)" }} onClick={() => setShowSosModal(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- HOME ---------------- */
const WEATHER_CODES = {
  0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain",
  80: "Rain showers", 81: "Rain showers", 82: "Violent showers", 95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm",
};

function useWeather(lat, lng) {
  const [w, setW] = useState(null);
  useEffect(() => {
    let off = false;
    setW(null);
    if (lat == null) return undefined;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`)
      .then((r) => r.json())
      .then((d) => {
        if (!off && d && d.current) setW({ temp: Math.round(d.current.temperature_2m), code: d.current.weather_code });
      })
      .catch(() => {});
    return () => { off = true; };
  }, [lat, lng]);
  return w;
}

function HomeTab({ tripDates, me, isGuide, tour, members, itinerary, activeSos, resolveSos, checkedInCount, setTab, attendanceSession, selfCheckIn, myPos }) {
  const nextItem = nextStop(itinerary, tripDates);
  const hasDated = sortedStops(itinerary, tripDates).some((x) => x.at);
  const untilStart = tripDates.start ? daysBetween(todayISO(), tripDates.start) : null;
  const tripLen = tripDates.start ? daysBetween(tripDates.start, tripDates.end || tripDates.start) + 1 : 0;
  const missingCount = members.filter((m) => !m.checkedIn && m.role !== "guide").length;
  const myEntry = members.find((m) => m.id === me.id);
  const needsCheckIn = !isGuide && attendanceSession?.active && myEntry && !myEntry.checkedIn;
  const weather = useWeather(myPos ? myPos.lat.toFixed(2) : null, myPos ? myPos.lng.toFixed(2) : null);

  return (
    <div>
      {needsCheckIn && (
        <div className="tl-alert-banner" style={{ background: "rgba(31,111,120,0.1)", borderColor: "rgba(31,111,120,0.35)" }}>
          <CheckCircle2 size={18} color="var(--teal)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: "var(--teal)" }}>Attendance open: {attendanceSession.stopTitle}</div>
            <div style={{ fontSize: 12, color: "rgba(27,30,61,0.65)", marginTop: 2, marginBottom: 8 }}>Tap to check in at this meeting point.</div>
            <button className="tl-primary-btn" style={{ background: "var(--teal)", color: "white" }} onClick={selfCheckIn}>Check in now</button>
          </div>
        </div>
      )}

      {isGuide && attendanceSession?.active && missingCount > 0 && (
        <div className="tl-alert-banner" style={{ cursor: "pointer" }} onClick={() => setTab("more")}>
          <Search size={18} color="var(--alert)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: "var(--alert)" }}>{missingCount} member{missingCount > 1 ? "s" : ""} not checked in</div>
            <div style={{ fontSize: 12, color: "rgba(27,30,61,0.65)", marginTop: 2 }}>Tap to see who's missing, where they were last seen, and send a reminder</div>
          </div>
          <ChevronRight size={16} color="var(--alert)" />
        </div>
      )}

      {activeSos.length > 0 && (
        <div className="tl-alert-banner">
          <Radio size={18} color="var(--alert)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: "var(--alert)", marginBottom: 6 }}>{activeSos.length} active SOS alert{activeSos.length > 1 ? "s" : ""}</div>
            {activeSos.map((s) => (
              <div key={s.id} style={{ fontSize: 12.5, marginBottom: 10 }}>
                <div><strong>{s.member}</strong> — {s.type} · {s.time}{s.battery != null ? ` · battery ${s.battery}%` : ""}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 5, alignItems: "center" }}>
                  {s.lat != null ? (
                    <a className="tl-mini-btn" style={{ textDecoration: "none" }} href={directionsUrl(s.lat, s.lng)} target="_blank" rel="noreferrer">Navigate to them</a>
                  ) : (
                    <span style={{ fontSize: 11.5, opacity: 0.7 }}>No location available</span>
                  )}
                  {isGuide && <button className="tl-mini-btn" style={{ background: "var(--success)", color: "white" }} onClick={() => resolveSos(s.id)}>Resolve</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tl-countdown-card">
        <div className="tl-eyebrow" style={{ color: "var(--saffron)" }}>Next up</div>
        {nextItem ? (
          <>
            <div className="tl-countdown-num">{nextItem.time}</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{nextItem.title}</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
              {relDay(nextItem.date) || fmtDateLong(nextItem.date)} · {fmtUntil(nextItem.at)}{nextItem.location ? ` · ${nextItem.location}` : ""}
            </div>
          </>
        ) : hasDated ? (
          <div style={{ fontSize: 13 }}>All scheduled stops are done. {isGuide ? "Add more in the Plan tab." : ""}</div>
        ) : (
          <div style={{ fontSize: 13 }}>No itinerary yet — {isGuide ? "add your first stop in the Plan tab." : "your guide hasn't added one yet."}</div>
        )}
        {tripDates.start && (
          <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 10, borderTop: "1px solid rgba(243,232,208,0.2)", paddingTop: 8, position: "relative", zIndex: 1 }}>
            {untilStart > 0
              ? `Trip starts in ${untilStart} day${untilStart > 1 ? "s" : ""} · ${fmtDateLong(tripDates.start)}`
              : untilStart + tripLen > 0
                ? `Trip day ${-untilStart + 1} of ${tripLen}`
                : `Trip ended ${fmtDateLong(tripDates.end || tripDates.start)}`}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div className="tl-card" style={{ flex: 1, marginBottom: 0, textAlign: "center" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700 }}>{checkedInCount}/{members.length}</div>
          <div style={{ fontSize: 11, color: "rgba(27,30,61,0.6)" }}>Checked in</div>
        </div>
        <div className="tl-card" style={{ flex: 1, marginBottom: 0, textAlign: "center" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700 }}>{weather ? `${weather.temp}°C` : "—"}</div>
          <div style={{ fontSize: 11, color: "rgba(27,30,61,0.6)" }}>{weather ? `${WEATHER_CODES[weather.code] || "Current weather"} · near you` : myPos ? "Loading weather…" : "Allow location for weather"}</div>
        </div>
      </div>

      <div className="tl-card">
        <div className="tl-card-title"><Ticket size={16} color="var(--saffron-deep)" /> Your tour ticket</div>
        <div className="tl-ticket" style={{ margin: 0, boxShadow: "none", border: "1px solid var(--line)" }}>
          <div className="tl-ticket-main">
            <div className="tl-ticket-label">Traveler</div>
            <div className="tl-ticket-name">{me.name}</div>
            <div style={{ marginTop: 10 }} className="tl-ticket-label">Tour</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{tour.name}</div>
          </div>
          <div className="tl-ticket-stub">
            <div className="tl-ticket-label" style={{ writingMode: "vertical-rl" }}>Code</div>
            <div className="tl-ticket-code">{tour.code}</div>
          </div>
        </div>
      </div>

      <div className="tl-card" onClick={() => setTab("more")} style={{ cursor: "pointer" }}>
        <div className="tl-card-title"><Users size={16} color="var(--saffron-deep)" /> Quick contacts</div>
        <div className="tl-row" style={{ borderBottom: "none", paddingBottom: 0 }}>
          <div className="tl-avatar">{initials(tour.guideName)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{tour.guideName}</div>
            <div style={{ fontSize: 11.5, color: "rgba(27,30,61,0.55)" }}>Tour Guide</div>
          </div>
          <ChevronRight size={16} color="rgba(27,30,61,0.35)" />
        </div>
      </div>
    </div>
  );
}

/* ---------------- CHAT ---------------- */
function ChatTab({ chat, me, onSend }) {
  const [text, setText] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [chat.length]);

  return (
    <div style={{ marginBottom: -90 }}>
      <div style={{ paddingBottom: 60 }}>
        {chat.length === 0 && <div className="tl-empty">No messages yet. Say hello to the group.</div>}
        {chat.map((m) =>
          m.system ? (
            <div key={m.id} style={{ textAlign: "center", fontSize: 11, color: "rgba(27,30,61,0.5)", margin: "10px 0" }}>{m.text}</div>
          ) : (
            <div key={m.id} className={`tl-msg-row ${m.senderId === me.id ? "me" : ""}`}>
              <div>
                {m.senderId !== me.id && <div className="tl-msg-sender">{m.sender}</div>}
                <div className="tl-bubble">{m.text}<div className="tl-msg-time">{m.time}</div></div>
              </div>
            </div>
          )
        )}
        <div ref={endRef} />
      </div>
      <div className="tl-chat-input-row">
        <input className="tl-chat-input" placeholder="Message the group…" value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) { onSend(text); setText(""); } }} />
        <button className="tl-send-btn" onClick={() => { if (text.trim()) { onSend(text); setText(""); } }}><Send size={16} /></button>
      </div>
    </div>
  );
}

/* ---------------- ITINERARY (real calendar) ---------------- */
function CalendarGrid({ year, month, selected, onSelect, marked, trip, onNav }) {
  const today = todayISO();
  const startOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${year}-${pad2(month + 1)}-${pad2(d)}`);
  const thisYear = new Date().getFullYear();
  const years = [];
  for (let y = Math.min(thisYear - 1, year); y <= Math.max(thisYear + 6, year); y++) years.push(y);
  const go = (delta) => {
    const d = new Date(year, month + delta, 1);
    onNav(d.getFullYear(), d.getMonth());
  };

  return (
    <div className="tl-cal">
      <div className="tl-cal-head">
        <button type="button" className="tl-cal-nav" aria-label="Previous month" onClick={() => go(-1)}>‹</button>
        <select aria-label="Month" value={month} onChange={(e) => onNav(year, Number(e.target.value))}>
          {MONTH_NAMES.map((n, i) => <option key={n} value={i}>{n}</option>)}
        </select>
        <select aria-label="Year" value={year} onChange={(e) => onNav(Number(e.target.value), month)}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <button type="button" className="tl-cal-nav" aria-label="Next month" onClick={() => go(1)}>›</button>
      </div>
      <div className="tl-cal-grid">
        {WEEKDAYS.map((w) => <div className="tl-cal-wd" key={w}>{w}</div>)}
        {cells.map((iso, i) => {
          if (!iso) return <div key={`b${i}`} />;
          const inTrip = trip.start && iso >= trip.start && iso <= (trip.end || trip.start);
          const cls = `tl-cal-day${inTrip ? " in-trip" : ""}${iso === today ? " today" : ""}${iso === selected ? " selected" : ""}`;
          return (
            <div key={iso} className={cls} onClick={() => onSelect(iso)} role="button" aria-label={fmtDateLong(iso)}>
              {Number(iso.slice(8))}
              {marked.has(iso) && <span className="tl-cal-dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StopRow({ it, last, isGuide, onDelete, showDate }) {
  const Icon = ITEM_ICON[it.type] || Sunrise;
  return (
    <div className="tl-timeline-item">
      <div className="tl-timeline-rail">
        <div className="tl-timeline-dot" />
        {!last && <div className="tl-timeline-line" />}
      </div>
      <div className="tl-timeline-body">
        <div className="tl-timeline-time">{showDate && it.date ? `${fmtDateShort(it.date)} · ` : ""}{it.time}</div>
        <div className="tl-timeline-title">{it.title}</div>
        {it.location && <div className="tl-timeline-meta"><Icon size={12} /> {it.location}</div>}
        {it.notes && <div style={{ fontSize: 11.5, color: "rgba(27,30,61,0.55)", marginTop: 3 }}>{it.notes}</div>}
        {isGuide && (
          <button className="tl-mini-btn" style={{ marginTop: 6, background: "transparent", color: "var(--alert)", border: "1px solid var(--alert)" }}
            onClick={() => { if (window.confirm("Remove this stop?")) onDelete(it.id); }}>Remove</button>
        )}
      </div>
    </div>
  );
}

function ItineraryTab({ itinerary, isGuide, onAdd, onDelete, tripDates, setTripDates }) {
  const stops = sortedStops(itinerary, tripDates);
  const marked = new Set(stops.filter((s) => s.date).map((s) => s.date));
  const initialSelected = () => (tripDates.start && todayISO() < tripDates.start ? tripDates.start : todayISO());

  const [selected, setSelected] = useState(initialSelected);
  const [cursor, setCursor] = useState(() => { const d = parseISO(initialSelected()); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [view, setView] = useState("calendar");
  const [showForm, setShowForm] = useState(false);
  const blank = (date) => ({ date, time: "", title: "", location: "", notes: "", type: "sight" });
  const [form, setForm] = useState(blank(selected));
  const [dStart, setDStart] = useState(tripDates.start || "");
  const [dEnd, setDEnd] = useState(tripDates.end || "");
  const [dEmerg, setDEmerg] = useState(tripDates.emergency || "");
  const touchedRef = useRef(false);

  function selectDate(iso, touch = true) {
    if (touch) touchedRef.current = true;
    setSelected(iso);
    const d = parseISO(iso);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  }

  // when the trip dates arrive from the server, show them (unless the user already picked a day)
  useEffect(() => {
    setDStart(tripDates.start || "");
    setDEnd(tripDates.end || "");
    setDEmerg(tripDates.emergency || "");
    if (!touchedRef.current && tripDates.start && todayISO() < tripDates.start) selectDate(tripDates.start, false);
  }, [tripDates.start, tripDates.end, tripDates.emergency]);

  const dayStops = stops.filter((s) => s.date === selected);
  const rel = relDay(selected);
  const tripLen = tripDates.start ? daysBetween(tripDates.start, tripDates.end || tripDates.start) + 1 : 0;
  const tripDay = tripDates.start ? daysBetween(tripDates.start, selected) + 1 : 0;
  const inTrip = tripDates.start && tripDay >= 1 && tripDay <= tripLen;

  const datesChanged = dStart !== (tripDates.start || "") || dEnd !== (tripDates.end || "") || dEmerg !== (tripDates.emergency || "");
  function saveDates() {
    const emergency = dEmerg.replace(/[^\d+ ]/g, "").trim();
    if (!dStart) { setTripDates({ start: "", end: "", emergency }); return; }
    setTripDates({ start: dStart, end: dEnd && dEnd >= dStart ? dEnd : dStart, emergency });
  }

  // list view: group stops by date
  const groups = [];
  stops.forEach((s) => {
    const key = s.date || "none";
    let g = groups.find((x) => x.key === key);
    if (!g) { g = { key, date: s.date, items: [] }; groups.push(g); }
    g.items.push(s);
  });

  return (
    <div>
      <div className="tl-card" style={{ padding: 14 }}>
        <div className="tl-card-title" style={{ marginBottom: 8 }}><CalendarDays size={16} color="var(--saffron-deep)" /> Trip details</div>
        {tripDates.start ? (
          <div style={{ fontSize: 13, marginBottom: isGuide ? 10 : 0 }}>
            <strong>{fmtDateLong(tripDates.start)}</strong>
            {tripDates.end && tripDates.end !== tripDates.start ? <> &rarr; <strong>{fmtDateLong(tripDates.end)}</strong></> : null}
            <span style={{ color: "rgba(27,30,61,0.55)" }}> · {tripLen} day{tripLen > 1 ? "s" : ""}</span>
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: "rgba(27,30,61,0.55)", marginBottom: isGuide ? 10 : 0 }}>
            {isGuide ? "Set the start and end date of the trip." : "Your guide hasn't set the trip dates yet."}
          </div>
        )}
        {tripDates.emergency && (
          <div style={{ fontSize: 12.5, marginBottom: isGuide ? 10 : 0, marginTop: tripDates.start ? 6 : 0 }}>
            Local emergency number: <a href={`tel:${tripDates.emergency.replace(/[^\d+]/g, "")}`} style={{ color: "var(--teal)", fontWeight: 700 }}>{tripDates.emergency}</a>
          </div>
        )}
        {isGuide && (
          <>
            <div className="tl-field-row">
              <div className="tl-field" style={{ marginBottom: 8 }}><label>Start date</label>
                <input className="tl-input" type="date" value={dStart} onChange={(e) => { setDStart(e.target.value); if (dEnd && e.target.value > dEnd) setDEnd(e.target.value); }} /></div>
              <div className="tl-field" style={{ marginBottom: 8 }}><label>End date</label>
                <input className="tl-input" type="date" value={dEnd} min={dStart || undefined} onChange={(e) => setDEnd(e.target.value)} /></div>
            </div>
            <div className="tl-field" style={{ marginBottom: 10 }}><label>Local emergency number (optional)</label>
              <input className="tl-input" inputMode="tel" placeholder="e.g. 112 or 911" maxLength={16} value={dEmerg} onChange={(e) => setDEmerg(e.target.value)} /></div>
            <button className="tl-primary-btn" disabled={!datesChanged} onClick={saveDates}>Save trip details</button>
          </>
        )}
      </div>

      <div className="tl-segment">
        <div className={`tl-seg-btn ${view === "calendar" ? "active" : ""}`} onClick={() => setView("calendar")}>Calendar</div>
        <div className={`tl-seg-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>All stops ({stops.length})</div>
        <div className="tl-seg-btn" onClick={() => selectDate(todayISO())}>Today</div>
      </div>

      {view === "calendar" && (
        <>
          <CalendarGrid year={cursor.y} month={cursor.m} selected={selected} marked={marked} trip={tripDates}
            onSelect={(iso) => selectDate(iso)} onNav={(y, m) => setCursor({ y, m })} />

          <div className="tl-card">
            <div className="tl-card-title" style={{ marginBottom: 2 }}>{fmtDateLong(selected)}</div>
            <div style={{ fontSize: 11.5, color: "rgba(27,30,61,0.55)", marginBottom: 10 }}>
              {[rel, inTrip ? `Trip day ${tripDay} of ${tripLen}` : null].filter(Boolean).join(" · ") || " "}
            </div>
            {dayStops.length === 0 && <div className="tl-empty" style={{ padding: "14px 10px" }}>Nothing planned for this date.</div>}
            {dayStops.map((it, idx) => (
              <StopRow key={it.id} it={it} last={idx === dayStops.length - 1} isGuide={isGuide} onDelete={onDelete} />
            ))}
          </div>
        </>
      )}

      {view === "list" && (
        <div className="tl-card">
          {stops.length === 0 && <div className="tl-empty">No stops yet.</div>}
          {groups.map((g) => (
            <div key={g.key} style={{ marginBottom: 6 }}>
              <div className="tl-eyebrow" style={{ marginTop: 6 }}>
                {g.date ? `${fmtDateLong(g.date)}${relDay(g.date) ? ` · ${relDay(g.date)}` : ""}` : "No date set"}
              </div>
              {g.items.map((it, idx) => (
                <StopRow key={it.id} it={it} last={idx === g.items.length - 1} isGuide={isGuide} onDelete={onDelete} />
              ))}
            </div>
          ))}
        </div>
      )}

      {isGuide && (
        <button className="tl-primary-btn" onClick={() => { setForm(blank(selected)); setShowForm(true); }}>
          <Plus size={16} /> Add stop on {fmtDateShort(selected)}
        </button>
      )}

      {showForm && (
        <div className="tl-modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="tl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tl-modal-handle" />
            <div className="tl-display" style={{ fontWeight: 700, fontSize: 17, marginBottom: 12 }}>Add itinerary stop</div>
            <div className="tl-field-row">
              <div className="tl-field"><label>Date</label>
                <input className="tl-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="tl-field"><label>Time</label>
                <input className="tl-input" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
            </div>
            <div className="tl-field"><label>Title</label><input className="tl-input" placeholder="e.g. Intramuros walking tour" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="tl-field"><label>Location</label><input className="tl-input" placeholder="e.g. Fort Santiago gate" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="tl-field"><label>Notes (optional)</label><input className="tl-input" placeholder="Dress code, reminders…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="tl-field">
              <label>Type</label>
              <div className="tl-pill-row">
                {["sight", "bus", "meal", "hotel"].map((t) => (
                  <div key={t} className="tl-pill" style={{ cursor: "pointer", background: form.type === t ? "var(--saffron)" : "var(--sand-deep)" }} onClick={() => setForm({ ...form, type: t })}>{t}</div>
                ))}
              </div>
            </div>
            <button className="tl-primary-btn" disabled={!form.date || !form.time || !form.title.trim()}
              onClick={() => { onAdd({ ...form, title: form.title.trim() }); setShowForm(false); selectDate(form.date); }}>Add to itinerary</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- MAP (real GPS + OpenStreetMap) ---------------- */
function geoMessage(status) {
  switch (status) {
    case "on": return { tone: "ok", text: "Sharing your live location with the group." };
    case "asking": return { tone: "wait", text: "Waiting for location permission — tap Allow when your browser asks." };
    case "denied": return { tone: "bad", text: "Location is blocked for this site. Allow Location in your browser's site settings, then reload the page." };
    case "unavailable": return { tone: "bad", text: "This browser can't provide location." };
    case "error": return { tone: "bad", text: "Can't get a GPS fix. Turn on device location, or move to open sky." };
    case "off": return { tone: "wait", text: "Location sharing is off — the group can't see you." };
    default: return { tone: "wait", text: "Starting location…" };
  }
}

function MapTab({ members, me, locations, myPos, sharing, toggleSharing, geoStatus, keepAwake, setKeepAwake, focusId, clearFocus }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const didFitRef = useRef(false);
  const [nowTick, setNowTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setNowTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const meLoc = myPos || locations[me.id] || null;

  // create the map once
  useEffect(() => {
    const map = L.map(mapEl.current, { zoomControl: true }).setView([20, 0], 2);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    mapRef.current = map;
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
      didFitRef.current = false;
    };
  }, []);

  // draw / update one marker per member that has a location
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const seen = new Set();
    const points = [];
    members.forEach((m) => {
      const loc = m.id === me.id ? (myPos || locations[m.id]) : locations[m.id];
      if (!loc) return;
      seen.add(m.id);
      points.push([loc.lat, loc.lng]);
      const stale = Date.now() - loc.ts > STALE_MS;
      const cls = `tl-pin${m.role === "guide" ? " guide" : ""}${m.id === me.id ? " me" : ""}${stale ? " stale" : ""}`;
      const icon = L.divIcon({
        html: `<div class="${cls}">${escapeHtml(initials(m.name))}</div>`,
        className: "tl-pin-wrap",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const popup = `<strong>${escapeHtml(m.name)}${m.id === me.id ? " (You)" : ""}</strong><br/>${stale ? "Last seen " : "Updated "}${fmtAgo(loc.ts)}<br/>Accuracy ±${loc.acc ?? "?"} m`;
      const existing = markersRef.current[m.id];
      if (existing) {
        existing.setLatLng([loc.lat, loc.lng]);
        existing.setIcon(icon);
        existing.setPopupContent(popup);
      } else {
        markersRef.current[m.id] = L.marker([loc.lat, loc.lng], { icon }).addTo(map).bindPopup(popup);
      }
    });
    Object.keys(markersRef.current).forEach((id) => {
      if (!seen.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
    if (!didFitRef.current && points.length > 0) {
      didFitRef.current = true;
      if (points.length === 1) map.setView(points[0], 16);
      else map.fitBounds(points, { padding: [40, 40], maxZoom: 17 });
    }
  }, [members, locations, myPos, me.id, nowTick]);

  // "Show on map" from the attendance list or an SOS alert
  useEffect(() => {
    if (!focusId || !mapRef.current) return;
    const mk = markersRef.current[focusId];
    if (mk) {
      mapRef.current.setView(mk.getLatLng(), 17);
      mk.openPopup();
    }
    clearFocus();
  }, [focusId]);

  function fitGroup() {
    const map = mapRef.current;
    if (!map) return;
    const pts = Object.values(markersRef.current).map((mk) => mk.getLatLng());
    if (pts.length === 0) return;
    if (pts.length === 1) map.setView(pts[0], 16);
    else map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 17 });
  }
  function centerOnMe() {
    if (mapRef.current && meLoc) mapRef.current.setView([meLoc.lat, meLoc.lng], 17);
  }

  const rows = members
    .map((m) => {
      const loc = m.id === me.id ? (myPos || locations[m.id]) : locations[m.id];
      const dist = loc && meLoc && m.id !== me.id ? distanceMeters(meLoc.lat, meLoc.lng, loc.lat, loc.lng) : null;
      const stale = loc ? Date.now() - loc.ts > STALE_MS : false;
      return { m, loc, dist, stale };
    })
    .sort((a, b) => (a.m.id === me.id ? -1 : b.m.id === me.id ? 1 : (a.dist ?? 1e12) - (b.dist ?? 1e12)));

  const msg = geoMessage(geoStatus);
  const toneColor = msg.tone === "ok" ? "var(--success)" : msg.tone === "bad" ? "var(--alert)" : "var(--saffron-deep)";
  const anyLoc = rows.some((r) => r.loc);

  return (
    <div>
      <div className="tl-card-title"><Navigation2 size={16} color="var(--saffron-deep)" /> Live group map</div>

      <div className="tl-geo-status" style={{ borderColor: toneColor, color: toneColor }}>
        {msg.text}{geoStatus === "on" && myPos ? ` (±${myPos.acc} m)` : ""}
      </div>

      <div className="tl-leaflet" ref={mapEl} />

      <div style={{ display: "flex", gap: 8, margin: "10px 0 14px" }}>
        <button className="tl-chip-btn" onClick={fitGroup}>Show whole group</button>
        <button className="tl-chip-btn" onClick={centerOnMe} disabled={!meLoc}>Center on me</button>
      </div>

      <div className="tl-card">
        <div className="tl-card-title" style={{ marginBottom: 6 }}><Shield size={16} color="var(--saffron-deep)" /> Privacy &amp; tracking</div>
        <label className="tl-toggle-row">
          <input type="checkbox" checked={sharing} onChange={(e) => toggleSharing(e.target.checked)} />
          <span>Share my live location with the group</span>
        </label>
        <label className="tl-toggle-row">
          <input type="checkbox" checked={keepAwake} onChange={(e) => setKeepAwake(e.target.checked)} />
          <span>Keep my screen awake while the app is open</span>
        </label>
        <div style={{ fontSize: 11.5, color: "rgba(27,30,61,0.6)", lineHeight: 1.5, marginTop: 6 }}>
          Location only updates while TourLink is open on screen. If your phone locks or you switch apps, your pin stops moving and shows "last seen" to the group after 5 minutes.
        </div>
      </div>

      <div className="tl-card">
        <div className="tl-card-title" style={{ marginBottom: 4 }}><Users size={16} color="var(--saffron-deep)" /> Who's where</div>
        {!anyLoc && <div className="tl-empty">No locations yet. Allow location access, or add mock members from More → Test Tools.</div>}
        {rows.map(({ m, loc, dist, stale }) => (
          <div className="tl-row" key={m.id}>
            <div className="tl-avatar" style={stale || !loc ? { background: "#9a9a9a" } : undefined}>{initials(m.name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                {m.name}{m.id === me.id ? " (You)" : ""}{m.mock ? " · test" : ""}
              </div>
              <div style={{ fontSize: 11.5, color: stale ? "var(--alert)" : "rgba(27,30,61,0.6)" }}>
                {!loc
                  ? "No location shared"
                  : `${stale ? "Offline · last seen " : "Updated "}${fmtAgo(loc.ts)}${dist != null ? ` · ${fmtDistance(dist)} away · ~${walkMinutes(dist)} min walk` : ""}`}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {loc && (
                <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11.5, justifyContent: "flex-end", color: (loc.battery ?? 100) < 20 ? "var(--alert)" : "rgba(27,30,61,0.6)" }}>
                  <Battery size={13} /> {loc.battery != null ? `${loc.battery}%` : "—"}
                </div>
              )}
              {loc && m.id !== me.id && (
                <a className="tl-nav-link" href={directionsUrl(loc.lat, loc.lng)} target="_blank" rel="noreferrer">Navigate</a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- MORE (attendance, AI, translate, expenses, gallery, documents, test tools) ---------------- */
function MoreTab(props) {
  const { members, me, isGuide, toggleCheckIn,
    attendanceSession, attendanceHistory, startAttendanceCheckpoint, closeAttendanceCheckpoint, selfCheckIn,
    notifyMissing, notifyAllMissing,
    expenses, addExpense, currency, setCurrency, gallery, addGalleryPost, documents, addDocument,
    tour, itinerary, tripDates, locations, myPos, onShowOnMap,
    addMockMembers, moveMockMembers, removeMockMembers, triggerTestSos, seedTestChat,
    loadSampleItinerary, resetTourData, sos } = props;
  const [section, setSection] = useState("members");

  const segments = [
    ["members", "Attendance"], ["ai", "AI Assistant"], ["translate", "Translate"], ["expenses", "Expenses"], ["gallery", "Gallery"], ["documents", "Documents"],
  ];
  if (isGuide) segments.push(["test", "Test Tools"]);

  return (
    <div>
      <div className="tl-segment">
        {segments.map(([id, label]) => (
          <div key={id} className={`tl-seg-btn ${section === id ? "active" : ""}`} onClick={() => setSection(id)}>{label}</div>
        ))}
      </div>

      {section === "members" && (
        <MembersSection members={members} me={me} isGuide={isGuide} toggleCheckIn={toggleCheckIn}
          attendanceSession={attendanceSession} attendanceHistory={attendanceHistory}
          startAttendanceCheckpoint={startAttendanceCheckpoint} closeAttendanceCheckpoint={closeAttendanceCheckpoint}
          selfCheckIn={selfCheckIn}
          notifyMissing={notifyMissing} notifyAllMissing={notifyAllMissing}
          itinerary={itinerary} tripDates={tripDates} locations={locations} myPos={myPos} onShowOnMap={onShowOnMap} />
      )}
      {section === "ai" && <AIAssistantSection tour={tour} itinerary={itinerary} tripDates={tripDates} members={members} me={me} />}
      {section === "translate" && <TranslatorSection tourCode={tour.code} />}
      {section === "expenses" && <ExpensesSection members={members} me={me} isGuide={isGuide} expenses={expenses} addExpense={addExpense} currency={currency} setCurrency={setCurrency} />}
      {section === "gallery" && <GallerySection gallery={gallery} me={me} addGalleryPost={addGalleryPost} />}
      {section === "documents" && <DocumentsSection documents={documents} me={me} isGuide={isGuide} addDocument={addDocument} />}
      {section === "test" && isGuide && (
        <TestToolsSection members={members} sos={sos} tour={tour}
          addMockMembers={addMockMembers} moveMockMembers={moveMockMembers} removeMockMembers={removeMockMembers}
          triggerTestSos={triggerTestSos} seedTestChat={seedTestChat}
          loadSampleItinerary={loadSampleItinerary} resetTourData={resetTourData} />
      )}
    </div>
  );
}

function TestToolsSection({ members, sos, tour, addMockMembers, moveMockMembers, removeMockMembers, triggerTestSos, seedTestChat, loadSampleItinerary, resetTourData }) {
  const [busy, setBusy] = useState("");
  const [health, setHealth] = useState(null);
  async function run(name, fn) {
    setBusy(name);
    try { await fn(); } finally { setBusy(""); }
  }
  useEffect(() => {
    storage.health().then(setHealth).catch(() => setHealth({ ok: false }));
  }, []);
  const activeSosCount = sos.filter((s) => !s.resolved).length;
  const mockCount = members.filter((m) => m.mock).length;

  return (
    <div>
      <div className="tl-ai-header" style={{ background: "linear-gradient(135deg,var(--ink) 0%, #3a3f6e 130%)" }}>
        <Sparkles size={20} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Test tools</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Try every feature on your own phone. Mock members appear on the real map around where you are, so turn location on first. Remove them before the real trip.</div>
        </div>
      </div>

      <div className="tl-card">
        <div className="tl-card-title"><Radio size={16} color="var(--saffron-deep)" /> Server status</div>
        {!health && <div style={{ fontSize: 12.5 }}>Checking…</div>}
        {health && !health.ok && <div style={{ fontSize: 12.5, color: "var(--alert)" }}>Can't reach the server.</div>}
        {health && health.ok && (
          <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
            <div>Storage: <strong style={{ color: health.storage === "redis" ? "var(--success)" : "var(--alert)" }}>{health.storage === "redis" ? "permanent (Redis)" : "temporary file — tours are erased when the server restarts or sleeps"}</strong></div>
            <div>AI features: <strong style={{ color: health.ai ? "var(--success)" : "var(--alert)" }}>{health.ai ? "API key set" : "no API key on the server"}</strong></div>
          </div>
        )}
      </div>

      <div className="tl-card">
        <div className="tl-card-title"><Users size={16} color="var(--saffron-deep)" /> Current state</div>
        <div className="tl-pill-row">
          <div className="tl-pill">{members.length} members</div>
          <div className="tl-pill">{mockCount} mock</div>
          <div className="tl-pill">{members.filter((m) => m.checkedIn).length} checked in</div>
          <div className="tl-pill" style={{ background: activeSosCount > 0 ? "rgba(214,69,69,0.18)" : "var(--sand-deep)", color: activeSosCount > 0 ? "var(--alert)" : "var(--ink)" }}>{activeSosCount} active SOS</div>
        </div>
      </div>

      <div className="tl-card">
        <div className="tl-card-title"><Plus size={16} color="var(--saffron-deep)" /> Seed test data</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="tl-ghost-btn tl-dark-ghost" disabled={busy === "members"} onClick={() => run("members", () => addMockMembers(3))}>
            {busy === "members" ? "Adding…" : "Add 3 mock members (placed near you on the map)"}
          </button>
          <button className="tl-ghost-btn tl-dark-ghost" disabled={busy === "move"} onClick={() => run("move", moveMockMembers)}>
            {busy === "move" ? "Moving…" : "Move mock members (tests live updates & offline state)"}
          </button>
          <button className="tl-ghost-btn tl-dark-ghost" disabled={busy === "chat"} onClick={() => run("chat", seedTestChat)}>
            {busy === "chat" ? "Posting…" : "Post 5 sample chat messages"}
          </button>
          <button className="tl-ghost-btn tl-dark-ghost" disabled={busy === "itin"} onClick={() => run("itin", loadSampleItinerary)}>
            {busy === "itin" ? "Loading…" : "Load a sample itinerary"}
          </button>
          <button className="tl-ghost-btn" style={{ margin: 0, borderColor: "var(--alert)", color: "var(--alert)" }} disabled={busy === "sos"} onClick={() => run("sos", triggerTestSos)}>
            {busy === "sos" ? "Sending…" : "Trigger a random test SOS"}
          </button>
        </div>
      </div>

      <div className="tl-card">
        <div className="tl-card-title"><AlertTriangle size={16} color="var(--alert)" /> Clean up</div>
        <div style={{ fontSize: 12, color: "rgba(27,30,61,0.6)", marginBottom: 10 }}>Removing mock members also removes their pins. Reset clears check-ins, SOS alerts and attendance history for tour {tour.code}.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="tl-ghost-btn tl-dark-ghost" disabled={busy === "rm" || mockCount === 0} onClick={() => run("rm", removeMockMembers)}>
            {busy === "rm" ? "Removing…" : `Remove all mock members (${mockCount})`}
          </button>
          <button className="tl-primary-btn" style={{ background: "var(--alert)", color: "white" }} disabled={busy === "reset"} onClick={() => run("reset", resetTourData)}>
            {busy === "reset" ? "Resetting…" : "Reset attendance & SOS test data"}
          </button>
        </div>
      </div>

      <div className="tl-card">
        <div className="tl-card-title"><FileText size={16} color="var(--saffron-deep)" /> Test checklist</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.7, color: "rgba(27,30,61,0.75)" }}>
          1. Map tab: allow location. Your pin should appear on the real map.<br/>
          2. Add mock members here, then check the Map tab shows their pins and distances.<br/>
          3. On a second phone, join with code <strong>{tour.code}</strong>. Walk apart and watch both pins move.<br/>
          4. Start an attendance checkpoint, check in from the second phone, then close it with someone missing — the missing panel shows last seen, distance and a Navigate link.<br/>
          5. Press SOS on the second phone — the guide sees the alert strip on every tab, with a Navigate link.<br/>
          6. Send chat from both phones at the same time; nothing should disappear.<br/>
          7. AI Assistant and Translate: ask a question (needs Anthropic credits on the server).
        </div>
      </div>
    </div>
  );
}

function MembersSection({ members, me, isGuide, toggleCheckIn, attendanceSession, attendanceHistory,
  startAttendanceCheckpoint, closeAttendanceCheckpoint, selfCheckIn, notifyMissing, notifyAllMissing, itinerary, tripDates,
  locations, myPos, onShowOnMap }) {
  const nonGuide = members.filter((m) => m.role !== "guide");
  const present = nonGuide.filter((m) => m.checkedIn && !m.late);
  const late = nonGuide.filter((m) => m.checkedIn && m.late);
  const missing = nonGuide.filter((m) => !m.checkedIn);
  const allPresent = missing.length === 0;
  const [stopName, setStopName] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const nextStopTitle = nextStop(itinerary, tripDates)?.title || "";
  const meLoc = myPos || locations[me.id] || null;
  const myEntry = members.find((m) => m.id === me.id);

  return (
    <div>
      {isGuide && (
        <div className="tl-card">
          <div className="tl-card-title"><CheckCircle2 size={16} color="var(--saffron-deep)" /> Smart attendance</div>
          {attendanceSession.active ? (
            <>
              <div style={{ fontSize: 12.5, color: "rgba(27,30,61,0.6)", marginBottom: 10 }}>
                Checkpoint open: <strong>{attendanceSession.stopTitle}</strong> · {present.length + late.length} of {nonGuide.length} checked in
                {late.length > 0 ? ` (${late.length} late)` : ""}
              </div>
              <button className="tl-primary-btn" style={{ background: "var(--alert)", color: "white" }} onClick={closeAttendanceCheckpoint}>
                Close checkpoint & lock departure
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 12.5, color: "rgba(27,30,61,0.6)", marginBottom: 10 }}>
                Open a checkpoint — members get a "Check in now" prompt, and anyone checking in more than 3 minutes later is flagged late.
              </div>
              <input className="tl-input tl-light-input" placeholder={nextStopTitle ? `e.g. ${nextStopTitle}` : "Checkpoint name"}
                value={stopName} onChange={(e) => setStopName(e.target.value)} />
              <button className="tl-primary-btn" style={{ marginTop: 10 }} onClick={() => { startAttendanceCheckpoint(stopName || nextStopTitle || "Headcount"); setStopName(""); }}>
                Start attendance
              </button>
            </>
          )}
        </div>
      )}

      {!isGuide && (
        <div className="tl-card">
          <div className="tl-card-title"><CheckCircle2 size={16} color="var(--saffron-deep)" /> Your attendance</div>
          {attendanceSession.active ? (
            myEntry?.checkedIn ? (
              <div style={{ fontSize: 13, color: myEntry.late ? "var(--saffron-deep)" : "var(--success)", fontWeight: 700 }}>
                {myEntry.late ? "Checked in — marked late" : "Checked in — you're marked present"} for {attendanceSession.stopTitle}
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12.5, color: "rgba(27,30,61,0.6)", marginBottom: 10 }}>Checkpoint open: {attendanceSession.stopTitle}</div>
                <button className="tl-primary-btn" onClick={selfCheckIn}>Check in now</button>
              </>
            )
          ) : (
            <div style={{ fontSize: 12.5, color: "rgba(27,30,61,0.55)" }}>No checkpoint open right now.</div>
          )}
        </div>
      )}

      {isGuide && attendanceSession.active && !allPresent && (
        <div className="tl-alert-banner">
          <AlertTriangle size={18} color="var(--alert)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: "var(--alert)", marginBottom: 8 }}>
              {missing.length} member{missing.length > 1 ? "s" : ""} not checked in
            </div>
            {missing.map((m) => {
              const loc = locations[m.id];
              const dist = loc && meLoc ? distanceMeters(meLoc.lat, meLoc.lng, loc.lat, loc.lng) : null;
              const stale = loc ? Date.now() - loc.ts > STALE_MS : false;
              return (
                <div key={m.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                    <strong>{m.name}</strong>
                    <button className="tl-mini-btn" onClick={() => notifyMissing(m.name)}>Notify</button>
                  </div>
                  <div style={{ fontSize: 11.5, color: "rgba(27,30,61,0.7)", marginTop: 2 }}>
                    {loc
                      ? `${stale ? "Last seen" : "Live"} ${fmtAgo(loc.ts)}${dist != null ? ` · ${fmtDistance(dist)} from you · ~${walkMinutes(dist)} min walk` : ""} · battery ${loc.battery != null ? `${loc.battery}%` : "unknown"}`
                      : "No location shared"}
                  </div>
                  {loc && (
                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                      <button className="tl-mini-btn" onClick={() => onShowOnMap(m.id)}>Show on map</button>
                      <a className="tl-mini-btn" style={{ textDecoration: "none" }} href={directionsUrl(loc.lat, loc.lng)} target="_blank" rel="noreferrer">Navigate</a>
                    </div>
                  )}
                </div>
              );
            })}
            <button className="tl-ghost-btn" style={{ marginTop: 4, borderColor: "var(--alert)", color: "var(--alert)" }}
              onClick={() => notifyAllMissing(missing.map((m) => m.name))}>Notify all missing</button>
          </div>
        </div>
      )}

      <div className="tl-card">
        <div className="tl-card-title"><Users size={16} color="var(--saffron-deep)" /> Group ({members.length})</div>
        {members.map((m) => (
          <div className="tl-row" key={m.id}>
            <div className="tl-avatar">{initials(m.name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{m.name}{m.id === me.id ? " (You)" : ""}{m.mock ? " · test" : ""}</div>
              <div style={{ fontSize: 11.5, color: "rgba(27,30,61,0.55)" }}>
                {m.role === "guide" ? "Tour Guide" : "Member"}
                {m.checkInTimestamp ? ` · in at ${new Date(m.checkInTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
              </div>
            </div>
            {isGuide ? (
              <div className={`tl-badge ${m.checkedIn ? (m.late ? "wait" : "in") : "out"}`} style={{ cursor: "pointer" }} onClick={() => toggleCheckIn(m.id)}>
                {m.role === "guide" ? "Guide" : m.checkedIn ? (m.late ? "Late" : "Present") : "Absent"}
              </div>
            ) : (
              <div className={`tl-badge ${m.checkedIn ? (m.late ? "wait" : "in") : "out"}`}>
                {m.role === "guide" ? "Guide" : m.checkedIn ? (m.late ? "Late" : "Present") : "Absent"}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="tl-card">
        <div className="tl-card-title" style={{ cursor: "pointer", justifyContent: "space-between", display: "flex" }} onClick={() => setShowHistory(!showHistory)}>
          <span style={{ display: "flex", alignItems: "center", gap: 7 }}><Clock size={16} color="var(--saffron-deep)" /> Attendance history</span>
          <ChevronRight size={16} style={{ transform: showHistory ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
        </div>
        {showHistory && (
          attendanceHistory.length === 0 ? <div className="tl-empty">No checkpoints logged yet.</div> : (
            attendanceHistory.map((h) => (
              <div className="tl-row" key={h.id}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{h.stopTitle}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(27,30,61,0.55)" }}>{h.time} · {h.present} present, {h.late} late{h.absentNames.length ? `, missing: ${h.absentNames.join(", ")}` : ""}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{h.present + h.late}/{h.total}</div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}

/* ---------------- AI MULTILINGUAL TRANSLATOR ---------------- */
const TRANSLATE_LANGUAGES = [
  "Arabic", "Bengali", "Burmese", "Chinese (Cantonese)", "Chinese (Mandarin)", "Czech", "Dutch", "English", "Filipino (Tagalog)",
  "French", "German", "Greek", "Gujarati", "Hebrew", "Hindi", "Indonesian", "Italian", "Japanese", "Kannada", "Khmer", "Korean",
  "Malay", "Malayalam", "Marathi", "Nepali", "Persian", "Polish", "Portuguese", "Punjabi", "Russian", "Sinhala", "Spanish",
  "Swahili", "Tamil", "Telugu", "Thai", "Turkish", "Ukrainian", "Urdu", "Vietnamese",
];
const TRAVEL_PHRASES = [
  "Where is the hotel?", "I need medical help.", "Thank you.", "How much does this cost?",
  "I am lost.", "Please call my tour guide.", "Where is the nearest hospital?",
  "I need a taxi.", "Vegetarian food, please.",
];
const EMERGENCY_PHRASES = [
  "I need medical assistance.", "I have lost my passport.", "Please contact my tour guide.",
  "I am separated from my group.", "I need police assistance.",
];

function TranslatorSection({ tourCode }) {
  const [text, setText] = useState("");
  const [lang, setLang] = useState(() => { try { return localStorage.getItem("tl:lang") || ""; } catch (e) { return ""; } });
  const [needLang, setNeedLang] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);

  async function translate(phrase) {
    const source = (phrase ?? text).trim();
    if (!source || loading) return;
    if (!lang) { setNeedLang(true); return; }
    setNeedLang(false);
    setLoading(true);
    setErrored(false);
    setResult(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:3001"}/api/claude`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tour-code": tourCode },
        body: JSON.stringify({
          model: "claude-sonnet-5-5",
          max_tokens: 400,
          system: `You are a travel phrase translator inside a group-tour app. Translate the traveler's text into ${lang}. Respond ONLY as compact JSON, no markdown fences, no preamble, in exactly this shape: {"translation":"...","pronunciation":"..."} — where "pronunciation" is a short romanized pronunciation guide if ${lang} does not use the Latin script, or an empty string if it does. Keep the translation natural and polite, suitable for a traveler speaking to a local resident.`,
          messages: [{ role: "user", content: source }],
        }),
      });
      const data = await response.json();
      const raw = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
      const clean = raw.replace(/^```json|```$/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult({ source, translation: parsed.translation, pronunciation: parsed.pronunciation, lang });
    } catch (e) {
      setErrored(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="tl-ai-header" style={{ background: "linear-gradient(135deg,var(--ink) 0%, var(--saffron-deep) 130%)" }}>
        <Languages size={20} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>AI Translator</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Text translation for common travel situations. For real two-way voice interpretation, camera translation, or offline packs, this demo only covers the text case.</div>
        </div>
      </div>

      <div className="tl-card">
        <div className="tl-field">
          <label>Translate to</label>
          <select className="tl-input" style={{ fontFamily: "Inter" }} value={lang} onChange={(e) => { setLang(e.target.value); setNeedLang(false); try { localStorage.setItem("tl:lang", e.target.value); } catch (err) { /* ignore */ } }}>
            <option value="">Choose a language…</option>
            {TRANSLATE_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          {needLang && <div style={{ fontSize: 12, color: "var(--alert)", marginTop: 6 }}>Choose the language to translate into first.</div>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="tl-input" style={{ fontFamily: "Inter" }} placeholder="Type a phrase to translate…" value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") translate(); }} />
          <button className="tl-send-btn" style={{ borderRadius: 12 }} onClick={() => translate()}><Send size={16} /></button>
        </div>

        {loading && <div className="tl-ai-loading" style={{ marginTop: 10 }}><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Translating…</div>}
        {errored && <div style={{ fontSize: 12, color: "var(--alert)", marginTop: 10 }}>Couldn't translate that just now — try again.</div>}
        {result && (
          <div style={{ marginTop: 12, padding: 12, background: "var(--sand)", borderRadius: 12 }}>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 3 }}>{result.source}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{result.translation}</div>
            {result.pronunciation && <div style={{ fontSize: 12, color: "rgba(27,30,61,0.6)", marginTop: 3 }}>({result.pronunciation})</div>}
            <div className="tl-eyebrow" style={{ marginTop: 8 }}>{result.lang}</div>
          </div>
        )}
      </div>

      <div className="tl-card">
        <div className="tl-card-title"><Compass size={16} color="var(--saffron-deep)" /> Travel phrase assistant</div>
        <div className="tl-pill-row">
          {TRAVEL_PHRASES.map((p) => <div key={p} className="tl-pill" style={{ cursor: "pointer" }} onClick={() => { setText(p); translate(p); }}>{p}</div>)}
        </div>
      </div>

      <div className="tl-card">
        <div className="tl-card-title"><AlertTriangle size={16} color="var(--alert)" /> Emergency phrases</div>
        <div className="tl-pill-row">
          {EMERGENCY_PHRASES.map((p) => <div key={p} className="tl-pill" style={{ cursor: "pointer", background: "rgba(214,69,69,0.12)", color: "var(--alert)" }} onClick={() => { setText(p); translate(p); }}>{p}</div>)}
        </div>
      </div>
    </div>
  );
}

const AI_SUGGESTIONS = [
  { icon: CalendarDays, label: "Today's schedule" },
  { icon: Languages, label: "Translate: where is the restroom?" },
  { icon: ShoppingBag, label: "Packing tips for this trip" },
  { icon: CloudRain, label: "What should I wear for the weather?" },
  { icon: Compass, label: "What's nearby right now?" },
  { icon: AlertTriangle, label: "What do I do in an emergency?" },
];

function AIAssistantSection({ tour, itinerary, tripDates, members, me }) {
  const [messages, setMessages] = useState([
    { id: uid(), role: "assistant", text: `Namaste ${me.name.split(" ")[0]}! I'm your TourLink AI assistant for ${tour.name}. Ask me about today's schedule, translations, nearby places, packing tips, or what to do in an emergency.` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages.length, loading]);

  function buildSystemPrompt() {
    const itineraryText = sortedStops(itinerary, tripDates)
      .map((i) => `${i.date || "undated"} ${i.time} — ${i.title}${i.location ? ` @ ${i.location}` : ""}${i.notes ? ` (${i.notes})` : ""}`)
      .join("\n");
    return `You are the in-app AI travel assistant inside TourLink, a group tour coordination app. You are helping a traveler on the tour "${tour.name}", guided by ${tour.guideName}. The group has ${members.length} members. Today's date is ${todayISO()}${tripDates.start ? `; the trip runs ${tripDates.start} to ${tripDates.end || tripDates.start}` : ""}.

Full itinerary:
${itineraryText || "No itinerary added yet."}

Answer questions about the schedule, meeting times, packing, weather-appropriate clothing, translations of common phrases, nearby practical needs (restaurants, restrooms, ATMs, hospitals), and basic emergency guidance, using the itinerary above when relevant. If asked something outside your knowledge (like real-time weather or exact nearby businesses), say so honestly and suggest checking with the guide or a maps app instead of inventing details. Keep answers short, warm, and practical — 2-4 sentences unless a list is clearly needed. Never give specific medical, legal, or safety instructions beyond generic first-response advice; for real emergencies always direct them to use the app's SOS button and contact the guide.`;
  }

  async function send(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg = { id: uid(), role: "user", text: trimmed };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    setErrored(false);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:3001"}/api/claude`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tour-code": tour.code },
        body: JSON.stringify({
          model: "claude-sonnet-5-5",
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: updated
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await response.json();
      const textResp = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n") || "Sorry, I couldn't find an answer to that. Try asking your guide directly.";
      setMessages((cur) => [...cur, { id: uid(), role: "assistant", text: textResp }]);
    } catch (e) {
      setErrored(true);
      setMessages((cur) => [...cur, { id: uid(), role: "assistant", text: "I couldn't reach the assistant just now. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="tl-ai-header">
        <Sparkles size={20} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>AI Travel Assistant</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Knows this tour's itinerary. Can't see live traffic, weather, or real nearby listings — always confirm anything safety-critical with your guide.</div>
        </div>
      </div>

      <div className="tl-ai-chip-row">
        {AI_SUGGESTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="tl-ai-chip" onClick={() => send(s.label)}>
              <Icon size={13} /> {s.label}
            </div>
          );
        })}
      </div>

      <div className="tl-card" style={{ minHeight: 120 }}>
        {messages.map((m) => (
          <div key={m.id} className={`tl-ai-msg-row ${m.role === "user" ? "user" : ""}`}>
            {m.role === "assistant" && <div className="tl-ai-avatar"><Sparkles size={13} /></div>}
            <div className="tl-ai-bubble">{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="tl-ai-loading"><Loader2 size={13} className="tl-spin" style={{ animation: "spin 1s linear infinite" }} /> Thinking…</div>
        )}
        <div ref={endRef} />
      </div>

      <div className="tl-ai-input-row">
        <input className="tl-chat-input" placeholder="Ask about your trip…" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(input); }} />
        <button className="tl-send-btn" onClick={() => send(input)}><Send size={16} /></button>
      </div>
    </div>
  );
}

function ExpensesSection({ members, me, isGuide, expenses, addExpense, currency, setCurrency }) {
  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const perHead = members.length ? total / members.length : 0;

  return (
    <div>
      <div className="tl-countdown-card" style={{ padding: 16 }}>
        <div className="tl-eyebrow" style={{ color: "var(--saffron)" }}>Trip total</div>
        <div className="tl-countdown-num">{currency}{total.toLocaleString()}</div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>≈ {currency}{perHead.toFixed(0)} per person, split evenly across {members.length}</div>
      </div>

      {isGuide && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, marginBottom: 6 }}>CURRENCY FOR THIS TOUR</div>
          <div className="tl-pill-row">{CURRENCIES.map((c) => (<div key={c} className="tl-pill" style={{ cursor: "pointer", background: currency === c ? "var(--saffron)" : "var(--sand-deep)" }} onClick={() => setCurrency(c)}>{c}</div>))}</div>
        </div>
      )}
      <div className="tl-card">
        <div className="tl-card-title"><Wallet size={16} color="var(--saffron-deep)" /> Shared expenses</div>
        {expenses.length === 0 && <div className="tl-empty">No expenses logged yet.</div>}
        {expenses.map((e) => (
          <div className="tl-row" key={e.id}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{e.desc}</div>
              <div style={{ fontSize: 11.5, color: "rgba(27,30,61,0.55)" }}>Paid by {e.paidBy} · {e.time}</div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{currency}{Number(e.amount).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <button className="tl-primary-btn" onClick={() => setShowForm(true)}><Plus size={16} /> Add expense</button>

      {showForm && (
        <div className="tl-modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="tl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tl-modal-handle" />
            <div className="tl-display" style={{ fontWeight: 700, fontSize: 17, marginBottom: 12 }}>Add expense</div>
            <div className="tl-field"><label>What for</label><input className="tl-input" style={{ fontFamily: "Inter" }} placeholder="e.g. Boat ride tickets" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
            <div className="tl-field"><label>Amount ({currency})</label><input className="tl-input" style={{ fontFamily: "Inter" }} type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <button className="tl-primary-btn" disabled={!desc || !amount}
              onClick={() => { addExpense({ desc, amount, paidBy: me.name }); setDesc(""); setAmount(""); setShowForm(false); }}>Save expense</button>
          </div>
        </div>
      )}
    </div>
  );
}

function GallerySection({ gallery, me, addGalleryPost }) {
  const [caption, setCaption] = useState("");
  return (
    <div>
      <div className="tl-card">
        <div className="tl-card-title"><ImageIcon size={16} color="var(--saffron-deep)" /> Trip moments</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="tl-input" style={{ fontFamily: "Inter" }} placeholder="Caption a moment from today…" value={caption} onChange={(e) => setCaption(e.target.value)} />
          <button className="tl-send-btn" style={{ borderRadius: 12 }} onClick={() => { if (caption.trim()) { addGalleryPost(caption.trim()); setCaption(""); } }}><Plus size={16} /></button>
        </div>
      </div>
      {gallery.length === 0 && <div className="tl-empty">No moments shared yet — be the first.</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {gallery.map((g) => (
          <div key={g.id} style={{ borderRadius: 14, padding: 14, minHeight: 100, background: g.color, color: "white", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.3 }}>{g.caption}</div>
            <div style={{ fontSize: 10, opacity: 0.85, marginTop: 4 }}>{g.by} · {g.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentsSection({ documents, me, isGuide, addDocument }) {
  const [title, setTitle] = useState("");
  const commonDocs = ["Passport Copy", "Visa", "Flight Ticket", "Hotel Voucher", "Insurance", "Tour Brochure"];
  return (
    <div>
      <div className="tl-card">
        <div className="tl-card-title"><FileText size={16} color="var(--saffron-deep)" /> Travel documents</div>
        <div style={{ fontSize: 11.5, color: "rgba(27,30,61,0.55)", marginBottom: 10 }}>Text records for this demo — attach the real files in your own document store.</div>
        {documents.length === 0 && <div className="tl-empty">Nothing added yet.</div>}
        {documents.map((d) => (
          <div className="tl-row" key={d.id}>
            <div className="tl-avatar" style={{ background: "var(--saffron)", color: "var(--ink)" }}><FileText size={16} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{d.title}</div>
              <div style={{ fontSize: 11.5, color: "rgba(27,30,61,0.55)" }}>Added by {d.addedBy}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="tl-pill-row" style={{ marginBottom: 10 }}>
        {commonDocs.map((d) => <div key={d} className="tl-pill" style={{ cursor: "pointer" }} onClick={() => addDocument(d, "reference")}>+ {d}</div>)}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="tl-input" style={{ fontFamily: "Inter" }} placeholder="Custom document title…" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button className="tl-send-btn" style={{ borderRadius: 12 }} onClick={() => { if (title.trim()) { addDocument(title.trim(), "custom"); setTitle(""); } }}><Plus size={16} /></button>
      </div>
    </div>
  );
}
