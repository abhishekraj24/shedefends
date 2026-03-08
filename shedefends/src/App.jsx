import { useState, useEffect, useRef, useCallback } from "react";

// ── Global styles ──────────────────────────────────────────────
const boot = () => {
  if (document.getElementById("sd8")) return;
  const s = document.createElement("style");
  s.id = "sd8";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700;800&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body,#root{min-height:100%;background:#060610}
    body{font-family:'DM Sans',system-ui,sans-serif;color:#f0f2ff;overflow-x:hidden}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#1a1a30}
    @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
    @keyframes glow{0%,100%{box-shadow:0 0 20px var(--c)}50%{box-shadow:0 0 40px var(--c)}}
    @keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
    .fu{animation:fadeUp .4s ease forwards}
    .fi{animation:fadeIn .3s ease forwards}
    .si{animation:slideIn .3s ease forwards}
    .btn{transition:all .15s;cursor:pointer;border:none;font-family:'DM Sans',system-ui,sans-serif}
    .btn:hover{filter:brightness(1.12);transform:translateY(-1px)}
    .btn:active{transform:translateY(0);filter:brightness(.95)}
    .card-hover{transition:all .2s}
    .card-hover:hover{transform:translateY(-3px);border-color:rgba(255,255,255,.12)!important}
  `;
  document.head.appendChild(s);
};

// ── Storage ────────────────────────────────────────────────────
const SK = "sd8";
const loadP = () => { try { return JSON.parse(localStorage.getItem(SK))||{}; } catch { return {}; } };
const saveP = d => { try { localStorage.setItem(SK, JSON.stringify(d)); } catch {} };
const todayStr = () => new Date().toISOString().split("T")[0];

// ══════════════════════════════════════════════════════════════
//  PHOTO ILLUSTRATION SYSTEM
//  Each step has:
//    photo: Unsplash URL showing the move
//    number: step number badge
//    focus: body part or concept (shown as label)
//    arrows: SVG overlay arrows showing direction of movement
// ══════════════════════════════════════════════════════════════

// Photo sets per technique from Unsplash (free, no auth needed)
const PHOTOS = {
  wrist_escape: [
    "https://images.unsplash.com/photo-1571019613914-85f342c6a11e?w=600&q=80", // hands/wrist
    "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=600&q=80", // grip/hand
    "https://images.unsplash.com/photo-1571019613914-85f342c6a11e?w=600&q=80",
    "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=600&q=80",
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80", // stance
  ],
  palm_strike: [
    "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=600&q=80", // boxing/strike
    "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=600&q=80",
    "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=600&q=80",
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
    "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=600&q=80",
  ],
  elbow_block: [
    "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=600&q=80",
    "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=600&q=80",
    "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=600&q=80",
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
    "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=600&q=80",
  ],
  awareness: [
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80", // woman aware
    "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=600&q=80", // scanning room
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80",
    "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=600&q=80",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80",
  ],
  choke_escape: [
    "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=600&q=80",
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
    "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=600&q=80",
    "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=600&q=80",
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
  ],
  hammer_fist: [
    "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=600&q=80",
    "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=600&q=80",
    "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=600&q=80",
    "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=600&q=80",
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
  ],
  knee_strike: [
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
    "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=600&q=80",
    "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=600&q=80",
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
    "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=600&q=80",
  ],
  ground_defense: [
    "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=600&q=80",
    "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=600&q=80",
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
    "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=600&q=80",
    "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=600&q=80",
  ],
};

// ══════════════════════════════════════════════════════════════
//  ILLUSTRATED DIAGRAM SYSTEM — SVG body diagrams per step
//  These are clean, readable body silhouette diagrams with
//  arrows showing EXACTLY what to do
// ══════════════════════════════════════════════════════════════

function BodyDiagram({ techId, stepIdx, color }) {
  // A set of clear SVG diagrams — stick figure style but clean and large
  const diagrams = {
    wrist_escape: [
      // Step 1: arms forward
      <svg key="we0" viewBox="0 0 200 280" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <circle cx="100" cy="35" r="22" stroke={color} strokeWidth="3" fill={color+"15"}/>
        {/* Body */}
        <line x1="100" y1="57" x2="100" y2="150" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        {/* Arms — stretched forward */}
        <line x1="100" y1="85" x2="40" y2="130" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="85" x2="160" y2="130" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        {/* Hands */}
        <circle cx="40" cy="133" r="7" stroke={color} strokeWidth="2.5" fill={color+"20"}/>
        <circle cx="160" cy="133" r="7" stroke={color} strokeWidth="2.5" fill={color+"20"}/>
        {/* Legs */}
        <line x1="100" y1="150" x2="75" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="150" x2="125" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="75" y1="220" x2="60" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="125" y1="220" x2="140" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        {/* Label */}
        <text x="100" y="268" textAnchor="middle" fill={color} fontSize="12" fontWeight="700" fontFamily="DM Sans, sans-serif">ARMS FORWARD</text>
        {/* Arrows pointing to hands */}
        <path d="M20 115 L38 128" stroke="#00e676" strokeWidth="2.5" markerEnd="url(#arr)" strokeDasharray="0"/>
        <path d="M180 115 L162 128" stroke="#00e676" strokeWidth="2.5" strokeDasharray="0"/>
        <polygon points="158,125 168,112 165,128" fill="#00e676"/>
        <polygon points="35,125 22,112 25,128" fill="#00e676"/>
        <text x="8" y="112" fill="#00e676" fontSize="9" fontWeight="700" fontFamily="DM Sans">PALMS</text>
        <text x="8" y="122" fill="#00e676" fontSize="9" fontWeight="700" fontFamily="DM Sans">DOWN</text>
        <text x="162" y="112" fill="#00e676" fontSize="9" fontWeight="700" fontFamily="DM Sans">PALMS</text>
        <text x="162" y="122" fill="#00e676" fontSize="9" fontWeight="700" fontFamily="DM Sans">DOWN</text>
      </svg>,
      // Step 2: find the thumb
      <svg key="we1" viewBox="0 0 200 280" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="35" r="22" stroke={color} strokeWidth="3" fill={color+"15"}/>
        <line x1="100" y1="57" x2="100" y2="150" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="85" x2="55" y2="120" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="85" x2="145" y2="120" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        {/* Grabbing hand (attacker) */}
        <rect x="30" y="115" width="32" height="18" rx="5" stroke="#ff4d6d" strokeWidth="2" fill="#ff4d6d22"/>
        <text x="46" y="128" textAnchor="middle" fill="#ff4d6d" fontSize="8" fontWeight="700" fontFamily="DM Sans">GRAB</text>
        {/* Your hand */}
        <circle cx="145" cy="123" r="8" stroke={color} strokeWidth="2.5" fill={color+"20"}/>
        {/* Thumb indicator */}
        <circle cx="34" cy="116" r="5" stroke="#ffdd57" strokeWidth="2" fill="#ffdd5722"/>
        <path d="M14 98 L32 114" stroke="#ffdd57" strokeWidth="2"/>
        <polygon points="30,111 16,95 19,112" fill="#ffdd57"/>
        <text x="2" y="93" fill="#ffdd57" fontSize="9" fontWeight="700" fontFamily="DM Sans">THEIR</text>
        <text x="2" y="103" fill="#ffdd57" fontSize="9" fontWeight="700" fontFamily="DM Sans">THUMB</text>
        <line x1="100" y1="150" x2="75" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="150" x2="125" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="75" y1="220" x2="60" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="125" y1="220" x2="140" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <text x="100" y="268" textAnchor="middle" fill={color} fontSize="12" fontWeight="700" fontFamily="DM Sans, sans-serif">SPOT THE THUMB</text>
      </svg>,
      // Step 3: rotate wrist
      <svg key="we2" viewBox="0 0 200 280" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="35" r="22" stroke={color} strokeWidth="3" fill={color+"15"}/>
        <line x1="100" y1="57" x2="100" y2="150" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="85" x2="55" y2="120" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="85" x2="145" y2="120" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <rect x="30" y="115" width="32" height="18" rx="5" stroke="#ff4d6d" strokeWidth="2" fill="#ff4d6d22"/>
        <circle cx="55" cy="124" r="8" stroke={color} strokeWidth="2.5" fill={color+"20"}/>
        {/* Rotation arrow */}
        <path d="M42 105 Q55 95 68 105 Q75 112 68 122" stroke="#00e676" strokeWidth="2.5" fill="none"/>
        <polygon points="65,124 72,112 69,126" fill="#00e676"/>
        <text x="72" y="102" fill="#00e676" fontSize="10" fontWeight="800" fontFamily="DM Sans">ROTATE</text>
        <text x="72" y="113" fill="#00e676" fontSize="10" fontWeight="800" fontFamily="DM Sans">INWARD</text>
        <line x1="100" y1="150" x2="75" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="150" x2="125" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="75" y1="220" x2="60" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="125" y1="220" x2="140" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <text x="100" y="268" textAnchor="middle" fill={color} fontSize="12" fontWeight="700" fontFamily="DM Sans, sans-serif">ROTATE TOWARD THUMB</text>
      </svg>,
      // Step 4: snap down
      <svg key="we3" viewBox="0 0 200 280" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="35" r="22" stroke={color} strokeWidth="3" fill={color+"15"}/>
        <line x1="100" y1="57" x2="100" y2="150" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="85" x2="60" y2="135" stroke={color} strokeWidth="4" strokeLinecap="round"/>
        <line x1="100" y1="85" x2="145" y2="120" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        {/* Hand moving down */}
        <circle cx="60" cy="138" r="8" stroke="#00e676" strokeWidth="3" fill="#00e67622"/>
        {/* Down arrow — fast */}
        <path d="M55 108 L55 130" stroke="#00e676" strokeWidth="3"/>
        <polygon points="50,128 55,140 60,128" fill="#00e676"/>
        <text x="62" y="112" fill="#00e676" fontSize="12" fontWeight="900" fontFamily="DM Sans">SNAP</text>
        <text x="62" y="124" fill="#00e676" fontSize="12" fontWeight="900" fontFamily="DM Sans">DOWN!</text>
        {/* Speed lines */}
        <line x1="48" y1="118" x2="38" y2="118" stroke="#00e676" strokeWidth="1.5" opacity=".5"/>
        <line x1="46" y1="124" x2="34" y2="124" stroke="#00e676" strokeWidth="1.5" opacity=".3"/>
        <line x1="50" y1="130" x2="38" y2="132" stroke="#00e676" strokeWidth="1.5" opacity=".5"/>
        <line x1="100" y1="150" x2="75" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="150" x2="125" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="75" y1="220" x2="60" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="125" y1="220" x2="140" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <text x="100" y="268" textAnchor="middle" fill={color} fontSize="12" fontWeight="700" fontFamily="DM Sans, sans-serif">SNAP DOWN TO HIP</text>
      </svg>,
      // Step 5: step back + guard
      <svg key="we4" viewBox="0 0 200 280" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="110" cy="35" r="22" stroke={color} strokeWidth="3" fill={color+"15"}/>
        <line x1="110" y1="57" x2="110" y2="150" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        {/* Both arms UP in guard */}
        <line x1="110" y1="85" x2="75" y2="75" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="110" y1="85" x2="145" y2="75" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
        <circle cx="75" cy="72" r="7" stroke="#00e676" strokeWidth="2.5" fill="#00e67622"/>
        <circle cx="145" cy="72" r="7" stroke="#00e676" strokeWidth="2.5" fill="#00e67622"/>
        {/* Step back arrow on feet */}
        <line x1="110" y1="150" x2="90" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="110" y1="150" x2="130" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="90" y1="220" x2="75" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="130" y1="220" x2="145" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        {/* Step back arrow */}
        <path d="M155 180 L175 180" stroke="#ffdd57" strokeWidth="2.5"/>
        <polygon points="173,175 185,180 173,185" fill="#ffdd57"/>
        <text x="155" y="196" fill="#ffdd57" fontSize="9" fontWeight="700" fontFamily="DM Sans">STEP</text>
        <text x="155" y="206" fill="#ffdd57" fontSize="9" fontWeight="700" fontFamily="DM Sans">BACK</text>
        {/* Yell indicator */}
        <text x="70" y="60" fill="#ffdd57" fontSize="11" fontWeight="900" fontFamily="DM Sans">HEY!</text>
        <text x="100" y="268" textAnchor="middle" fill={color} fontSize="12" fontWeight="700" fontFamily="DM Sans, sans-serif">STEP BACK + GUARD</text>
      </svg>,
    ],
    palm_strike: [
      // Step 1: form palm heel
      <svg key="ps0" viewBox="0 0 200 280" fill="none">
        <circle cx="100" cy="35" r="22" stroke={color} strokeWidth="3" fill={color+"15"}/>
        <line x1="100" y1="57" x2="100" y2="150" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="85" x2="55" y2="120" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="85" x2="145" y2="120" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        {/* Palm extended, fingers back */}
        <rect x="135" y="110" width="22" height="28" rx="4" stroke={color} strokeWidth="2.5" fill={color+"20"}/>
        {/* Fingers back */}
        <path d="M139 110 L139 102" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M145 110 L145 100" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M151 110 L151 102" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        {/* Heel pad highlight */}
        <ellipse cx="146" cy="134" rx="8" ry="5" stroke="#00e676" strokeWidth="2" fill="#00e67622"/>
        <text x="160" y="136" fill="#00e676" fontSize="9" fontWeight="700" fontFamily="DM Sans">HEEL</text>
        <text x="160" y="146" fill="#00e676" fontSize="9" fontWeight="700" fontFamily="DM Sans">PAD</text>
        <path d="M158 133 L150 134" stroke="#00e676" strokeWidth="1.5"/>
        <line x1="100" y1="150" x2="75" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="150" x2="125" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="75" y1="220" x2="60" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="125" y1="220" x2="140" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <text x="100" y="268" textAnchor="middle" fill={color} fontSize="12" fontWeight="700" fontFamily="DM Sans">FINGERS BACK</text>
      </svg>,
      // Step 2: guard stance
      <svg key="ps1" viewBox="0 0 200 280" fill="none">
        <circle cx="100" cy="35" r="22" stroke={color} strokeWidth="3" fill={color+"15"}/>
        {/* Chin tucked */}
        <line x1="100" y1="57" x2="100" y2="150" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="85" x2="70" y2="75" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="100" y1="85" x2="140" y2="100" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="70" cy="72" r="7" stroke={color} strokeWidth="2.5" fill={color+"20"}/>
        <circle cx="143" cy="102" r="7" stroke="#888" strokeWidth="2" fill="#88888820"/>
        <text x="62" y="62" fill="#00e676" fontSize="9" fontWeight="700" fontFamily="DM Sans">CHIN</text>
        <text x="62" y="72" fill="#00e676" fontSize="9" fontWeight="700" fontFamily="DM Sans">TUCKED</text>
        <text x="148" y="100" fill="#888" fontSize="9" fontFamily="DM Sans">rear</text>
        <line x1="100" y1="150" x2="80" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="150" x2="118" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="80" y1="220" x2="65" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="118" y1="220" x2="130" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <text x="100" y="268" textAnchor="middle" fill={color} fontSize="12" fontWeight="700" fontFamily="DM Sans">CHIN DOWN GUARD</text>
      </svg>,
      // Step 3: strike
      <svg key="ps2" viewBox="0 0 200 280" fill="none">
        <circle cx="100" cy="35" r="22" stroke={color} strokeWidth="3" fill={color+"15"}/>
        <line x1="100" y1="57" x2="100" y2="150" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="85" x2="65" y2="75" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        {/* Striking arm fully extended */}
        <line x1="100" y1="85" x2="165" y2="85" stroke={color} strokeWidth="4" strokeLinecap="round"/>
        <rect x="162" y="78" width="18" height="22" rx="4" stroke="#00e676" strokeWidth="2.5" fill="#00e67622"/>
        {/* Strike arrow */}
        <path d="M125 70 L158 82" stroke="#00e676" strokeWidth="2.5"/>
        <polygon points="156,79 167,84 155,89" fill="#00e676"/>
        <text x="120" y="64" fill="#00e676" fontSize="11" fontWeight="900" fontFamily="DM Sans">STRIKE!</text>
        {/* Target - nose */}
        <circle cx="180" cy="86" r="6" stroke="#ff4d6d" strokeWidth="2" fill="#ff4d6d22"/>
        <text x="170" y="105" fill="#ff4d6d" fontSize="9" fontWeight="700" fontFamily="DM Sans">TARGET</text>
        {/* Step arrow on left foot */}
        <line x1="100" y1="150" x2="75" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="150" x2="120" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <path d="M75 220 L55 240" stroke="#00e676" strokeWidth="3" strokeLinecap="round"/>
        <line x1="120" y1="220" x2="132" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <text x="100" y="268" textAnchor="middle" fill={color} fontSize="12" fontWeight="700" fontFamily="DM Sans">STEP + STRIKE TOGETHER</text>
      </svg>,
      // Step 4: snap back
      <svg key="ps3" viewBox="0 0 200 280" fill="none">
        <circle cx="100" cy="35" r="22" stroke={color} strokeWidth="3" fill={color+"15"}/>
        <line x1="100" y1="57" x2="100" y2="150" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="85" x2="65" y2="75" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        {/* Arm snapping back */}
        <line x1="100" y1="85" x2="148" y2="90" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray="4 3"/>
        {/* Snap back arrow */}
        <path d="M148 80 L108 82" stroke="#00e676" strokeWidth="2.5"/>
        <polygon points="110,78 98,83 110,88" fill="#00e676"/>
        <text x="118" y="70" fill="#00e676" fontSize="11" fontWeight="900" fontFamily="DM Sans">SNAP BACK</text>
        <text x="118" y="82" fill="#00e676" fontSize="10" fontFamily="DM Sans">FASTER!</text>
        <line x1="100" y1="150" x2="75" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="150" x2="125" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="75" y1="220" x2="60" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="125" y1="220" x2="140" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <text x="100" y="268" textAnchor="middle" fill={color} fontSize="12" fontWeight="700" fontFamily="DM Sans">SNAP BACK TO GUARD</text>
      </svg>,
      // Step 5: combo + run
      <svg key="ps4" viewBox="0 0 200 280" fill="none">
        <circle cx="100" cy="35" r="22" stroke={color} strokeWidth="3" fill={color+"15"}/>
        <line x1="100" y1="57" x2="100" y2="150" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="85" x2="65" y2="72" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="85" x2="135" y2="72" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="65" cy="69" r="7" stroke={color} strokeWidth="2" fill={color+"20"}/>
        <circle cx="135" cy="69" r="7" stroke={color} strokeWidth="2" fill={color+"20"}/>
        {/* Running legs */}
        <line x1="100" y1="150" x2="75" y2="200" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="100" y1="150" x2="130" y2="195" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="75" y1="200" x2="55" y2="230" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <line x1="130" y1="195" x2="152" y2="222" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        {/* RUN arrow */}
        <path d="M30 180 L10 180" stroke="#ffdd57" strokeWidth="2.5"/>
        <polygon points="12,175 0,180 12,185" fill="#ffdd57"/>
        <text x="18" y="172" fill="#ffdd57" fontSize="13" fontWeight="900" fontFamily="DM Sans">RUN!</text>
        <text x="100" y="268" textAnchor="middle" fill={color} fontSize="12" fontWeight="700" fontFamily="DM Sans">STRIKE THEN ESCAPE</text>
      </svg>,
    ],
  };

  // Generic diagrams for techniques without custom ones
  const genericDiagrams = [
    // Ready stance
    <svg key="g0" viewBox="0 0 200 280" fill="none">
      <circle cx="100" cy="35" r="22" stroke={color} strokeWidth="3" fill={color+"15"}/>
      <line x1="100" y1="57" x2="100" y2="150" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="100" y1="85" x2="65" y2="115" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="100" y1="85" x2="135" y2="115" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <circle cx="65" cy="118" r="7" stroke={color} strokeWidth="2.5" fill={color+"20"}/>
      <circle cx="135" cy="118" r="7" stroke={color} strokeWidth="2.5" fill={color+"20"}/>
      <line x1="100" y1="150" x2="75" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="100" y1="150" x2="125" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="75" y1="220" x2="60" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="125" y1="220" x2="140" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      {/* Ready indicator */}
      <circle cx="100" cy="35" r="28" stroke={color} strokeWidth="1.5" fill="none" opacity=".3" strokeDasharray="4 3"/>
      <text x="100" y="268" textAnchor="middle" fill={color} fontSize="12" fontWeight="700" fontFamily="DM Sans">READY POSITION</text>
    </svg>,
    // Action up
    <svg key="g1" viewBox="0 0 200 280" fill="none">
      <circle cx="100" cy="35" r="22" stroke={color} strokeWidth="3" fill={color+"15"}/>
      <line x1="100" y1="57" x2="100" y2="150" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="100" y1="85" x2="65" y2="50" stroke={color} strokeWidth="4" strokeLinecap="round"/>
      <line x1="100" y1="85" x2="135" y2="50" stroke={color} strokeWidth="4" strokeLinecap="round"/>
      <circle cx="65" cy="47" r="7" stroke="#00e676" strokeWidth="2.5" fill="#00e67622"/>
      <circle cx="135" cy="47" r="7" stroke="#00e676" strokeWidth="2.5" fill="#00e67622"/>
      <path d="M65 68 L65 50" stroke="#00e676" strokeWidth="2.5"/>
      <polygon points="60,52 65,40 70,52" fill="#00e676"/>
      <path d="M135 68 L135 50" stroke="#00e676" strokeWidth="2.5"/>
      <polygon points="130,52 135,40 140,52" fill="#00e676"/>
      <text x="100" y="42" textAnchor="middle" fill="#00e676" fontSize="11" fontWeight="800" fontFamily="DM Sans">UP!</text>
      <line x1="100" y1="150" x2="75" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="100" y1="150" x2="125" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="75" y1="220" x2="60" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="125" y1="220" x2="140" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <text x="100" y="268" textAnchor="middle" fill={color} fontSize="12" fontWeight="700" fontFamily="DM Sans">ARMS UP</text>
    </svg>,
    // Action forward
    <svg key="g2" viewBox="0 0 200 280" fill="none">
      <circle cx="100" cy="35" r="22" stroke={color} strokeWidth="3" fill={color+"15"}/>
      <line x1="100" y1="57" x2="100" y2="150" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="100" y1="85" x2="155" y2="85" stroke={color} strokeWidth="4" strokeLinecap="round"/>
      <line x1="100" y1="85" x2="65" y2="115" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <circle cx="158" cy="85" r="7" stroke="#00e676" strokeWidth="2.5" fill="#00e67622"/>
      <path d="M130 72 L152 82" stroke="#00e676" strokeWidth="2.5"/>
      <polygon points="150,79 162,84 150,89" fill="#00e676"/>
      <text x="118" y="66" fill="#00e676" fontSize="12" fontWeight="900" fontFamily="DM Sans">DRIVE!</text>
      <line x1="100" y1="150" x2="75" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="100" y1="150" x2="125" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="75" y1="220" x2="60" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="125" y1="220" x2="140" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <text x="100" y="268" textAnchor="middle" fill={color} fontSize="12" fontWeight="700" fontFamily="DM Sans">DRIVE FORWARD</text>
    </svg>,
    // Strike down
    <svg key="g3" viewBox="0 0 200 280" fill="none">
      <circle cx="100" cy="35" r="22" stroke={color} strokeWidth="3" fill={color+"15"}/>
      <line x1="100" y1="57" x2="100" y2="150" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="100" y1="85" x2="90" y2="145" stroke={color} strokeWidth="4" strokeLinecap="round"/>
      <line x1="100" y1="85" x2="130" y2="110" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <circle cx="90" cy="148" r="7" stroke="#00e676" strokeWidth="2.5" fill="#00e67622"/>
      <path d="M75 100 L86 140" stroke="#00e676" strokeWidth="2.5"/>
      <polygon points="82,138 86,150 92,138" fill="#00e676"/>
      <text x="48" y="98" fill="#00e676" fontSize="12" fontWeight="900" fontFamily="DM Sans">DOWN!</text>
      <line x1="100" y1="150" x2="75" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="100" y1="150" x2="125" y2="220" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="75" y1="220" x2="60" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="125" y1="220" x2="140" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <text x="100" y="268" textAnchor="middle" fill={color} fontSize="12" fontWeight="700" fontFamily="DM Sans">STRIKE DOWN</text>
    </svg>,
    // Escape + run
    <svg key="g4" viewBox="0 0 200 280" fill="none">
      <circle cx="85" cy="35" r="22" stroke={color} strokeWidth="3" fill={color+"15"}/>
      <line x1="85" y1="57" x2="85" y2="150" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="85" y1="85" x2="50" y2="72" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="85" y1="85" x2="120" y2="72" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <circle cx="50" cy="69" r="7" stroke={color} strokeWidth="2" fill={color+"20"}/>
      <circle cx="120" cy="69" r="7" stroke={color} strokeWidth="2" fill={color+"20"}/>
      <line x1="85" y1="150" x2="60" y2="210" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="85" y1="150" x2="118" y2="200" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="60" y1="210" x2="40" y2="240" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <line x1="118" y1="200" x2="145" y2="228" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <path d="M15 170 L2 170" stroke="#ffdd57" strokeWidth="2.5"/>
      <polygon points="4,165 -8,170 4,175" fill="#ffdd57"/>
      <text x="10" y="162" fill="#ffdd57" fontSize="14" fontWeight="900" fontFamily="DM Sans">RUN!</text>
      <text x="100" y="268" textAnchor="middle" fill={color} fontSize="12" fontWeight="700" fontFamily="DM Sans">ESCAPE NOW</text>
    </svg>,
  ];

  const techDiagrams = diagrams[techId] || genericDiagrams;
  const diagram = techDiagrams[stepIdx] || genericDiagrams[stepIdx % 5];

  return (
    <div style={{
      background: "#0a0a1a",
      borderRadius: 14,
      padding: "16px",
      border: `2px solid ${color}25`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      aspectRatio: "3/2",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(${color}08 1px, transparent 1px), linear-gradient(90deg, ${color}08 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}/>
      <div style={{ position: "relative", height: "100%", maxHeight: 220, aspectRatio: "200/280" }}>
        {diagram}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TECHNIQUES DATA
// ══════════════════════════════════════════════════════════════
const TECHNIQUES = [
  {
    id: "wrist_escape",
    name: "Wrist Escape",
    icon: "✊",
    color: "#ff4d6d",
    difficulty: "Beginner",
    xp: 100,
    time: "4 min",
    subtitle: "Break any grip instantly",
    why: "Most common grab. Works on anyone, any size.",
    steps: [
      {
        title: "Arms Forward",
        action: "Stretch BOTH arms straight out in front of you, palms facing DOWN",
        cue: "🤲 Both arms out, palms down",
        image: "https://images.unsplash.com/photo-1571019613914-85f342c6a11e?w=500&q=80",
        imageAlt: "Person standing with arms extended forward",
        do: ["Both arms extended directly forward", "Palms face the floor", "Feet shoulder-width apart — stable base"],
        dont: ["Don't tense up — stay relaxed", "Don't look down at your hands"],
        duration: 18,
      },
      {
        title: "Find Their Thumb",
        action: "Look at their grabbing hand — find their THUMB. That is your escape door.",
        cue: "👍 Their thumb = your exit",
        image: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=500&q=80",
        imageAlt: "Close up of hand grip showing thumb position",
        do: ["Thumb is ALWAYS the weakest point of any grip", "The gap between thumb and fingers is your escape route", "Take 1 second to locate it — you have time"],
        dont: ["Don't yank straight backward — it won't work", "Don't panic — you have 8+ seconds"],
        duration: 20,
      },
      {
        title: "Rotate Toward Thumb",
        action: "Rotate YOUR wrist so your thumb points AT their thumb. Turn INWARD toward your body.",
        cue: "🔄 Rotate INWARD — thumb to thumb",
        image: "https://images.unsplash.com/photo-1571019613914-85f342c6a11e?w=500&q=80",
        imageAlt: "Wrist rotation demonstration",
        do: ["Turn your thumb TOWARD their thumb", "Rotate inward — toward your own center", "Practice 5 slow rotations — feel the grip loosen"],
        dont: ["Don't rotate AWAY from their thumb", "Don't use brute force — rotation does the work"],
        duration: 28,
      },
      {
        title: "Snap Down Fast",
        action: "Rotate AND pull DOWN toward your hip in ONE fast motion. Speed beats strength here.",
        cue: "⬇️ Rotate + SNAP DOWN to hip",
        image: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=500&q=80",
        imageAlt: "Snap down motion demonstration",
        do: ["Direction: DOWN and toward your hip", "Rotation + snap = one connected motion", "FAST is more important than strong — even small people can break big grips"],
        dont: ["Don't pull straight backward", "Don't do it slowly — speed is everything"],
        duration: 30,
      },
      {
        title: "Step Back + Yell",
        action: "The moment you break free — IMMEDIATELY step back, both hands UP, and yell HEY loud.",
        cue: "🙌 Step back + Hands up + HEY!",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80",
        imageAlt: "Person in defensive stance with hands raised",
        do: ["Step backward INSTANTLY after breaking grip", "Both hands raised high — creates space AND signals bystanders", "Yell HEY loudly — this draws witnesses and surprises attacker"],
        dont: ["Don't stand still after escaping", "Don't lower your hands back down"],
        duration: 25,
      },
    ],
  },
  {
    id: "palm_strike",
    name: "Palm Strike",
    icon: "🤚",
    color: "#f77f00",
    difficulty: "Beginner",
    xp: 100,
    time: "4 min",
    subtitle: "Maximum force, zero self-injury",
    why: "Safer than a fist. Heel pad is naturally padded bone.",
    steps: [
      {
        title: "Form the Palm Heel",
        action: "Open your hand. Pull ALL fingers back toward the ceiling. Expose the thick heel pad near your wrist.",
        cue: "✋ Fingers BACK — heel exposed",
        image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=500&q=80",
        imageAlt: "Palm strike hand position",
        do: ["Pull all fingers back — they should point toward the ceiling", "The heel pad is the thick, meaty area just above your wrist", "That padded heel is your weapon — it won't break like knuckles"],
        dont: ["Don't use your knuckles — they break easily", "Don't strike with your fingers"],
        duration: 18,
      },
      {
        title: "Guard Stance",
        action: "Dominant hand forward at chin height. Rear hand near your jaw. Chin DOWN.",
        cue: "🥊 Hand at chin, chin TUCKED",
        image: "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=500&q=80",
        imageAlt: "Boxing guard stance",
        do: ["Dominant hand = your writing hand — forward at chin level", "Elbow bent, palm facing forward", "Chin ALWAYS tucked — protects you from counter-hits"],
        dont: ["Never raise your chin — it's your most vulnerable point", "Don't drop both hands at the same time"],
        duration: 20,
      },
      {
        title: "Step + Strike Together",
        action: "Left foot steps forward AT THE SAME TIME your right palm drives to their nose.",
        cue: "👣+🤚 Step and strike SIMULTANEOUSLY",
        image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=500&q=80",
        imageAlt: "Palm strike in motion",
        do: ["Step and strike must happen at the SAME moment", "Target: the nose or chin — sensitive areas", "Your body weight moves INTO the strike — much more power"],
        dont: ["Don't strike without stepping — you lose 60% of power", "Don't aim at the forehead — it's too hard"],
        duration: 30,
      },
      {
        title: "Snap Back Instantly",
        action: "Pull your striking hand back to guard FASTER than you extended it.",
        cue: "⚡ SNAP back — faster than the strike",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80",
        imageAlt: "Returning to guard position",
        do: ["Snap back immediately — don't pause", "Return speed should be FASTER than strike speed", "Back to guard means both hands protecting face again"],
        dont: ["NEVER leave your arm extended — they can grab it", "Don't pause after the strike"],
        duration: 22,
      },
      {
        title: "Full Combination",
        action: "Guard → Strike → Snap back → Step back → Yell → RUN. All in under 2 seconds.",
        cue: "🏃 Strike → Snap → ESCAPE",
        image: "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=500&q=80",
        imageAlt: "Full escape sequence",
        do: ["All 5 steps flow as one connected motion", "Yell DURING the strike — loud", "Goal is to escape, not win — create distance and run"],
        dont: ["Don't stay and fight", "Don't forget to step backward after striking"],
        duration: 35,
      },
    ],
  },
  {
    id: "elbow_block",
    name: "Elbow Block",
    icon: "💪",
    color: "#4cc9f0",
    difficulty: "Beginner",
    xp: 120,
    time: "4 min",
    subtitle: "Your elbow beats their fist every time",
    why: "Hard bone vs. soft knuckles — physics always wins.",
    steps: [
      {
        title: "Why Elbow Beats Fist",
        action: "Hold out your elbow. Feel how hard the bone is. That bone destroys knuckles on contact.",
        cue: "🦴 Elbow bone = your shield",
        image: "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=500&q=80",
        imageAlt: "Elbow blocking position",
        do: ["Your elbow bone is one of the hardest points on your body", "When their fist hits your elbow — THEY get hurt", "Works against slaps, hooks, and wild swings"],
        dont: ["Don't use your open hand to block — it can break fingers", "Don't flinch backward — move the elbow OUT"],
        duration: 16,
      },
      {
        title: "High Guard Position",
        action: "Both elbows OUT like wings. Fists near your temples. Look THROUGH the gap.",
        cue: "🦅 Elbows OUT, fists at temples",
        image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=500&q=80",
        imageAlt: "High guard with elbows out",
        do: ["Elbows point outward — like an eagle's wings", "Fists rest near your temples — not covering your eyes", "Look THROUGH the space between your arms — never over them"],
        dont: ["Don't look over your guard — you can't see incoming strikes", "Don't let elbows fall inward — you lose the shield"],
        duration: 22,
      },
      {
        title: "Raise Elbow to Block",
        action: "When you see their arm swing at you — lift your elbow OUTWARD to meet it.",
        cue: "🚫 Lift elbow OUT to intercept",
        image: "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=500&q=80",
        imageAlt: "Elbow raised to block incoming strike",
        do: ["Small controlled lift — not a big dramatic swing", "Meet their arm EARLY — before it builds full speed", "Keep other hand near your face while one blocks"],
        dont: ["Don't swing your whole arm wildly", "Don't use your hand — use the elbow BONE"],
        duration: 30,
      },
      {
        title: "Add a Body Pivot",
        action: "Block AND rotate your body 20 degrees away from their swing at the same time.",
        cue: "🔄 Block + pivot = stronger block",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80",
        imageAlt: "Body pivot while blocking",
        do: ["20-30 degree pivot moves your head off the attack line", "Pivot turns your elbow INTO their swing — harder impact for them", "Block + pivot = one simultaneous motion"],
        dont: ["Don't spin all the way around — stay facing them", "Don't drop your guard arm while pivoting"],
        duration: 28,
      },
      {
        title: "Block Then Counter",
        action: "After the block — IMMEDIATELY palm strike to their nose then step back and run.",
        cue: "Block → Strike → RUN now",
        image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=500&q=80",
        imageAlt: "Counter-attack after block",
        do: ["Counter the MOMENT after blocking — no pause", "Their face is right in front of you after the block", "Palm to nose → step back → run — 3 seconds total"],
        dont: ["Don't wait to counter — they'll recover", "Don't stay close after hitting"],
        duration: 32,
      },
    ],
  },
  {
    id: "awareness",
    name: "Situational Awareness",
    icon: "👁️",
    color: "#b5e48c",
    difficulty: "Beginner",
    xp: 80,
    time: "4 min",
    subtitle: "The best fight is the one that never happens",
    why: "90% of attacks can be prevented with good awareness.",
    steps: [
      {
        title: "Intent + Opportunity",
        action: "Attacks need Intent + Capability + Opportunity. You can't control their intent — but you ALWAYS control opportunity.",
        cue: "🎯 You control the opportunity",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&q=80",
        imageAlt: "Woman alert and aware of surroundings",
        do: ["You always control how close they can get to you", "Awareness = removing their opportunity before it forms", "This single habit beats every physical technique"],
        dont: ["Don't think only strength protects you", "Don't ignore your gut feeling — ever"],
        duration: 22,
      },
      {
        title: "10-Second Room Scan",
        action: "Every time you enter a room: Count exits → Look for obstacles → Spot anything out of place.",
        cue: "🔍 Exits → Obstacles → Threats",
        image: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=500&q=80",
        imageAlt: "Person scanning a room for exits",
        do: ["Count exits EVERY TIME you enter a new space", "'Out of place' means: watching you, wrong clothes for weather, moving strangely", "Do this scan right now in your current room — takes 10 seconds"],
        dont: ["Don't be paranoid — be systematic and calm", "Don't skip this in familiar places — most attacks happen in familiar areas"],
        duration: 30,
      },
      {
        title: "Back to the Wall",
        action: "When sitting or waiting anywhere — always position yourself with your BACK to a wall, FACING the entrance.",
        cue: "🧱 Back to wall, face the door",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&q=80",
        imageAlt: "Sitting with back to wall facing entrance",
        do: ["Back to wall = nobody approaches from behind", "Facing the entrance = you see everyone entering before they see you", "Practice this everywhere — cafes, restaurants, waiting rooms, transit"],
        dont: ["Never sit with your back to the open room", "Don't face a wall — you lose all visibility"],
        duration: 25,
      },
      {
        title: "Set a Verbal Boundary",
        action: "Feet wide apart, both hands up in front, firm voice: 'STOP. Back away from me. Now.'",
        cue: "🗣️ STOP. BACK AWAY. Loud voice.",
        image: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=500&q=80",
        imageAlt: "Woman using assertive verbal boundary",
        do: ["Say it now out loud: 'STOP. Back away. Leave me alone.'", "No 'please'. No 'sorry'. Command voice — firm and loud.", "Your loud voice instantly attracts witnesses and disrupts their plan"],
        dont: ["Don't say please or sorry — you have nothing to apologize for", "Don't whisper — volume matters as much as the words"],
        duration: 28,
      },
      {
        title: "Trust Your Gut",
        action: "If something feels wrong — leave immediately. You need ZERO proof. Your discomfort is enough.",
        cue: "🚶 Feels wrong = leave NOW",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&q=80",
        imageAlt: "Woman walking toward safety and light",
        do: ["Discomfort is DATA — your body detects things before your brain names them", "Move toward people, light, and noise immediately", "Your safety is 100x more important than seeming polite"],
        dont: ["Don't rationalize bad feelings away", "Don't stay to avoid being 'rude'"],
        duration: 25,
      },
    ],
  },
  {
    id: "choke_escape",
    name: "Choke Escape",
    icon: "🙌",
    color: "#c77dff",
    difficulty: "Intermediate",
    xp: 150,
    time: "4 min",
    subtitle: "Break a front choke in under 2 seconds",
    why: "You have 8 seconds before real danger. Way more time than you think.",
    steps: [
      {
        title: "You Have 8 Seconds",
        action: "Tuck your chin DOWN hard into their hands to protect your airway. You have 8-10 full seconds — do NOT panic.",
        cue: "⬇️ Chin DOWN — 8 seconds is plenty",
        image: "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=500&q=80",
        imageAlt: "Demonstrating chin tuck and calm response",
        do: ["Tuck chin DOWN immediately — this protects your airway", "8-10 seconds before real danger — you have MORE than enough time", "Take one breath. Prepare to act deliberately."],
        dont: ["NEVER panic — panic wastes your seconds", "Don't grab their hands — it accomplishes nothing"],
        duration: 20,
      },
      {
        title: "Both Arms UP",
        action: "Raise BOTH arms straight up over your head — like you're loading a swim stroke.",
        cue: "🙌 Both arms HIGH above head",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80",
        imageAlt: "Arms raised high preparing for swim motion",
        do: ["BOTH arms up — fully extended above your head", "Like loading a swimmer's stroke — arms up and back", "This seems wrong but it's physically the correct escape path"],
        dont: ["Don't grab their wrists — it traps you", "Don't try to pry their fingers — too slow"],
        duration: 22,
      },
      {
        title: "Drive Forearm Through",
        action: "Slam your dominant forearm DOWN between their two arms — like a swim stroke driving forward.",
        cue: "💥 DRIVE forearm through the MIDDLE",
        image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=500&q=80",
        imageAlt: "Forearm drive breaking choke grip",
        do: ["Drive dominant forearm DOWN and BETWEEN their arms", "Your shoulder rotation provides all the power", "Drive ALL the way through — stopping halfway fails"],
        dont: ["Don't stop halfway — commit fully", "Don't grab — this is a DRIVE motion, not a grab"],
        duration: 30,
      },
      {
        title: "Elbow Follows Through",
        action: "Your elbow naturally hits their face as you complete the drive — let it happen.",
        cue: "🦾 Elbow hits as natural follow-through",
        image: "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=500&q=80",
        imageAlt: "Elbow follow-through to attacker's face",
        do: ["The elbow hit is the natural END of your drive motion", "Their face is right there — you don't need to aim", "One connected motion: arms up → drive → elbow hit"],
        dont: ["Don't think of it as a separate strike — it's all one motion", "Don't stop your momentum after the choke breaks"],
        duration: 28,
      },
      {
        title: "Full Drill × 10 Reps",
        action: "Chin down → Both arms up → Drive through → Step back fast → Yell HELP",
        cue: "🔁 10 reps = automatic muscle memory",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80",
        imageAlt: "Training repetitions for muscle memory",
        do: ["Rep 1-3: slow motion — feel each part", "Rep 7-10: full speed — under 2 seconds total", "Yell HELP loudly during the break — attracts help, shocks attacker"],
        dont: ["Don't skip the slow reps — they build the correct pathway", "Don't forget to step back and create distance after"],
        duration: 45,
      },
    ],
  },
  {
    id: "hammer_fist",
    name: "Hammer Fist",
    icon: "🔨",
    color: "#ffd166",
    difficulty: "Beginner",
    xp: 100,
    time: "4 min",
    subtitle: "Most natural powerful strike — works under panic",
    why: "Large muscles never fail under adrenaline. This is instinctual.",
    steps: [
      {
        title: "The Striking Surface",
        action: "Close your fist tightly. The weapon is the BOTTOM of your fist — the thick padded pinky-side edge.",
        cue: "👊 Bottom of fist = the hammer head",
        image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=500&q=80",
        imageAlt: "Closed fist showing bottom edge striking surface",
        do: ["Close fist tightly — all four fingers curled", "Bottom = meaty area on the pinky side near the wrist", "That padded edge is extremely tough — rarely causes self-injury"],
        dont: ["Don't use your knuckles — they break on hard targets", "Don't use the side of your hand"],
        duration: 18,
      },
      {
        title: "Overhead Strike",
        action: "Raise your arm HIGH above your head. Drive the bottom of your fist DOWN with your full body weight.",
        cue: "⬆️ Raise high → DRIVE down hard",
        image: "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=500&q=80",
        imageAlt: "Overhead hammer strike downward",
        do: ["Raise your arm ALL the way up first — generates more force", "Drop your body weight INTO the swing — not just your arm", "Targets: top of head, bridge of nose, collarbone"],
        dont: ["Don't swing with just your arm — use your whole body", "Don't aim weakly — commit to the strike"],
        duration: 28,
      },
      {
        title: "Side Strike (Backhand)",
        action: "Swing from OUTSIDE to INSIDE — like a backhanded swing — hitting temple or ear.",
        cue: "↩️ Outside-to-inside arc at temple",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80",
        imageAlt: "Side hammer fist strike to temple",
        do: ["Swing like a backhand tennis stroke — outside-in", "Target: temple = immediate pain. Ear = instant disorientation.", "Keep your other hand raised near your face while striking"],
        dont: ["Don't swing inside-out — you lose all power", "Don't drop your guard arm while striking"],
        duration: 28,
      },
      {
        title: "When to Use It",
        action: "Use hammer fist when someone is very close — or when they bend forward toward you.",
        cue: "📏 Close range = hammer fist wins",
        image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=500&q=80",
        imageAlt: "Close range scenario showing hammer fist application",
        do: ["Works especially well at very close range when precise strikes are impossible", "Person bent forward toward you = hammer to back of neck is devastating", "Under panic and adrenaline: large instinctual swings work when precise moves fail"],
        dont: ["Don't use at long range — you lose power and leave yourself exposed", "Don't try precise techniques when panic hits — use this instead"],
        duration: 22,
      },
      {
        title: "Combination: Block → Hammer → Palm → Escape",
        action: "Block their incoming swing → Hammer to temple → Palm to nose → Step back → Run.",
        cue: "Block → Hammer → Palm → ESCAPE",
        image: "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=500&q=80",
        imageAlt: "Full escape combination sequence",
        do: ["String them together as one flowing motion", "Practice the combo 5 times right now", "End by creating space and running toward people and light"],
        dont: ["Don't stop after one strike — follow through the combo", "Don't stay close after landing strikes"],
        duration: 38,
      },
    ],
  },
  {
    id: "knee_strike",
    name: "Knee Strike",
    icon: "⚡",
    color: "#ef233c",
    difficulty: "Intermediate",
    xp: 150,
    time: "4 min",
    subtitle: "When grabbed close — most powerful weapon you have",
    why: "Largest muscles in your body. Can't be blocked easily at close range.",
    steps: [
      {
        title: "Head Control Grip",
        action: "Both hands grab their head, neck, or shoulders. PULL DOWN and forward hard — aim them at your knee.",
        cue: "🤜 Both hands → pull their head DOWN",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80",
        imageAlt: "Head control pulling attacker forward",
        do: ["Both hands on their head or shoulders — not one", "Pull DOWN hard — folding them toward you and your knee", "You're literally aiming their face into your incoming knee"],
        dont: ["Don't use only one hand — you lose control", "Don't push them away — pull TOWARD you"],
        duration: 22,
      },
      {
        title: "Single-Leg Balance",
        action: "Shift ALL your weight to one leg. Keep that standing knee SLIGHTLY bent — never locked.",
        cue: "🦵 One leg → knee soft, not locked",
        image: "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=500&q=80",
        imageAlt: "Balanced single leg stance",
        do: ["All body weight on your supporting leg", "That supporting knee should be SLIGHTLY bent — 5-10 degrees", "Practice balancing for 3 seconds × 5 reps — build stability"],
        dont: ["NEVER lock the supporting knee — you'll fall when you strike", "Don't rush past this — balance is the foundation"],
        duration: 25,
      },
      {
        title: "Hip Drives First",
        action: "Your HIP thrusts FORWARD first — the knee is just the weapon at the end of your hip drive.",
        cue: "🏋️ HIP FORWARD first → knee follows",
        image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=500&q=80",
        imageAlt: "Hip drive powering knee strike",
        do: ["Initiate with your HIP — thrust it forward and upward", "The knee is just along for the ride — it arrives with full hip power", "Target: their midsection — stomach, solar plexus, ribs"],
        dont: ["Don't just lift your leg — it has no power", "Don't aim at their thigh — too easy to absorb"],
        duration: 32,
      },
      {
        title: "Multiple Strikes",
        action: "Pull their head down again → second knee → pull → third knee → then release and step back.",
        cue: "🔁 Pull → Knee → Pull → Knee → ESCAPE",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80",
        imageAlt: "Multiple knee strike sequence",
        do: ["Re-pull their head DOWN between each knee strike", "Three knees overwhelms any attacker", "After 3: release their head, step back fast, run"],
        dont: ["Don't stop at just one — multiple strikes are far more effective", "Don't forget to release and create distance after"],
        duration: 30,
      },
      {
        title: "Full Sequence",
        action: "Grabbed close → head control → pull → 3 knees → release → step back loud HELP → run.",
        cue: "Total time goal: under 3 seconds",
        image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=500&q=80",
        imageAlt: "Full knee strike escape sequence",
        do: ["Yell HELP or FIRE during the strikes — loudest you've ever yelled", "After releasing: run toward people, light, and noise", "50 reps on a heavy bag or pillow = automatic response under stress"],
        dont: ["Don't grapple on the ground", "Don't stay close after striking"],
        duration: 40,
      },
    ],
  },
  {
    id: "ground_defense",
    name: "Ground Defense",
    icon: "🛡️",
    color: "#06d6a0",
    difficulty: "Intermediate",
    xp: 150,
    time: "4 min",
    subtitle: "What to do if you're knocked down",
    why: "Most people freeze on the ground. This gives you an automatic system.",
    steps: [
      {
        title: "Never Flat on Your Back",
        action: "If knocked down — IMMEDIATELY roll to your SIDE. Knees pulled toward chest. Top arm shields head.",
        cue: "🚫 On back = danger → Roll to SIDE instantly",
        image: "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=500&q=80",
        imageAlt: "Side position with knees up for ground defense",
        do: ["Roll to side IMMEDIATELY — this is your #1 ground rule", "Pull knees toward your chest — your legs become a barrier between you and them", "Top arm shields your head from above"],
        dont: ["NEVER lie flat on your back — you have zero defenses", "Don't freeze — roll the moment you hit the ground"],
        duration: 25,
      },
      {
        title: "Heel Kick Their Knee",
        action: "Extend your leg and drive your HEEL into the SIDE of their knee — not the front.",
        cue: "👟 HEEL → SIDE of their knee",
        image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=500&q=80",
        imageAlt: "Heel kick targeting side of knee",
        do: ["Use your HEEL — concentrated hard point = maximum damage", "Target the SIDE of the knee where ligaments are most vulnerable", "Even moderate force = severe pain and instability for them"],
        dont: ["Don't kick with your toes — it's weak and you'll injure yourself", "Don't kick the FRONT of the knee — much less effective"],
        duration: 30,
      },
      {
        title: "Safe Get-Up",
        action: "Roll to your knees while FACING THEM → dominant foot forward → stand up — eyes on them the whole time.",
        cue: "👀 Face them ALWAYS while getting up",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80",
        imageAlt: "Safe ground get-up facing the threat",
        do: ["ALWAYS face the threat while rising — never turn your back", "Dominant foot forward means you're in fighting stance the moment you stand", "Eyes on them — not on the ground — the entire time"],
        dont: ["NEVER turn your back to get up — most dangerous moment", "Don't look at the floor while rising"],
        duration: 30,
      },
      {
        title: "Stomp Their Hand",
        action: "If they grab your leg from the ground — stomp your FREE heel DOWN onto the back of their hand hard.",
        cue: "⬇️ Stomp heel ONTO their hand — straight down",
        image: "https://images.unsplash.com/photo-1571019614099-993e4f9e5faf?w=500&q=80",
        imageAlt: "Heel stomp on attacker's hand",
        do: ["Drive heel STRAIGHT DOWN onto their hand — not a kick, a STOMP", "Instant release — works 100% of the time", "Immediately use safe get-up technique after the stomp"],
        dont: ["Don't kick it sideways — it must go straight down", "Don't forget to stand up immediately after"],
        duration: 25,
      },
      {
        title: "Full Scenario Practice",
        action: "Pushed down → side position → heel kick knee → stomp hand → safe get-up → palm strike → run.",
        cue: "🏃 Escape is ALWAYS the goal",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80",
        imageAlt: "Full ground escape to running",
        do: ["Practice on carpet or a mat — 5 full reps start to finish", "50 total reps over this week = automatic response under stress", "Goal is always to get up and escape — never to stay and fight on ground"],
        dont: ["Don't try to grapple or wrestle on the ground", "Don't stay on the ground a single second longer than needed"],
        duration: 42,
      },
    ],
  },
];

// ══════════════════════════════════════════════════════════════
//  TIMER COMPONENT
// ══════════════════════════════════════════════════════════════
function Timer({ duration, color, onDone, rk }) {
  const [rem, setRem] = useState(duration);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    setRem(duration); setPct(0);
    const t0 = Date.now();
    const id = setInterval(() => {
      const elapsed = (Date.now() - t0) / 1000;
      const p = Math.min(elapsed / duration, 1);
      setPct(p);
      setRem(Math.max(0, Math.ceil(duration - elapsed)));
      if (elapsed >= duration) { clearInterval(id); onDone(); }
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, [rk]);

  const r = 44, circ = 2 * Math.PI * r;
  const urgent = rem <= 5 && rem > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div style={{ position: "relative", width: 100, height: 100 }}>
        <svg width={100} height={100} viewBox="0 0 100 100">
          <circle cx={50} cy={50} r={r} stroke="#0f0f20" strokeWidth={9} fill="none"/>
          <circle
            cx={50} cy={50} r={r}
            stroke={urgent ? "#ff4d6d" : color}
            strokeWidth={9} fill="none"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dashoffset .1s linear, stroke .3s" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: rem >= 100 ? 26 : 34, color: urgent ? "#ff4d6d" : color, lineHeight: 1, animation: urgent ? "pulse .5s ease infinite" : "none" }}>{rem}</span>
          <span style={{ fontSize: 9, color: "#334", letterSpacing: 2 }}>SEC</span>
        </div>
      </div>
      <div style={{ fontSize: 10, color: pct >= 1 ? "#00e676" : "#334", letterSpacing: 1 }}>
        {pct < 1 ? "practice now" : "✓ complete"}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  AUDIO COACH
// ══════════════════════════════════════════════════════════════
function useCoach() {
  const [on, setOn] = useState(false);
  const speak = useCallback((text) => {
    if (!on || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85; u.pitch = 1.1; u.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const f = voices.find(v => /female|woman|zira|karen|samantha|victoria/i.test(v.name)) || voices.find(v => v.lang.startsWith("en"));
    if (f) u.voice = f;
    window.speechSynthesis.speak(u);
  }, [on]);
  const stop = useCallback(() => window.speechSynthesis?.cancel(), []);
  const toggle = useCallback(() => { if (on) stop(); setOn(x => !x); }, [on, stop]);
  return { on, toggle, speak, stop };
}

// ══════════════════════════════════════════════════════════════
//  WEBCAM AR
// ══════════════════════════════════════════════════════════════
function WebcamAR({ color, stepTitle }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const poseRef   = useRef(null);
  const animRef   = useRef(null);
  const [status, setStatus]   = useState("idle");
  const [poseData, setPoseData] = useState(null);

  const loadScripts = useCallback(() => new Promise(resolve => {
    const srcs = [
      "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
      "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js",
      "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js",
    ];
    let done = 0;
    srcs.forEach(src => {
      if (document.querySelector(`script[src="${src}"]`)) { if (++done === srcs.length) resolve(); return; }
      const s = document.createElement("script"); s.src = src; s.async = true;
      s.onload = () => { if (++done === srcs.length) resolve(); };
      document.head.appendChild(s);
    });
  }), []);

  const startAR = useCallback(async () => {
    setStatus("loading");
    await new Promise(r => setTimeout(r, 80));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
      await loadScripts();
      await new Promise(r => setTimeout(r, 900));
      if (window.Pose) {
        const pose = new window.Pose({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}` });
        pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: .5, minTrackingConfidence: .5 });
        pose.onResults(r => setPoseData(r));
        await pose.initialize();
        poseRef.current = pose;
        if (window.Camera && videoRef.current) {
          const cam = new window.Camera(videoRef.current, { onFrame: async () => { if (videoRef.current && poseRef.current) await poseRef.current.send({ image: videoRef.current }); }, width: 640, height: 480 });
          cam.start();
        }
      }
      setStatus("ready");
    } catch (e) { setStatus("error"); }
  }, [loadScripts]);

  useEffect(() => {
    if (status !== "ready" || !canvasRef.current) return;
    const cvs = canvasRef.current, ctx = cvs.getContext("2d");
    const render = () => {
      cvs.width = cvs.offsetWidth || 640; cvs.height = cvs.offsetHeight || 480;
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      const W = cvs.width, H = cvs.height;
      if (poseData?.poseLandmarks) {
        const lm = poseData.poseLandmarks;
        const pairs = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]];
        ctx.strokeStyle = color + "cc"; ctx.lineWidth = 3;
        pairs.forEach(([a, b]) => { if (lm[a]?.visibility > .5 && lm[b]?.visibility > .5) { ctx.beginPath(); ctx.moveTo(lm[a].x*W, lm[a].y*H); ctx.lineTo(lm[b].x*W, lm[b].y*H); ctx.stroke(); } });
        [11,12,13,14,15,16,23,24].forEach(i => { if (lm[i]?.visibility > .5) { ctx.beginPath(); ctx.arc(lm[i].x*W, lm[i].y*H, 7, 0, Math.PI*2); ctx.fillStyle = color; ctx.fill(); } });
      }
      const t = Date.now()/1000, bs = 28*(.7+.3*Math.sin(t*3));
      ctx.strokeStyle = color + "88"; ctx.lineWidth = 2.5;
      [[0,0,1,0,0,1],[W,0,-1,0,0,1],[0,H,1,0,0,-1],[W,H,-1,0,0,-1]].forEach(([x,y,dx,dy,ex,ey]) => { ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+dx*bs,y+dy*bs); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+ex*bs,y+ey*bs); ctx.stroke(); });
      ctx.fillStyle = "rgba(0,0,0,.75)"; ctx.fillRect(0,0,W,36);
      ctx.fillStyle = color; ctx.font = "bold 13px 'DM Sans', sans-serif";
      ctx.fillText(`◉ AR LIVE — ${stepTitle}`, 10, 23);
      animRef.current = requestAnimationFrame(render);
    };
    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [status, poseData, color, stepTitle]);

  useEffect(() => () => { cancelAnimationFrame(animRef.current); if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); }, []);

  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `1px solid ${color}44`, aspectRatio: "4/3", background: "#000" }}>
      <video ref={videoRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", opacity: status === "ready" ? 1 : 0 }} playsInline muted autoPlay/>
      {status === "ready" && <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 2 }}/>}
      {status === "idle" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 16 }}>
          <div style={{ fontSize: 24 }}>📷</div>
          <div style={{ fontSize: 12, color: "#445", textAlign: "center", lineHeight: 1.5 }}>Enable your camera to see AR body tracking overlaid on your live movement</div>
          <button onClick={startAR} className="btn" style={{ background: color, color: "#fff", borderRadius: 8, padding: "9px 20px", fontSize: 12, fontWeight: 700 }}>Enable Camera</button>
        </div>
      )}
      {status === "loading" && (
        <div style={{ position: "absolute", inset: 0, zIndex: 5, background: "rgba(6,6,16,.94)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", border: `3px solid ${color}44`, borderTopColor: color, animation: "spin 1s linear infinite" }}/>
          <div style={{ fontSize: 11, color, letterSpacing: 2 }}>INITIALIZING AR…</div>
        </div>
      )}
      {status === "error" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#ff6677" }}>Camera access denied</div>
          <div style={{ fontSize: 11, color: "#445" }}>Allow camera in browser settings then refresh.</div>
        </div>
      )}
      {status === "ready" && (
        <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, zIndex: 3, background: "rgba(0,0,0,.7)", backdropFilter: "blur(8px)", borderRadius: 6, padding: "5px 9px" }}>
          <div style={{ fontSize: 10, color, letterSpacing: 1 }}>● LIVE — Body tracking active</div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════════════════
