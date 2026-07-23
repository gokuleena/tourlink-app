import React, { useState, useEffect, useRef, useCallback } from "react";
import { storage } from "./lib/storage.js";
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
  min-height:600px;
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
  min-height:600px;
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
.tl-app{background:var(--sand);min-height:600px;display:flex;flex-direction:column;}
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

.tl-content{flex:1;overflow-y:auto;padding:16px 16px 90px;}
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
function genCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let s = "";
  for (let i = 0; i < 4; i++) s += letters[Math.floor(Math.random() * letters.length)];
  const nums = Math.floor(1000 + Math.random() * 9000);
  return `${s}-${nums}`;
}
function initials(name) {
  return (name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}
function timeNow() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

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

const DEFAULT_ITINERARY = [
  { id: uid(), day: 1, time: "05:30", title: "Departure from base camp", location: "Meeting Point", notes: "Carry water bottle & ID", type: "bus" },
  { id: uid(), day: 1, time: "08:00", title: "Breakfast halt", location: "Highway Dhaba", notes: "30 min stop", type: "meal" },
  { id: uid(), day: 1, time: "12:30", title: "Hotel check-in", location: "Hotel Ganga Residency", notes: "Rooms allotted at desk", type: "hotel" },
  { id: uid(), day: 1, time: "17:00", title: "Evening darshan", location: "Main Temple", notes: "Dress code: traditional", type: "sight" },
  { id: uid(), day: 2, time: "04:30", title: "Early morning aarti", location: "Ghat", notes: "Meet at lobby", type: "sight" },
];

const ITEM_ICON = { bus: Bus, meal: Utensils, hotel: Hotel, sight: Sunrise };

export default function TourLinkApp() {
  const [stage, setStage] = useState("loading"); // loading | onboard | app
  const [role, setRole] = useState("member");
  const [name, setName] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [tourName, setTourName] = useState("");
  const [error, setError] = useState("");
  const [tour, setTour] = useState(null); // {code, name, guideName}
  const [me, setMe] = useState(null); // {id, name, role}
  const [tab, setTab] = useState("home");

  const [members, setMembers] = useState([]);
  const [chat, setChat] = useState([]);
  const [itinerary, setItinerary] = useState(DEFAULT_ITINERARY);
  const [sos, setSos] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [showSosModal, setShowSosModal] = useState(false);
  const [attendanceSession, setAttendanceSession] = useState({ active: false, stopTitle: "", startTimestamp: null });
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  // ---- restore local session ----
  useEffect(() => {
    (async () => {
      const session = await storeGet("tl-session", false);
      if (session && session.code) {
        setTour({ code: session.code, name: session.tourName, guideName: session.guideName });
        setMe({ id: session.myId, name: session.myName, role: session.myRole });
        setRole(session.myRole);
        setStage("app");
      } else {
        setStage("onboard");
      }
    })();
  }, []);

  // ---- poll shared data while in app ----
  const pull = useCallback(async () => {
    if (!tour) return;
    const c = tour.code;
    const [m, ch, it, so, ex, ga, doc, asess, ahist] = await Promise.all([
      storeGet(`tour:${c}:members`, true),
      storeGet(`tour:${c}:chat`, true),
      storeGet(`tour:${c}:itinerary`, true),
      storeGet(`tour:${c}:sos`, true),
      storeGet(`tour:${c}:expenses`, true),
      storeGet(`tour:${c}:gallery`, true),
      storeGet(`tour:${c}:documents`, true),
      storeGet(`tour:${c}:attendanceSession`, true),
      storeGet(`tour:${c}:attendanceHistory`, true),
    ]);
    if (m) setMembers(m);
    if (ch) setChat(ch);
    if (it) setItinerary(it);
    if (so) setSos(so);
    if (ex) setExpenses(ex);
    if (ga) setGallery(ga);
    if (doc) setDocuments(doc);
    if (asess) setAttendanceSession(asess);
    if (ahist) setAttendanceHistory(ahist);
  }, [tour]);

  useEffect(() => {
    if (stage !== "app" || !tour) return;
    pull();
    const iv = setInterval(pull, 4000);
    return () => clearInterval(iv);
  }, [stage, tour, pull]);

  async function createTour() {
    setError("");
    if (!name.trim()) return setError("Enter your name to continue.");
    if (!tourName.trim()) return setError("Give your tour a name.");
    const code = genCode();
    const myId = uid();
    const meObj = { id: myId, name: name.trim(), role: "guide", checkedIn: true, battery: 92, lat: 0.5, lng: 0.5, lastSeen: timeNow() };
    await storeSet(`tour:${code}`, { name: tourName.trim(), guideName: name.trim(), createdAt: Date.now() }, true);
    await storeSet(`tour:${code}:members`, [meObj], true);
    await storeSet(`tour:${code}:itinerary`, DEFAULT_ITINERARY, true);
    await storeSet(`tour:${code}:chat`, [{ id: uid(), sender: "TourLink", text: `Tour "${tourName.trim()}" created. Share code ${code} with your group.`, time: timeNow(), system: true }], true);
    await storeSet(`tour:${code}:sos`, [], true);
    await storeSet(`tour:${code}:expenses`, [], true);
    await storeSet(`tour:${code}:gallery`, [], true);
    await storeSet(`tour:${code}:documents`, [], true);
    await storeSet(`tour:${code}:attendanceSession`, { active: false, stopTitle: "", startTimestamp: null }, true);
    await storeSet(`tour:${code}:attendanceHistory`, [], true);
    await storeSet("tl-session", { code, tourName: tourName.trim(), guideName: name.trim(), myId, myName: name.trim(), myRole: "guide" }, false);
    setTour({ code, name: tourName.trim(), guideName: name.trim() });
    setMe({ id: myId, name: name.trim(), role: "guide" });
    setMembers([meObj]);
    setItinerary(DEFAULT_ITINERARY);
    setStage("app");
  }

  async function joinTour() {
    setError("");
    if (!name.trim()) return setError("Enter your name to continue.");
    const code = codeInput.trim().toUpperCase();
    if (!code) return setError("Enter the tour joining code.");
    const t = await storeGet(`tour:${code}`, true);
    if (!t) return setError("No tour found with that code. Check with your guide.");
    const myId = uid();
    const existing = (await storeGet(`tour:${code}:members`, true)) || [];
    const meObj = { id: myId, name: name.trim(), role: "member", checkedIn: false, battery: Math.floor(60 + Math.random() * 40), lat: Math.random(), lng: Math.random(), lastSeen: timeNow() };
    const updated = [...existing, meObj];
    await storeSet(`tour:${code}:members`, updated, true);
    const chatNow = (await storeGet(`tour:${code}:chat`, true)) || [];
    await storeSet(`tour:${code}:chat`, [...chatNow, { id: uid(), sender: "TourLink", text: `${name.trim()} joined the tour.`, time: timeNow(), system: true }], true);
    await storeSet("tl-session", { code, tourName: t.name, guideName: t.guideName, myId, myName: name.trim(), myRole: "member" }, false);
    setTour({ code, name: t.name, guideName: t.guideName });
    setMe({ id: myId, name: name.trim(), role: "member" });
    setMembers(updated);
    setStage("app");
  }

  async function leaveTour() {
    await storeSet("tl-session", null, false);
    setStage("onboard");
    setTour(null);
    setMe(null);
    setTab("home");
  }

  async function sendMessage(text) {
    if (!text.trim() || !tour) return;
    const newMsg = { id: uid(), sender: me.name, senderId: me.id, text: text.trim(), time: timeNow() };
    const updated = [...chat, newMsg];
    setChat(updated);
    await storeSet(`tour:${tour.code}:chat`, updated, true);
  }

  async function fileSos(typeId) {
    const type = EMERGENCY_TYPES.find((e) => e.id === typeId);
    const entry = {
      id: uid(),
      member: me.name,
      memberId: me.id,
      type: type.label,
      time: timeNow(),
      resolved: false,
      battery: members.find((m) => m.id === me.id)?.battery ?? 80,
    };
    const updated = [entry, ...sos];
    setSos(updated);
    await storeSet(`tour:${tour.code}:sos`, updated, true);
    const chatMsg = { id: uid(), sender: "TourLink", text: `🚨 SOS from ${me.name}: ${type.label}. Guide and nearby members notified.`, time: timeNow(), system: true };
    const updatedChat = [...chat, chatMsg];
    setChat(updatedChat);
    await storeSet(`tour:${tour.code}:chat`, updatedChat, true);
    setShowSosModal(false);
  }

  async function resolveSos(id) {
    const updated = sos.map((s) => (s.id === id ? { ...s, resolved: true } : s));
    setSos(updated);
    await storeSet(`tour:${tour.code}:sos`, updated, true);
  }

  async function toggleCheckIn(memberId) {
    const updated = members.map((m) =>
      m.id === memberId ? { ...m, checkedIn: !m.checkedIn, checkInTimestamp: !m.checkedIn ? Date.now() : null, late: false } : m
    );
    setMembers(updated);
    await storeSet(`tour:${tour.code}:members`, updated, true);
  }

  // ---- Smart attendance: QR/GPS-style checkpoint session ----
  const LATE_THRESHOLD_MS = 3 * 60 * 1000; // 3 min after checkpoint opens counts as "late" in this demo

  async function startAttendanceCheckpoint(stopTitle) {
    const startTimestamp = Date.now();
    const session = { active: true, stopTitle: stopTitle || "Headcount", startTimestamp };
    setAttendanceSession(session);
    await storeSet(`tour:${tour.code}:attendanceSession`, session, true);
    const resetMembers = members.map((m) => (m.role === "guide" ? m : { ...m, checkedIn: false, checkInTimestamp: null, late: false }));
    setMembers(resetMembers);
    await storeSet(`tour:${tour.code}:members`, resetMembers, true);
    const msg = { id: uid(), sender: "TourLink", text: `📍 Attendance opened for "${session.stopTitle}". Check in from the Members tab.`, time: timeNow(), system: true };
    const updatedChat = [...chat, msg];
    setChat(updatedChat);
    await storeSet(`tour:${tour.code}:chat`, updatedChat, true);
  }

  async function closeAttendanceCheckpoint() {
    const nonGuide = members.filter((m) => m.role !== "guide");
    const present = nonGuide.filter((m) => m.checkedIn && !m.late).length;
    const late = nonGuide.filter((m) => m.checkedIn && m.late).length;
    const absent = nonGuide.filter((m) => !m.checkedIn);
    const record = {
      id: uid(),
      stopTitle: attendanceSession.stopTitle,
      time: timeNow(),
      total: nonGuide.length,
      present,
      late,
      absentNames: absent.map((m) => m.name),
    };
    const updatedHistory = [record, ...attendanceHistory];
    setAttendanceHistory(updatedHistory);
    await storeSet(`tour:${tour.code}:attendanceHistory`, updatedHistory, true);
    const session = { active: false, stopTitle: "", startTimestamp: null };
    setAttendanceSession(session);
    await storeSet(`tour:${tour.code}:attendanceSession`, session, true);
    if (absent.length > 0) {
      const msg = { id: uid(), sender: "TourLink", text: `🚌 Departure lock: ${absent.length} member${absent.length > 1 ? "s" : ""} not checked in for "${record.stopTitle}" — ${absent.map((m) => m.name).join(", ")}.`, time: timeNow(), system: true };
      const updatedChat = [...chat, msg];
      setChat(updatedChat);
      await storeSet(`tour:${tour.code}:chat`, updatedChat, true);
    }
  }

  async function selfCheckIn() {
    if (!attendanceSession.active) return;
    const now = Date.now();
    const isLate = attendanceSession.startTimestamp && (now - attendanceSession.startTimestamp > LATE_THRESHOLD_MS);
    const updated = members.map((m) =>
      m.id === me.id ? { ...m, checkedIn: true, checkInTimestamp: now, late: isLate, lastSeen: timeNow() } : m
    );
    setMembers(updated);
    await storeSet(`tour:${tour.code}:members`, updated, true);
  }

  // ---- Test tools: exercise the app solo, without needing a second device ----
  const MOCK_NAMES = ["Priya Sharma", "Rahul Verma", "Ananya Iyer", "Vikram Rao", "Fatima Khan", "Joseph Thomas", "Meera Nair", "Arjun Pillai", "Divya Krishnan", "Sanjay Reddy"];

  async function addMockMembers(count) {
    const used = new Set(members.map((m) => m.name));
    const pool = MOCK_NAMES.filter((n) => !used.has(n));
    const picks = pool.sort(() => Math.random() - 0.5).slice(0, count);
    const newMembers = picks.map((nm) => {
      const checkedIn = Math.random() > 0.4;
      return {
        id: uid(), name: nm, role: "member",
        checkedIn, checkInTimestamp: checkedIn ? Date.now() : null,
        late: checkedIn && Math.random() > 0.7,
        battery: Math.floor(15 + Math.random() * 85),
        lat: Math.random(), lng: Math.random(), lastSeen: timeNow(),
      };
    });
    if (newMembers.length === 0) return;
    const updated = [...members, ...newMembers];
    setMembers(updated);
    await storeSet(`tour:${tour.code}:members`, updated, true);
  }

  async function triggerTestSos() {
    const pool = members.filter((m) => m.role !== "guide");
    if (pool.length === 0) return;
    const m = pool[Math.floor(Math.random() * pool.length)];
    const type = EMERGENCY_TYPES[Math.floor(Math.random() * EMERGENCY_TYPES.length)];
    const entry = { id: uid(), member: m.name, memberId: m.id, type: type.label, time: timeNow(), resolved: false, battery: m.battery ?? 80 };
    const updated = [entry, ...sos];
    setSos(updated);
    await storeSet(`tour:${tour.code}:sos`, updated, true);
    const chatMsg = { id: uid(), sender: "TourLink", text: `🚨 [Test] SOS from ${m.name}: ${type.label}.`, time: timeNow(), system: true };
    const updatedChat = [...chat, chatMsg];
    setChat(updatedChat);
    await storeSet(`tour:${tour.code}:chat`, updatedChat, true);
  }

  async function seedTestChat() {
    const samples = ["Are we leaving on time?", "Can someone share the hotel address?", "Loved the sunrise view today!", "What time is dinner?", "Is the bus AC working today?"];
    const pool = members.filter((m) => m.id !== me.id);
    const msgs = samples.map((s) => {
      const sender = pool.length ? pool[Math.floor(Math.random() * pool.length)] : { name: "Test Member", id: uid() };
      return { id: uid(), sender: sender.name, senderId: sender.id, text: s, time: timeNow() };
    });
    const updated = [...chat, ...msgs];
    setChat(updated);
    await storeSet(`tour:${tour.code}:chat`, updated, true);
  }

  async function resetTourData() {
    const resetMembers = members.map((m) =>
      m.role === "guide" ? { ...m, checkedIn: true, checkInTimestamp: null, late: false } : { ...m, checkedIn: false, checkInTimestamp: null, late: false }
    );
    setMembers(resetMembers);
    await storeSet(`tour:${tour.code}:members`, resetMembers, true);
    setSos([]);
    await storeSet(`tour:${tour.code}:sos`, [], true);
    setAttendanceHistory([]);
    await storeSet(`tour:${tour.code}:attendanceHistory`, [], true);
    const session = { active: false, stopTitle: "", startTimestamp: null };
    setAttendanceSession(session);
    await storeSet(`tour:${tour.code}:attendanceSession`, session, true);
    const msg = { id: uid(), sender: "TourLink", text: "🧪 Test data reset. Attendance, SOS log and history cleared.", time: timeNow(), system: true };
    const updatedChat = [...chat, msg];
    setChat(updatedChat);
    await storeSet(`tour:${tour.code}:chat`, updatedChat, true);
  }

  async function notifyMissing(memberName) {
    const msg = { id: uid(), sender: "TourLink", text: `⏰ Reminder sent to ${memberName}: please check in with your guide.`, time: timeNow(), system: true };
    const updated = [...chat, msg];
    setChat(updated);
    await storeSet(`tour:${tour.code}:chat`, updated, true);
  }

  async function notifyAllMissing(names) {
    const msg = { id: uid(), sender: "TourLink", text: `⏰ Missing headcount reminder sent to: ${names.join(", ")}.`, time: timeNow(), system: true };
    const updated = [...chat, msg];
    setChat(updated);
    await storeSet(`tour:${tour.code}:chat`, updated, true);
  }

  async function addItineraryItem(item) {
    const updated = [...itinerary, { ...item, id: uid() }];
    setItinerary(updated);
    await storeSet(`tour:${tour.code}:itinerary`, updated, true);
  }

  async function addExpense(exp) {
    const updated = [{ ...exp, id: uid(), time: timeNow() }, ...expenses];
    setExpenses(updated);
    await storeSet(`tour:${tour.code}:expenses`, updated, true);
  }

  async function addGalleryPost(caption) {
    const palette = ["#E8871E", "#1F6F78", "#C96A0C", "#2C3060", "#3B8256"];
    const updated = [{ id: uid(), caption, by: me.name, time: timeNow(), color: palette[Math.floor(Math.random() * palette.length)] }, ...gallery];
    setGallery(updated);
    await storeSet(`tour:${tour.code}:gallery`, updated, true);
  }

  async function addDocument(title, type) {
    const updated = [{ id: uid(), title, type, addedBy: me.name }, ...documents];
    setDocuments(updated);
    await storeSet(`tour:${tour.code}:documents`, updated, true);
  }

  if (stage === "loading") {
    return (
      <div className="tl-root">
        <style>{STYLES}</style>
        <div style={{ padding: 60, textAlign: "center", color: "var(--sand)", background: "var(--ink)", minHeight: 600 }}>Loading TourLink…</div>
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
          <div className="tl-hero-sub">Chat, itinerary, live check-ins and a one-tap SOS — replacing the WhatsApp group and the paper itinerary with one place your whole tour can rely on.</div>

          <div className="tl-role-row">
            <div className={`tl-role-btn ${role === "guide" ? "active" : ""}`} onClick={() => setRole("guide")}>
              Tour Guide
              <div className="sub">Create a tour, manage the group</div>
            </div>
            <div className={`tl-role-btn ${role === "member" ? "active" : ""}`} onClick={() => setRole("member")}>
              Tour Member
              <div className="sub">Join with a code</div>
            </div>
          </div>

          <div className="tl-field">
            <label>Your name</label>
            <input className="tl-input" style={{ fontFamily: "Inter, sans-serif" }} placeholder="e.g. Asha Menon" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {role === "guide" ? (
            <div className="tl-field">
              <label>Tour name</label>
              <input className="tl-input" style={{ fontFamily: "Inter, sans-serif" }} placeholder="e.g. Char Dham Yatra — Aug Batch" value={tourName} onChange={(e) => setTourName(e.target.value)} />
            </div>
          ) : (
            <div className="tl-field">
              <label>Tour joining code</label>
              <input className="tl-input" placeholder="ABCD-4721" value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())} />
            </div>
          )}

          {error && <div className="tl-err">{error}</div>}

          <button className="tl-primary-btn" onClick={role === "guide" ? createTour : joinTour}>
            {role === "guide" ? <>Create tour <ChevronRight size={16} /></> : <>Join tour <ChevronRight size={16} /></>}
          </button>
          <div style={{ fontSize: 11, color: "var(--sand-deep)", opacity: 0.65, textAlign: "center", marginTop: 14 }}>
            Demo note: tour data is stored under your joining code and visible to anyone who joins with it.
          </div>
        </div>
      </div>
    );
  }

  // ---- MAIN APP ----
  const isGuide = me.role === "guide";
  const checkedInCount = members.filter((m) => m.checkedIn).length;
  const activeSos = sos.filter((s) => !s.resolved);

  return (
    <div className="tl-root">
      <style>{STYLES}</style>
      <div className="tl-app">
        <div className="tl-topbar">
          <div>
            <div className="tl-topbar-tour">{tour.name}</div>
            <div className="tl-topbar-role">{isGuide ? "Guide" : "Member"} · {tour.code}</div>
          </div>
          <div className="tl-topbar-icon" onClick={leaveTour}><LogOut size={16} /></div>
        </div>

        <div className="tl-content">
          {tab === "home" && (
            <HomeTab me={me} isGuide={isGuide} tour={tour} members={members} itinerary={itinerary}
              activeSos={activeSos} resolveSos={resolveSos} checkedInCount={checkedInCount} setTab={setTab}
              attendanceSession={attendanceSession} selfCheckIn={selfCheckIn} />
          )}
          {tab === "chat" && <ChatTab chat={chat} me={me} onSend={sendMessage} />}
          {tab === "itinerary" && <ItineraryTab itinerary={itinerary} isGuide={isGuide} onAdd={addItineraryItem} />}
          {tab === "map" && <MapTab members={members} me={me} />}
          {tab === "more" && (
            <MoreTab members={members} me={me} isGuide={isGuide} toggleCheckIn={toggleCheckIn}
              attendanceSession={attendanceSession} attendanceHistory={attendanceHistory}
              startAttendanceCheckpoint={startAttendanceCheckpoint} closeAttendanceCheckpoint={closeAttendanceCheckpoint}
              selfCheckIn={selfCheckIn}
              notifyMissing={notifyMissing} notifyAllMissing={notifyAllMissing}
              expenses={expenses} addExpense={addExpense}
              gallery={gallery} addGalleryPost={addGalleryPost}
              documents={documents} addDocument={addDocument}
              tour={tour} itinerary={itinerary}
              addMockMembers={addMockMembers} triggerTestSos={triggerTestSos}
              seedTestChat={seedTestChat} resetTourData={resetTourData} sos={sos} />
          )}
        </div>

        <button className="tl-sos-fab" onClick={() => setShowSosModal(true)}>
          <AlertTriangle size={20} />
          SOS
        </button>

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
              <div style={{ fontSize: 12.5, color: "rgba(27,30,61,0.6)", marginBottom: 4 }}>
                Your guide, assistant guide and emergency contacts will get your location, battery and alert type instantly.
              </div>
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
              <button className="tl-ghost-btn" onClick={() => setShowSosModal(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- HOME ---------------- */
function HomeTab({ me, isGuide, tour, members, itinerary, activeSos, resolveSos, checkedInCount, setTab, attendanceSession, selfCheckIn }) {
  const nextItem = itinerary.slice().sort((a, b) => (a.day - b.day) || a.time.localeCompare(b.time))[0];
  const missingCount = members.filter((m) => !m.checkedIn && m.role !== "guide").length;
  const myEntry = members.find((m) => m.id === me.id);
  const needsCheckIn = !isGuide && attendanceSession?.active && myEntry && !myEntry.checkedIn;

  return (
    <div>
      {needsCheckIn && (
        <div className="tl-alert-banner" style={{ background: "rgba(31,111,120,0.1)", borderColor: "rgba(31,111,120,0.35)" }}>
          <CheckCircle2 size={18} color="var(--teal)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: "var(--teal)" }}>Attendance open: {attendanceSession.stopTitle}</div>
            <div style={{ fontSize: 12, color: "rgba(27,30,61,0.65)", marginTop: 2, marginBottom: 8 }}>Tap to check in — simulates a QR scan at this meeting point.</div>
            <button className="tl-primary-btn" style={{ background: "var(--teal)", color: "white" }} onClick={selfCheckIn}>Check in now</button>
          </div>
        </div>
      )}

      {isGuide && missingCount > 0 && (
        <div className="tl-alert-banner" style={{ cursor: "pointer" }} onClick={() => setTab("more")}>
          <Search size={18} color="var(--alert)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: "var(--alert)" }}>{missingCount} member{missingCount > 1 ? "s" : ""} not checked in</div>
            <div style={{ fontSize: 12, color: "rgba(27,30,61,0.65)", marginTop: 2 }}>Tap to see who's missing and send a reminder</div>
          </div>
          <ChevronRight size={16} color="var(--alert)" />
        </div>
      )}

      {activeSos.length > 0 && (
        <div className="tl-alert-banner">
          <Radio size={18} color="var(--alert)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: "var(--alert)", marginBottom: 3 }}>{activeSos.length} active SOS alert{activeSos.length > 1 ? "s" : ""}</div>
            {activeSos.map((s) => (
              <div key={s.id} style={{ fontSize: 12.5, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{s.member} — {s.type} · {s.time}</span>
                {isGuide && <button onClick={() => resolveSos(s.id)} style={{ fontSize: 10.5, fontWeight: 700, background: "var(--success)", color: "white", border: "none", borderRadius: 8, padding: "4px 8px", cursor: "pointer" }}>Resolve</button>}
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
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{nextItem.location} · Day {nextItem.day}</div>
          </>
        ) : (
          <div style={{ fontSize: 13 }}>No itinerary yet — add your first stop.</div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div className="tl-card" style={{ flex: 1, marginBottom: 0, textAlign: "center" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700 }}>{checkedInCount}/{members.length}</div>
          <div style={{ fontSize: 11, color: "rgba(27,30,61,0.6)" }}>Checked in</div>
        </div>
        <div className="tl-card" style={{ flex: 1, marginBottom: 0, textAlign: "center" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700 }}>28°C</div>
          <div style={{ fontSize: 11, color: "rgba(27,30,61,0.6)" }}>Clear skies</div>
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

/* ---------------- ITINERARY ---------------- */
function ItineraryTab({ itinerary, isGuide, onAdd }) {
  const days = [...new Set(itinerary.map((i) => i.day))].sort((a, b) => a - b);
  const [activeDay, setActiveDay] = useState(days[0] || 1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ time: "", title: "", location: "", notes: "", type: "sight", day: activeDay });

  const items = itinerary.filter((i) => i.day === activeDay).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div>
      <div className="tl-segment">
        {days.map((d) => (
          <div key={d} className={`tl-day-tab ${activeDay === d ? "active" : ""}`} onClick={() => setActiveDay(d)}>Day {d}</div>
        ))}
        <div className="tl-day-tab" style={{ background: "white", border: "1px dashed var(--line)" }}
          onClick={() => setActiveDay(Math.max(...days, 0) + 1)}>+ Day</div>
      </div>

      <div className="tl-card">
        {items.length === 0 && <div className="tl-empty">Nothing planned for this day yet.</div>}
        {items.map((it, idx) => {
          const Icon = ITEM_ICON[it.type] || Sunrise;
          return (
            <div className="tl-timeline-item" key={it.id}>
              <div className="tl-timeline-rail">
                <div className="tl-timeline-dot" />
                {idx < items.length - 1 && <div className="tl-timeline-line" />}
              </div>
              <div className="tl-timeline-body">
                <div className="tl-timeline-time">{it.time}</div>
                <div className="tl-timeline-title">{it.title}</div>
                <div className="tl-timeline-meta"><Icon size={12} /> {it.location}</div>
                {it.notes && <div style={{ fontSize: 11.5, color: "rgba(27,30,61,0.55)", marginTop: 3 }}>{it.notes}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {isGuide && (
        <button className="tl-primary-btn" onClick={() => { setForm({ time: "", title: "", location: "", notes: "", type: "sight", day: activeDay }); setShowForm(true); }}>
          <Plus size={16} /> Add itinerary stop
        </button>
      )}

      {showForm && (
        <div className="tl-modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="tl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tl-modal-handle" />
            <div className="tl-display" style={{ fontWeight: 700, fontSize: 17, marginBottom: 12 }}>Add stop — Day {activeDay}</div>
            <div className="tl-field"><label>Time</label><input className="tl-input" style={{ fontFamily: "Inter" }} type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
            <div className="tl-field"><label>Title</label><input className="tl-input" style={{ fontFamily: "Inter" }} placeholder="e.g. Temple darshan" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="tl-field"><label>Location</label><input className="tl-input" style={{ fontFamily: "Inter" }} placeholder="e.g. Main Temple Gate" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="tl-field"><label>Notes (optional)</label><input className="tl-input" style={{ fontFamily: "Inter" }} placeholder="Dress code, reminders…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="tl-field">
              <label>Type</label>
              <div className="tl-pill-row">
                {["sight", "bus", "meal", "hotel"].map((t) => (
                  <div key={t} className="tl-pill" style={{ cursor: "pointer", background: form.type === t ? "var(--saffron)" : "var(--sand-deep)" }} onClick={() => setForm({ ...form, type: t })}>{t}</div>
                ))}
              </div>
            </div>
            <button className="tl-primary-btn" disabled={!form.time || !form.title}
              onClick={() => { onAdd({ ...form, day: activeDay }); setShowForm(false); }}>Add to itinerary</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- MAP (simulated positions) ---------------- */
function MapTab({ members, me }) {
  return (
    <div>
      <div className="tl-card-title"><Navigation2 size={16} color="var(--saffron-deep)" /> Live group positions</div>
      <div style={{ fontSize: 11.5, color: "rgba(27,30,61,0.55)", marginBottom: 10 }}>Simulated positions relative to the meeting point, for demo purposes.</div>
      <div className="tl-map">
        <div className="tl-map-center"><MapPin size={22} /></div>
        {members.map((m) => (
          <div key={m.id} className="tl-map-pin" style={{ left: `${20 + (m.lng ?? Math.random()) * 60}%`, top: `${20 + (m.lat ?? Math.random()) * 60}%` }}>
            <div className={`tl-map-dot ${m.role === "guide" ? "guide" : ""}`}>{initials(m.name)}</div>
            <div className="tl-map-label">{m.name.split(" ")[0]}</div>
          </div>
        ))}
      </div>
      <div className="tl-card" style={{ marginTop: 14 }}>
        {members.map((m) => (
          <div className="tl-row" key={m.id}>
            <div className="tl-avatar">{initials(m.name)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{m.name}{m.id === me.id ? " (You)" : ""}</div>
              <div style={{ fontSize: 11.5, color: "rgba(27,30,61,0.55)" }}>Last updated {m.lastSeen || "just now"}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: (m.battery ?? 80) < 25 ? "var(--alert)" : "rgba(27,30,61,0.6)" }}>
              <Battery size={13} /> {m.battery ?? 80}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- MORE (members/attendance, expenses, gallery, documents) ---------------- */
function MoreTab(props) {
  const { members, me, isGuide, toggleCheckIn,
    attendanceSession, attendanceHistory, startAttendanceCheckpoint, closeAttendanceCheckpoint, selfCheckIn,
    notifyMissing, notifyAllMissing,
    expenses, addExpense, gallery, addGalleryPost, documents, addDocument,
    tour, itinerary,
    addMockMembers, triggerTestSos, seedTestChat, resetTourData, sos } = props;
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
          itinerary={itinerary} />
      )}
      {section === "ai" && <AIAssistantSection tour={tour} itinerary={itinerary} members={members} me={me} />}
      {section === "translate" && <TranslatorSection />}
      {section === "expenses" && <ExpensesSection members={members} me={me} expenses={expenses} addExpense={addExpense} />}
      {section === "gallery" && <GallerySection gallery={gallery} me={me} addGalleryPost={addGalleryPost} />}
      {section === "documents" && <DocumentsSection documents={documents} me={me} isGuide={isGuide} addDocument={addDocument} />}
      {section === "test" && isGuide && (
        <TestToolsSection members={members} sos={sos} addMockMembers={addMockMembers}
          triggerTestSos={triggerTestSos} seedTestChat={seedTestChat} resetTourData={resetTourData} tour={tour} />
      )}
    </div>
  );
}

function TestToolsSection({ members, sos, addMockMembers, triggerTestSos, seedTestChat, resetTourData, tour }) {
  const [busy, setBusy] = useState("");
  async function run(name, fn) {
    setBusy(name);
    await fn();
    setBusy("");
  }
  const activeSosCount = sos.filter((s) => !s.resolved).length;

  return (
    <div>
      <div className="tl-ai-header" style={{ background: "linear-gradient(135deg,var(--ink) 0%, #3a3f6e 130%)" }}>
        <Sparkles size={20} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Test tools</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Exercise every flow solo, without a second phone. Shared with anyone else viewing tour {tour.code} — turn these off before a real trip by just not using this tab.</div>
        </div>
      </div>

      <div className="tl-card">
        <div className="tl-card-title"><Users size={16} color="var(--saffron-deep)" /> Current state</div>
        <div className="tl-pill-row">
          <div className="tl-pill">{members.length} members</div>
          <div className="tl-pill">{members.filter((m) => m.checkedIn).length} checked in</div>
          <div className="tl-pill" style={{ background: activeSosCount > 0 ? "rgba(214,69,69,0.18)" : "var(--sand-deep)", color: activeSosCount > 0 ? "var(--alert)" : "var(--ink)" }}>{activeSosCount} active SOS</div>
        </div>
      </div>

      <div className="tl-card">
        <div className="tl-card-title"><Plus size={16} color="var(--saffron-deep)" /> Seed test data</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="tl-ghost-btn" style={{ margin: 0 }} disabled={busy === "members"} onClick={() => run("members", () => addMockMembers(3))}>
            {busy === "members" ? "Adding…" : "Add 3 mock members"}
          </button>
          <button className="tl-ghost-btn" style={{ margin: 0 }} disabled={busy === "chat"} onClick={() => run("chat", seedTestChat)}>
            {busy === "chat" ? "Posting…" : "Post 5 sample chat messages"}
          </button>
          <button className="tl-ghost-btn" style={{ margin: 0, borderColor: "var(--alert)", color: "var(--alert)" }} disabled={busy === "sos"} onClick={() => run("sos", triggerTestSos)}>
            {busy === "sos" ? "Sending…" : "Trigger a random test SOS"}
          </button>
        </div>
      </div>

      <div className="tl-card">
        <div className="tl-card-title"><AlertTriangle size={16} color="var(--alert)" /> Reset</div>
        <div style={{ fontSize: 12, color: "rgba(27,30,61,0.6)", marginBottom: 10 }}>Clears check-ins, active SOS alerts, and attendance history for tour {tour.code}. Members list and itinerary stay intact.</div>
        <button className="tl-primary-btn" style={{ background: "var(--alert)" }} disabled={busy === "reset"} onClick={() => run("reset", resetTourData)}>
          {busy === "reset" ? "Resetting…" : "Reset attendance & SOS test data"}
        </button>
      </div>

      <div className="tl-card">
        <div className="tl-card-title"><FileText size={16} color="var(--saffron-deep)" /> Manual test checklist</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.7, color: "rgba(27,30,61,0.75)" }}>
          1. Add mock members, then open a second browser tab, join with code <strong>{tour.code}</strong> as a member, to see live sync.<br/>
          2. Start an attendance checkpoint here, check in from the other tab — confirm it shows Present, or Late after 3+ minutes.<br/>
          3. Trigger a test SOS and confirm the Home tab alert banner and Resolve button appear.<br/>
          4. Send a chat message from each tab and confirm both sides update within ~4 seconds.<br/>
          5. Ask the AI Assistant "what's today's schedule" and confirm it reflects your actual itinerary.<br/>
          6. Translate a travel phrase and confirm a translation plus pronunciation guide return.<br/>
          7. Close the checkpoint with someone still unchecked and confirm the departure-lock chat warning appears.
        </div>
      </div>
    </div>
  );
}

function MembersSection({ members, me, isGuide, toggleCheckIn, attendanceSession, attendanceHistory,
  startAttendanceCheckpoint, closeAttendanceCheckpoint, selfCheckIn, notifyMissing, notifyAllMissing, itinerary }) {
  const nonGuide = members.filter((m) => m.role !== "guide");
  const present = nonGuide.filter((m) => m.checkedIn && !m.late);
  const late = nonGuide.filter((m) => m.checkedIn && m.late);
  const missing = nonGuide.filter((m) => !m.checkedIn);
  const allPresent = missing.length === 0;
  const [stopName, setStopName] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const nextStopTitle = itinerary.slice().sort((a, b) => (a.day - b.day) || a.time.localeCompare(b.time))[0]?.title || "";

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
              <button className="tl-primary-btn" style={{ background: "var(--alert)" }} onClick={closeAttendanceCheckpoint}>
                Close checkpoint & lock departure
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 12.5, color: "rgba(27,30,61,0.6)", marginBottom: 10 }}>
                Open a checkpoint — members get a "check in now" prompt (simulating a QR/GPS scan), and anyone who joins more than 3 min in is flagged late.
              </div>
              <input className="tl-input" style={{ fontFamily: "Inter", marginBottom: 10 }}
                placeholder={nextStopTitle ? `e.g. ${nextStopTitle}` : "Checkpoint name"}
                value={stopName} onChange={(e) => setStopName(e.target.value)} />
              <button className="tl-primary-btn" onClick={() => { startAttendanceCheckpoint(stopName || nextStopTitle || "Headcount"); setStopName(""); }}>
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

      {isGuide && !allPresent && (
        <div className="tl-alert-banner">
          <AlertTriangle size={18} color="var(--alert)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: "var(--alert)", marginBottom: 8 }}>
              {missing.length} member{missing.length > 1 ? "s" : ""} not checked in
            </div>
            {missing.map((m) => (
              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontSize: 12.5 }}>
                <span>{m.name} <span style={{ opacity: 0.6 }}>· batt {m.battery ?? "—"}% · last seen {m.lastSeen || "—"}</span></span>
                <button onClick={() => notifyMissing(m.name)} style={{ fontSize: 10.5, fontWeight: 700, background: "var(--ink)", color: "var(--sand)", border: "none", borderRadius: 8, padding: "4px 8px", cursor: "pointer" }}>Notify</button>
              </div>
            ))}
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
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{m.name}{m.id === me.id ? " (You)" : ""}</div>
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
  "Hindi", "Tamil", "Kannada", "Malayalam", "Telugu", "Spanish", "French", "German",
  "Italian", "Portuguese", "Arabic", "Chinese (Mandarin)", "Japanese", "Korean",
  "Thai", "Russian", "Turkish", "Dutch", "Vietnamese", "Indonesian", "English",
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

function TranslatorSection() {
  const [text, setText] = useState("");
  const [lang, setLang] = useState("Hindi");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);

  async function translate(phrase) {
    const source = (phrase ?? text).trim();
    if (!source || loading) return;
    setLoading(true);
    setErrored(false);
    setResult(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:3001"}/api/claude`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-5",
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
          <select className="tl-input" style={{ fontFamily: "Inter" }} value={lang} onChange={(e) => setLang(e.target.value)}>
            {TRANSLATE_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
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

function AIAssistantSection({ tour, itinerary, members, me }) {
  const [messages, setMessages] = useState([
    { id: uid(), role: "assistant", text: `Namaste ${me.name.split(" ")[0]}! I'm your TourLink AI assistant for ${tour.name}. Ask me about today's schedule, translations, nearby places, packing tips, or what to do in an emergency.` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages.length, loading]);

  function buildSystemPrompt() {
    const itineraryText = itinerary
      .slice()
      .sort((a, b) => (a.day - b.day) || a.time.localeCompare(b.time))
      .map((i) => `Day ${i.day}, ${i.time} — ${i.title} @ ${i.location}${i.notes ? ` (${i.notes})` : ""}`)
      .join("\n");
    return `You are the in-app AI travel assistant inside TourLink, a group tour coordination app. You are helping a traveler on the tour "${tour.name}", guided by ${tour.guideName}. The group has ${members.length} members.

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-5",
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

function ExpensesSection({ members, me, expenses, addExpense }) {
  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const perHead = members.length ? total / members.length : 0;

  return (
    <div>
      <div className="tl-countdown-card" style={{ padding: 16 }}>
        <div className="tl-eyebrow" style={{ color: "var(--saffron)" }}>Trip total</div>
        <div className="tl-countdown-num">₹{total.toLocaleString("en-IN")}</div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>≈ ₹{perHead.toFixed(0)} per person, split evenly across {members.length}</div>
      </div>

      <div className="tl-card">
        <div className="tl-card-title"><Wallet size={16} color="var(--saffron-deep)" /> Shared expenses</div>
        {expenses.length === 0 && <div className="tl-empty">No expenses logged yet.</div>}
        {expenses.map((e) => (
          <div className="tl-row" key={e.id}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{e.desc}</div>
              <div style={{ fontSize: 11.5, color: "rgba(27,30,61,0.55)" }}>Paid by {e.paidBy} · {e.time}</div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>₹{Number(e.amount).toLocaleString("en-IN")}</div>
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
            <div className="tl-field"><label>Amount (₹)</label><input className="tl-input" style={{ fontFamily: "Inter" }} type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
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