export default function SheDefends() {
  const [screen,    setScreen]    = useState("home");
  const [tech,      setTech]      = useState(null);
  const [stepIdx,   setStepIdx]   = useState(0);
  const [timerKey,  setTimerKey]  = useState(0);
  const [completed, setCompleted] = useState([]);
  const [progress,  setProgress]  = useState({});
  const [showAR,    setShowAR]    = useState(false);
  const [imgTab,    setImgTab]    = useState("photo"); // "photo" | "diagram"
  const coach = useCoach();

  useEffect(() => {
    boot();
    const p = loadP();
    if (p.completed) setCompleted(p.completed);
    setProgress(p);
  }, []);

  const saveSession = useCallback((comp) => {
    const p = loadP(), ts = todayStr();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const streak = p.lastDay === ts ? (p.streak || 1) : p.lastDay === yesterday ? (p.streak || 0) + 1 : 1;
    const updated = { ...p, completed: comp, lastDay: ts, streak, totalSessions: (p.totalSessions || 0) + 1 };
    saveP(updated); setProgress(updated);
  }, []);

  const goTrain = (t) => { setTech(t); setStepIdx(0); setTimerKey(0); setShowAR(false); setImgTab("photo"); setScreen("train"); };

  const advance = useCallback(() => {
    coach.stop();
    if (stepIdx < tech.steps.length - 1) {
      const next = stepIdx + 1;
      setStepIdx(next); setTimerKey(k => k + 1);
      setTimeout(() => coach.speak(tech.steps[next].action), 600);
    } else {
      const comp = completed.includes(tech.id) ? completed : [...completed, tech.id];
      setCompleted(comp); saveSession(comp); setScreen("done");
    }
  }, [stepIdx, tech, completed, coach, saveSession]);

  const goStep = (i) => { coach.stop(); setStepIdx(i); setTimerKey(k => k + 1); };

  useEffect(() => {
    if (screen === "train" && tech) {
      const id = setTimeout(() => coach.speak(tech.steps[stepIdx].action), 700);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line
  }, [screen, tech?.id, stepIdx]);

  // ── HOME ────────────────────────────────────────────────────
  if (screen === "home") return (
    <div style={{ minHeight: "100vh", background: "#060610", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 40% at 50% -10%, rgba(255,77,109,.22) 0%, transparent 65%)" }}/>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,77,109,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,77,109,.03) 1px, transparent 1px)", backgroundSize: "56px 56px" }}/>

      <div className="fu" style={{ position: "relative", zIndex: 1, maxWidth: 640, width: "100%", padding: "clamp(60px,10vh,110px) 24px 72px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: 5, color: "#ff4d6d", fontWeight: 700, border: "1px solid rgba(255,77,109,.3)", padding: "5px 20px", borderRadius: 30, marginBottom: 32, background: "rgba(255,77,109,.06)" }}>
          AR · SELF-DEFENSE · TRAINER · #75HER 2026
        </div>

        <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(80px,20vw,148px)", lineHeight: .82, margin: "0 0 6px", letterSpacing: 2, background: "linear-gradient(155deg, #fff 15%, #ff8fa3 55%, #ff4d6d 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          SHE<br/>DEFENDS
        </h1>

        <p style={{ fontSize: "clamp(14px,2.3vw,17px)", color: "#3a3a5a", lineHeight: 1.9, maxWidth: 500, margin: "22px 0 40px" }}>
          Real self-defense training with <strong style={{ color: "#7070a0" }}>illustrated step-by-step photos</strong>,
          animated body diagrams, webcam AR tracking, and an audio coach. No gym. No cost.
        </p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 40 }}>
          {[["📸", "Photo Guides"], ["🎯", "Body Diagrams"], ["📷", "Webcam AR"], ["🎙️", "Audio Coach"]].map(([ic, lb]) => (
            <div key={lb} style={{ padding: "6px 15px", borderRadius: 30, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,.04)", border: "1px solid #161628", color: "#556" }}>{ic} {lb}</div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button className="btn" onClick={() => setScreen("select")} style={{ background: "#ff4d6d", color: "#fff", borderRadius: 12, padding: "18px 52px", fontSize: 17, fontWeight: 800, fontFamily: "'DM Sans', sans-serif", letterSpacing: 1.5, boxShadow: "0 0 52px rgba(255,77,109,.5)" }}>
            START TRAINING →
          </button>
          <button className="btn" onClick={() => setScreen("progress")} style={{ background: "transparent", color: "#445", border: "1px solid #161628", borderRadius: 12, padding: "18px 28px", fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
            📊 Progress
          </button>
        </div>
      </div>
    </div>
  );

  // ── PROGRESS ───────────────────────────────────────────────
  if (screen === "progress") {
    const totalXP = TECHNIQUES.filter(t => completed.includes(t.id)).reduce((s, t) => s + t.xp, 0);
    const maxXP   = TECHNIQUES.reduce((s, t) => s + t.xp, 0);
    return (
      <div style={{ minHeight: "100vh", background: "#060610" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px 80px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <button className="btn" onClick={() => setScreen("home")} style={{ background: "rgba(255,255,255,.04)", border: "1px solid #161628", color: "#445", padding: "9px 16px", borderRadius: 9, fontFamily: "'DM Sans', sans-serif" }}>← Home</button>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontWeight: 400, fontSize: 38, letterSpacing: 2, margin: 0 }}>MY PROGRESS</h2>
          </div>
          <div style={{ background: "rgba(255,255,255,.025)", border: "1px solid #0f0f20", borderRadius: 14, padding: "20px 22px", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: "#ff4d6d", letterSpacing: 2, fontWeight: 700 }}>TOTAL XP</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#ff4d6d" }}>{totalXP}<span style={{ fontSize: 12, color: "#2a2a3a" }}>/{maxXP}</span></span>
            </div>
            <div style={{ height: 7, background: "#0a0a18", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "linear-gradient(90deg,#ff4d6d,#f77f00)", borderRadius: 3, width: `${(totalXP/maxXP)*100}%`, transition: "width .8s ease" }}/>
            </div>
            <div style={{ fontSize: 11, color: "#2a2a3a", marginTop: 6 }}>{Math.round((totalXP/maxXP)*100)}% complete</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
            {[{ label: "Day Streak", val: `${progress.streak || 0}`, ic: "🔥", col: "#f77f00" }, { label: "Completed", val: `${completed.length}/${TECHNIQUES.length}`, ic: "✅", col: "#06d6a0" }, { label: "Sessions", val: `${progress.totalSessions || 0}`, ic: "⚡", col: "#c77dff" }].map(({ label, val, ic, col }) => (
              <div key={label} style={{ background: "rgba(255,255,255,.025)", border: "1px solid #0f0f20", borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{ic}</div>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, color: col }}>{val}</div>
                <div style={{ fontSize: 10, color: "#2a2a3a", letterSpacing: 1, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
          {TECHNIQUES.map(t => {
            const done = completed.includes(t.id);
            return (
              <div key={t.id} className="btn card-hover" onClick={() => goTrain(t)} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, background: done ? `${t.color}08` : "rgba(255,255,255,.015)", border: `1px solid ${done ? t.color + "30" : "#0e0e1e"}`, borderRadius: 11, padding: "12px 16px" }}>
                <span style={{ fontSize: 24 }}>{t.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: done ? "#e8eaf0" : "#3a3a50" }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: "#2a2a3a", letterSpacing: 1 }}>{t.difficulty} · {t.xp} XP</div>
                </div>
                {done ? <span style={{ fontSize: 11, color: t.color, fontWeight: 700 }}>+{t.xp} XP ✓</span> : <span style={{ fontSize: 11, color: "#202030" }}>{t.xp} XP</span>}
              </div>
            );
          })}
          <button className="btn" onClick={() => setScreen("select")} style={{ marginTop: 20, background: "#ff4d6d", color: "#fff", border: "none", borderRadius: 10, padding: "14px 32px", fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", letterSpacing: 1 }}>Continue Training →</button>
        </div>
      </div>
    );
  }

  // ── SELECT ──────────────────────────────────────────────────
  if (screen === "select") return (
    <div style={{ minHeight: "100vh", background: "#060610" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 20px 80px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 24 }}>
          <button className="btn" onClick={() => setScreen("home")} style={{ background: "rgba(255,255,255,.04)", border: "1px solid #161628", color: "#445", padding: "9px 16px", borderRadius: 9, flexShrink: 0, marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>← Home</button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontWeight: 400, fontSize: "clamp(32px,6vw,54px)", letterSpacing: 2, margin: "0 0 3px" }}>CHOOSE TECHNIQUE</h2>
            <p style={{ color: "#2a2a3a", fontSize: 13, margin: 0 }}>{completed.length}/{TECHNIQUES.length} mastered</p>
          </div>
        </div>

        <div style={{ background: "rgba(255,77,109,.06)", border: "1px solid rgba(255,77,109,.16)", borderRadius: 10, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#4a4a60", lineHeight: 1.6 }}>
          📸 Every technique has <strong style={{ color: "#ff8fa3" }}>real photo illustrations + annotated body diagrams</strong> showing exactly how to move. Timer auto-advances steps. Audio coach reads instructions aloud.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {TECHNIQUES.map(t => {
            const done = completed.includes(t.id);
            return (
              <div key={t.id} className="btn card-hover" onClick={() => goTrain(t)} style={{ background: done ? `${t.color}08` : "rgba(255,255,255,.02)", border: `1px solid ${done ? t.color + "44" : "#0c0c1c"}`, borderRadius: 14, padding: "18px 16px", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${t.color}18`, border: `1px solid ${t.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{t.icon}</div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                    {done && <span style={{ fontSize: 10, padding: "2px 9px", borderRadius: 10, color: "#00e676", border: "1px solid #00e67640", background: "#00e67610", fontWeight: 700 }}>✓ DONE</span>}
                    <span style={{ fontSize: 10, padding: "2px 9px", borderRadius: 10, color: t.color, border: `1px solid ${t.color}33`, background: `${t.color}10`, letterSpacing: 1 }}>{t.difficulty}</span>
                  </div>
                </div>
                <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 800, margin: "0 0 3px", color: "#e8eaf0" }}>{t.name}</h3>
                <p style={{ fontSize: 12, color: "#2e2e48", margin: "0 0 8px", lineHeight: 1.45 }}>{t.subtitle}</p>
                <p style={{ fontSize: 11, color: "#222236", fontStyle: "italic", lineHeight: 1.5, margin: "0 0 12px" }}>{t.why}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#222236" }}>{t.steps.length} steps · {t.time} · {t.xp} XP</span>
                  <span style={{ fontSize: 12, color: t.color, fontWeight: 700 }}>START →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── TRAIN ───────────────────────────────────────────────────
  if (screen === "train" && tech) {
    const step   = tech.steps[stepIdx];
    const isLast = stepIdx === tech.steps.length - 1;

    return (
      <div style={{ minHeight: "100vh", background: "#060610", display: "flex", flexDirection: "column" }}>

        {/* Top bar */}
        <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(6,6,16,.97)", backdropFilter: "blur(16px)", borderBottom: "1px solid #0c0c1c", padding: "10px 16px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 10 }}>
            <button className="btn" onClick={() => { coach.stop(); setScreen("select"); }} style={{ background: "rgba(255,255,255,.04)", border: "1px solid #161628", color: "#445", padding: "7px 13px", borderRadius: 8, flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>← Exit</button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#e8eaf0" }}>{tech.icon} {tech.name}</span>
                <span style={{ fontSize: 11, color: tech.color, background: `${tech.color}18`, padding: "2px 10px", borderRadius: 10, flexShrink: 0, letterSpacing: 1 }}>Step {stepIdx + 1}/{tech.steps.length}</span>
              </div>
              <div style={{ height: 3, background: "#0a0a18", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", background: tech.color, borderRadius: 2, width: `${(stepIdx / tech.steps.length) * 100}%`, transition: "width .5s ease" }}/>
              </div>
            </div>
            <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
              <button className="btn" onClick={coach.toggle} style={{ background: coach.on ? `${tech.color}22` : "rgba(255,255,255,.04)", border: `1px solid ${coach.on ? tech.color+"55" : "#161628"}`, color: coach.on ? tech.color : "#445", padding: "7px 11px", borderRadius: 8, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                🎙️ {coach.on ? "ON" : "OFF"}
              </button>
              <button className="btn" onClick={() => setShowAR(x => !x)} style={{ background: showAR ? `${tech.color}22` : "rgba(255,255,255,.04)", border: `1px solid ${showAR ? tech.color+"55" : "#161628"}`, color: showAR ? tech.color : "#445", padding: "7px 11px", borderRadius: 8, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                📷 AR {showAR ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        </div>

        {/* Step tabs */}
        <div style={{ background: "rgba(255,255,255,.01)", borderBottom: "1px solid #0a0a18", padding: "8px 16px", overflowX: "auto" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 5 }}>
            {tech.steps.map((s, i) => (
              <button key={i} className="btn" onClick={() => goStep(i)} style={{ flexShrink: 0, padding: "4px 12px", borderRadius: 20, fontSize: 11, whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif", fontWeight: i === stepIdx ? 700 : 400, border: `1px solid ${i === stepIdx ? tech.color : i < stepIdx ? "#00e67630" : "#101020"}`, background: i === stepIdx ? `${tech.color}18` : i < stepIdx ? "#00e67606" : "transparent", color: i === stepIdx ? tech.color : i < stepIdx ? "#00e676" : "#2a2a3a" }}>
                {i < stepIdx ? "✓ " : ""}{i + 1}. {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, maxWidth: 1200, margin: "0 auto", width: "100%", padding: "20px 16px 40px" }}>

          <div className="si" style={{ marginBottom: 16 }}>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontWeight: 400, fontSize: "clamp(22px,3.5vw,34px)", color: tech.color, margin: 0, letterSpacing: 1 }}>
              Step {stepIdx + 1} of {tech.steps.length}: {step.title}
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,.9fr)", gap: 16, alignItems: "start" }}>

            {/* ── LEFT: Visuals + Action ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Photo / Diagram tabs */}
              <div>
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  {[["photo", "📸 Photo"], ["diagram", "🎯 Diagram"]].map(([tab, label]) => (
                    <button key={tab} className="btn" onClick={() => setImgTab(tab)} style={{ padding: "6px 16px", borderRadius: 20, fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: imgTab === tab ? 700 : 400, background: imgTab === tab ? `${tech.color}22` : "rgba(255,255,255,.04)", border: `1px solid ${imgTab === tab ? tech.color + "55" : "#161628"}`, color: imgTab === tab ? tech.color : "#445" }}>{label}</button>
                  ))}
                  <span style={{ marginLeft: "auto", fontSize: 10, color: "#2a2a3a", alignSelf: "center" }}>Toggle for two views</span>
                </div>

                {imgTab === "photo" ? (
                  <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", aspectRatio: "16/9", background: "#0a0a18" }}>
                    <img
                      src={step.image}
                      alt={step.imageAlt}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                    />
                    <div style={{ display: "none", position: "absolute", inset: 0, background: "#0a0a18", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                      <div style={{ fontSize: 32 }}>{tech.icon}</div>
                      <div style={{ fontSize: 12, color: "#3a3a50" }}>{step.imageAlt}</div>
                    </div>
                    {/* Overlay label */}
                    <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(0,0,0,.8)", backdropFilter: "blur(8px)", padding: "5px 12px", borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: tech.color, fontWeight: 700 }}>{step.cue}</div>
                    </div>
                  </div>
                ) : (
                  <BodyDiagram techId={tech.id} stepIdx={stepIdx} color={tech.color}/>
                )}
              </div>

              {/* THE ACTION — big and clear */}
              <div style={{ background: `${tech.color}10`, border: `2px solid ${tech.color}35`, borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ fontSize: 10, color: tech.color, letterSpacing: 2.5, marginBottom: 8, fontWeight: 700 }}>👆 WHAT TO DO RIGHT NOW</div>
                <p style={{ fontSize: "clamp(15px,2.2vw,18px)", color: "#d0d4f0", margin: 0, lineHeight: 1.65, fontWeight: 600 }}>
                  {step.action}
                </p>
              </div>

              {/* Timer + nav */}
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <Timer
                  key={`${tech.id}-${stepIdx}-${timerKey}`}
                  duration={step.duration}
                  color={tech.color}
                  onDone={advance}
                  rk={`${tech.id}-${stepIdx}-${timerKey}`}
                />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn" onClick={() => stepIdx > 0 && goStep(stepIdx - 1)} disabled={stepIdx === 0} style={{ background: "rgba(255,255,255,.04)", border: "1px solid #161628", color: stepIdx === 0 ? "#181828" : "#556", padding: "12px 14px", borderRadius: 9, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>← Prev</button>
                    <button className="btn" onClick={advance} style={{ flex: 1, background: tech.color, color: "#fff", border: "none", padding: "12px", borderRadius: 9, fontSize: 14, fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>
                      {isLast ? "✓ Complete Technique" : "Next Step →"}
                    </button>
                  </div>
                  <button className="btn" onClick={() => setTimerKey(k => k + 1)} style={{ background: "transparent", border: "1px solid #161628", color: "#334", padding: "8px", borderRadius: 9, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                    ↺ Restart timer
                  </button>
                </div>
              </div>
            </div>

            {/* ── RIGHT: DO / DON'T / AR / Steps ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* DO THIS */}
              <div style={{ background: "rgba(0,230,118,.06)", border: "1px solid rgba(0,230,118,.18)", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontSize: 13, letterSpacing: 1, color: "#00e676", marginBottom: 12, fontWeight: 800 }}>✅ DO THIS</div>
                {step.do.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: i < step.do.length - 1 ? "1px solid rgba(0,230,118,.08)" : "none" }}>
                    <span style={{ color: "#00e676", flexShrink: 0, fontSize: 16, lineHeight: 1, marginTop: 2 }}>→</span>
                    <span style={{ fontSize: "clamp(13px,1.8vw,15px)", color: "#90c8a0", lineHeight: 1.55, fontWeight: 500 }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* NOT THIS */}
              <div style={{ background: "rgba(255,50,80,.05)", border: "1px solid rgba(255,50,80,.15)", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontSize: 13, letterSpacing: 1, color: "#ff5060", marginBottom: 12, fontWeight: 800 }}>❌ NOT THIS</div>
                {step.dont.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: i < step.dont.length - 1 ? "1px solid rgba(255,50,80,.07)" : "none" }}>
                    <span style={{ color: "#ff5060", flexShrink: 0, fontSize: 16, lineHeight: 1, marginTop: 2 }}>✕</span>
                    <span style={{ fontSize: "clamp(13px,1.8vw,15px)", color: "#b08090", lineHeight: 1.55 }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* AR */}
              {showAR
                ? <WebcamAR color={tech.color} stepTitle={step.title}/>
                : (
                  <div style={{ background: "rgba(255,255,255,.015)", border: "1px solid #101020", borderRadius: 11, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>📷</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#556", marginBottom: 2 }}>AR Body Tracking</div>
                      <div style={{ fontSize: 11, color: "#2a2a3a", lineHeight: 1.4 }}>See your body tracked in real time as you practice</div>
                    </div>
                    <button className="btn" onClick={() => setShowAR(true)} style={{ background: tech.color, color: "#fff", border: "none", borderRadius: 7, padding: "8px 14px", fontSize: 11, fontWeight: 700, flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>Enable</button>
                  </div>
                )
              }

              {/* Step list */}
              <div>
                <div style={{ fontSize: 9, letterSpacing: 2.5, color: "#1e1e30", marginBottom: 7 }}>ALL STEPS</div>
                {tech.steps.map((s, i) => (
                  <div key={i} className="btn" onClick={() => goStep(i)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 8, marginBottom: 4, background: i === stepIdx ? `${tech.color}0a` : "rgba(255,255,255,.01)", border: `1px solid ${i === stepIdx ? tech.color + "30" : i < stepIdx ? "#00e67615" : "#090918"}` }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: i < stepIdx ? "#00e67612" : i === stepIdx ? `${tech.color}18` : "#090918", border: `2px solid ${i < stepIdx ? "#00e676" : i === stepIdx ? tech.color : "#161628"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: i < stepIdx ? "#00e676" : i === stepIdx ? tech.color : "#222236" }}>
                      {i < stepIdx ? "✓" : i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: i === stepIdx ? 700 : 400, color: i === stepIdx ? "#e8eaf0" : "#2a2a40" }}>{s.title}</div>
                    </div>
                    <div style={{ fontSize: 10, color: "#1e1e30", flexShrink: 0 }}>{s.duration}s</div>
                    {i === stepIdx && <div style={{ width: 6, height: 6, borderRadius: "50%", background: tech.color, animation: "pulse 1.5s ease infinite", flexShrink: 0 }}/>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── DONE ────────────────────────────────────────────────────
  if (screen === "done" && tech) {
    const totalXP = TECHNIQUES.filter(t => completed.includes(t.id)).reduce((s, t) => s + t.xp, 0);
    return (
      <div style={{ minHeight: "100vh", background: "#060610", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div className="fu" style={{ maxWidth: 560, width: "100%", padding: "56px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: `${tech.color}18`, border: `2px solid ${tech.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, marginBottom: 18 }}>{tech.icon}</div>
          <div style={{ fontSize: 10, letterSpacing: 4, color: tech.color, fontWeight: 700, border: `1px solid ${tech.color}40`, padding: "4px 16px", borderRadius: 20, marginBottom: 14, background: `${tech.color}0c` }}>TECHNIQUE COMPLETE</div>
          <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontWeight: 400, fontSize: 52, margin: "0 0 8px", letterSpacing: 2 }}>{tech.name}</h2>
          <div style={{ display: "flex", gap: 12, margin: "12px 0 22px", flexWrap: "wrap", justifyContent: "center" }}>
            {[{ n: `+${tech.xp}`, l: "XP EARNED", c: tech.color }, { n: `${totalXP}`, l: "TOTAL XP", c: "#06d6a0" }, { n: `${progress.streak || 1}🔥`, l: "STREAK", c: "#f77f00" }].map(({ n, l, c }) => (
              <div key={l} style={{ padding: "10px 18px", background: "rgba(255,255,255,.025)", border: "1px solid #0f0f20", borderRadius: 10 }}>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color: c }}>{n}</div>
                <div style={{ fontSize: 9, color: "#2a2a3a", letterSpacing: 1.5 }}>{l}</div>
              </div>
            ))}
          </div>
          <p style={{ color: "#3a3a58", fontSize: 14, lineHeight: 1.8, marginBottom: 28, maxWidth: 440 }}>
            Repeat this drill daily for 5 days. Goal: your body reacts before your brain thinks.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <button className="btn" onClick={() => { setStepIdx(0); setTimerKey(0); setScreen("train"); }} style={{ background: "transparent", border: `2px solid ${tech.color}`, color: tech.color, padding: "13px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>↺ Repeat</button>
            <button className="btn" onClick={() => setScreen("select")} style={{ background: tech.color, color: "#fff", border: "none", padding: "13px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Next Technique →</button>
            <button className="btn" onClick={() => setScreen("progress")} style={{ background: "rgba(255,255,255,.04)", border: "1px solid #161628", color: "#556", padding: "13px 16px", borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>📊 Progress</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}