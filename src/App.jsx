import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Crosshair,
  Sliders,
  Compass,
  Award,
  Search,
  Calendar,
  Terminal,
  X,
  CheckCircle2,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

const TOTAL_FRAMES = 384;
const START_RGB = [35, 39, 41];

function pad3(n) {
  return String(n).padStart(3, '0');
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Resolve API base path whether served at root (/) or /ice-tray-diamonds/
function getApiUrl(endpoint) {
  const clean = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const pathName = window.location.pathname;
  if (pathName.startsWith('/ice-tray-diamonds')) {
    return `/ice-tray-diamonds/api/v1/${clean}`;
  }
  return `./api/v1/${clean}`;
}

// Resolve frame path relative to page root
function getFrameUrl(index1Based) {
  const pathName = window.location.pathname;
  const prefix = pathName.startsWith('/ice-tray-diamonds') ? '/ice-tray-diamonds/frames' : './frames';
  return `${prefix}/frame-${pad3(index1Based)}.jpg`;
}

// Resolve 2K studio / scale / vault / microscope media path relative to page root
function getMediaUrl(filename) {
  const pathName = window.location.pathname;
  const prefix = pathName.startsWith('/ice-tray-diamonds') ? '/ice-tray-diamonds/media' : './media';
  return `${prefix}/${filename}`;
}

export const ATELIER_GALLERY_PLATES = [
  {
    id: 'plate-vault',
    file: 'vault-box.jpg',
    tag: 'COMPLETE PARURE · PRESENTATION VAULT',
    title: 'Obsidian Presentation Chest — All 5 Signature Pieces',
    caption: 'Hand-lacquered matte obsidian vault case lined in charcoal velvet housing the complete 24.80 ct suite.',
  },
  {
    id: 'plate-01',
    file: 'piece-01-bracelet.jpg',
    tag: 'PIECE 01 / 05 · 2K STUDIO MACRO',
    title: 'Glacial Tennis Bracelet (11.20 ct)',
    caption: '44 matched round brilliants suspended in a 142-part cryo-forged 950 platinum articulating chassis.',
  },
  {
    id: 'plate-02',
    file: 'piece-02-solitaire.jpg',
    tag: 'PIECE 02 / 05 · 2K STUDIO MACRO',
    title: 'Cathedral Solitaire Ring (4.65 ct)',
    caption: '3.50 ct Type IIa D-Flawless center solitaire elevated above a micro-pavé structural gallery.',
  },
  {
    id: 'plate-03',
    file: 'piece-03-eternity.jpg',
    tag: 'PIECE 03 / 05 · 2K STUDIO MACRO',
    title: 'Full-Circle Eternity Band (2.40 ct)',
    caption: '28 French-set diamonds forming an unbroken 360-degree orbital ring of spectral dispersion.',
  },
  {
    id: 'plate-04',
    file: 'piece-04-earrings.jpg',
    tag: 'PIECE 04 / 05 · 2K STUDIO MACRO',
    title: 'Cascade Pear Drop Earrings (3.85 ct)',
    caption: 'Matched pear-cut terminal drops suspended below articulated round brilliant columns.',
  },
  {
    id: 'plate-05',
    file: 'piece-05-medallion.jpg',
    tag: 'PIECE 05 / 05 · 2K STUDIO MACRO',
    title: 'Articulated Halo Medallion (2.70 ct)',
    caption: 'Floating cluster core enclosed within a concentric diamond halo and diamond-cut platinum chain.',
  },
  {
    id: 'plate-scale-wrist',
    file: 'scale-wrist.jpg',
    tag: 'HUMAN SCALE · WRist DRAPE (165MM)',
    title: 'On-Wrist Proportion — Glacial Tennis Bracelet',
    caption: 'Editorial daylight scale reference showing 4.10 mm calibrated links draped fluidly against the wrist.',
  },
  {
    id: 'plate-scale-hand',
    file: 'scale-hand.jpg',
    tag: 'HUMAN SCALE · FINGER STACK',
    title: 'On-Hand Proportion — Solitaire & Eternity Band Stack',
    caption: 'The 3.50 ct Cathedral Solitaire worn flush alongside the French-set Full-Circle Eternity Band.',
  },
  {
    id: 'plate-scale-portrait',
    file: 'scale-portrait.jpg',
    tag: 'HUMAN SCALE · EAR & NECKLINE',
    title: 'On-Skin Proportion — Cascade Drop Earrings & Halo Medallion',
    caption: 'Acoustic drop movement and collarbone framing under natural salon illumination.',
  },
  {
    id: 'plate-metal-obsidian',
    file: 'metal-obsidian.jpg',
    tag: 'BESPOKE METALLURGY · AU750_OBS',
    title: '18k Obsidian Black-Rhodium Claw Setting Macro',
    caption: 'PVD-bonded ruthenium-rhodium finish creating extreme dark architectural contrast against D-color fire.',
  },
  {
    id: 'plate-engraving',
    file: 'engraving-macro.jpg',
    tag: 'BESPOKE HALLMARK · 5-MICRON LASER',
    title: 'Interior Gallery Laser Micro-Inscription',
    caption: 'High-precision serif hallmarking inside the comfort-radius inner shank.',
  },
  {
    id: 'plate-gia-microscope',
    file: 'gia-girdle-microscope.jpg',
    tag: '150× OPTICAL VERIFICATION · 100 µm',
    title: 'Gemological Microscope View of Laser-Inscribed Diamond Girdle',
    caption: 'Every primary diamond girdle is cold-laser inscribed with its unique GIA report and Atelier serial.',
  },
];

// Persistent session token for 15-minute edition holds
function getSessionToken() {
  try {
    let token = window.localStorage.getItem('icetray_atelier_session');
    if (!token) {
      token = 'sess-' + Math.random().toString(36).slice(2, 12) + '-' + Date.now().toString(36);
      window.localStorage.setItem('icetray_atelier_session', token);
    }
    return token;
  } catch {
    return 'sess-ephemeral';
  }
}

export default function App() {
  // ─── PRELOADER & CANVAS REFS ───
  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const canvasRef = useRef(null);
  const flipbookRef = useRef(null);
  const heroOverlayRef = useRef(null);
  const copy20Ref = useRef(null);
  const copy50Ref = useRef(null);
  const copy80Ref = useRef(null);
  const hudFrameRef = useRef(null);
  const hudFillRef = useRef(null);
  const framesRef = useRef(new Array(TOTAL_FRAMES));
  const audioCtxRef = useRef(null);
  const soundEnabledRef = useRef(false);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // ─── FULL-STACK API STATE ───
  const [suiteData, setSuiteData] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [editions, setEditions] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [selectedPieceSlug, setSelectedPieceSlug] = useState('glacial-tennis-bracelet');
  const [pieceViewMode, setPieceViewMode] = useState('STUDIO'); // 'STUDIO' | 'SCALE' | 'GIRDLE'
  const [configVisualMode, setConfigVisualMode] = useState('SELECTION'); // 'SELECTION' | 'SCALE' | 'METALLURGY' | 'ENGRAVING'
  const [suitePreviewFile, setSuitePreviewFile] = useState('vault-box.jpg');
  const [selectedCertId, setSelectedCertId] = useState('lot-01');
  const [lightboxPlate, setLightboxPlate] = useState(null);
  const [drawerPiece, setDrawerPiece] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminData, setAdminData] = useState(null);

  // ─── BESPOKE CONFIGURATOR STATE ───
  const [configForm, setConfigForm] = useState({
    scope: 'FULL_SUITE',
    pieceSlug: 'glacial-tennis-bracelet',
    metalAlloy: 'PT950',
    diamondTier: 'D_VVS1',
    ringSize: 'EU 52 (US 6)',
    wristSizeMm: 165,
    engravingText: 'LUMIERE GLACIALE · 2026',
    destination: 'GENEVA',
  });
  const [liveQuote, setLiveQuote] = useState(null);
  const [selectedEdition, setSelectedEdition] = useState(4);
  const [holdNotice, setHoldNotice] = useState('');

  // ─── RESERVATION & VAULT PASS STATE ───
  const [clientForm, setClientForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    dispatchMethod: 'ARMOURED_COURIER',
  });
  const [reservationStatus, setReservationStatus] = useState({ loading: false, error: '', pass: null });

  // ─── GIA SEARCH & VAULT DOSSIER LOOKUP STATE ───
  const [giaSearch, setGiaSearch] = useState('');
  const [lookupCode, setLookupCode] = useState('ITD-2026-0101');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState('');

  // ─── PRIVATE SALON APPOINTMENT STATE ───
  const [salonForm, setSalonForm] = useState({
    clientName: '',
    clientEmail: '',
    salonCity: 'Geneva — Rue du Rhône Flagship',
    preferredDate: '2026-11-12',
    focusPiece: 'Complete Ice Tray Parure (5-Piece Suite)',
    notes: '',
  });
  const [salonConfirmed, setSalonConfirmed] = useState(null);

  // Synthesize crystalline horological micro-tick on frame step
  const playHorologicalTick = useCallback((frameIdx) => {
    if (!soundEnabledRef.current) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1680 + (frameIdx % 12) * 35, ctx.currentTime);
      gain.gain.setValueAtTime(0.014, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.024);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.025);
    } catch {
      // Ignore audio autoplay restrictions
    }
  }, []);

  // ─── FETCH INITIAL SUITE DATA FROM REST API ───
  const fetchSuiteData = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('suite'), {
        headers: { 'x-atelier-session': getSessionToken() },
      });
      if (!res.ok) return;
      const data = await res.json();
      setSuiteData(data);
      setPieces(data.pieces || []);
      setEditions(data.editions || []);
      setCertificates(data.certificates || []);

      // Pick first available or held-by-us edition
      const mySession = getSessionToken();
      const myHeld = (data.editions || []).find((e) => e.status === 'HELD' && e.heldBySession === mySession);
      const firstAvail = (data.editions || []).find((e) => e.status === 'AVAILABLE');
      if (myHeld) {
        setSelectedEdition(myHeld.editionNumber);
      } else if (firstAvail) {
        setSelectedEdition(firstAvail.editionNumber);
      }
    } catch (err) {
      console.error('Failed to load suite API:', err);
    }
  }, []);

  useEffect(() => {
    fetchSuiteData();
    // Load initial showcase dossier ITD-2026-0101
    fetch(getApiUrl('reservations/ITD-2026-0101'))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.reservation) setLookupResult(d.reservation);
      })
      .catch(() => {});
  }, [fetchSuiteData]);

  // ─── LIVE BESPOKE QUOTE API CALL ───
  useEffect(() => {
    let cancelled = false;
    fetch(getApiUrl('configure/quote'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-atelier-session': getSessionToken(),
      },
      body: JSON.stringify(configForm),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.quote) {
          setLiveQuote(data.quote);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [configForm]);

  // ─── LIVE GIA CERTIFICATE SEARCH API CALL ───
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(getApiUrl(`certificates?q=${encodeURIComponent(giaSearch)}`))
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.certificates) setCertificates(data.certificates);
        })
        .catch(() => {});
    }, 150);
    return () => clearTimeout(timer);
  }, [giaSearch]);

  // ─── 1-SECOND COUNTDOWN TICK FOR HELD EDITIONS ───
  useEffect(() => {
    const interval = setInterval(() => {
      setEditions((prev) =>
        prev.map((ed) => {
          if (ed.status === 'HELD' && ed.holdRemainingSeconds > 0) {
            return { ...ed, holdRemainingSeconds: Math.max(0, ed.holdRemainingSeconds - 1) };
          }
          return ed;
        }),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── 60FPS INERTIAL FLIPBOOK ENGINE ───
  useEffect(() => {
    document.body.classList.add('loading');
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });

    let targetProgress = 0;
    let smoothProgress = 0;
    let lastDrawnProgress = -1;
    let lastTickedFrame = -1;
    let rafId = 0;
    let needsResize = true;
    let readyFlag = false;
    let loaded = 0;

    function updateCanvasSize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const width = Math.round(window.innerWidth * dpr);
      const height = Math.round(window.innerHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      needsResize = false;
    }

    function getFrameState(progress) {
      const p = Math.min(1, Math.max(0, progress));
      if (p <= 0.001) return { primary: 0, sceneMix: 0 };
      if (p >= 0.999) return { primary: TOTAL_FRAMES - 1, sceneMix: 1 };

      if (p < 0.5) {
        const t = p / 0.5;
        const f = t < 0.07 ? lerp(0, 22, t / 0.07) : lerp(22, 148, (t - 0.07) / 0.93);
        const idx = Math.min(191, Math.max(0, Math.round(f)));
        return { primary: idx, sceneMix: 0 };
      } else {
        const t = (p - 0.5) / 0.5;
        const f = lerp(220, 383, t);
        const idx = Math.min(383, Math.max(192, Math.round(f)));
        return { primary: idx, sceneMix: 1 };
      }
    }

    function computeDrawRect(cw, ch, iw, ih) {
      const viewportAspect = cw / ch;
      let scale;
      if (viewportAspect >= 1.05) {
        scale = Math.max(cw / iw, ch / ih);
      } else {
        const containScale = cw / iw;
        const coverScale = ch / ih;
        const portraitFactor = Math.max(0, Math.min(1, (viewportAspect - 0.42) / 0.63));
        scale = lerp(containScale * 1.08, coverScale, portraitFactor * 0.32);
      }
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (cw - dw) * 0.5;
      const dy = (ch - dh) * 0.46;
      return { dx, dy, dw, dh, isLetterboxed: dy > 2 || dy + dh < ch - 2 };
    }

    function renderCompositeFrame(progress) {
      if (needsResize) updateCanvasSize();

      const state = getFrameState(progress);
      const imgA = framesRef.current[state.primary];
      if (!imgA || !imgA.complete || !imgA.naturalWidth) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const iw = imgA.naturalWidth;
      const ih = imgA.naturalHeight;
      const rect = computeDrawRect(cw, ch, iw, ih);

      if (rect.isLetterboxed) {
        if (rect.dy > 0) {
          ctx.drawImage(imgA, 0, 0, iw, 4, rect.dx, 0, rect.dw, rect.dy + 2);
        }
        const botStart = rect.dy + rect.dh;
        if (botStart < ch) {
          ctx.drawImage(imgA, 0, ih - 4, iw, 4, rect.dx, botStart - 2, rect.dw, ch - botStart + 2);
        }
      }

      ctx.globalAlpha = 1;
      ctx.drawImage(imgA, rect.dx, rect.dy, rect.dw, rect.dh);

      if (rect.isLetterboxed) {
        const t = Math.min(1, Math.max(0, progress));
        const bgR = Math.round(START_RGB[0] * (1 - t));
        const bgG = Math.round(START_RGB[1] * (1 - t));
        const bgB = Math.round(START_RGB[2] * (1 - t));
        const pageTone = `rgb(${bgR}, ${bgG}, ${bgB})`;

        const topGrad = ctx.createLinearGradient(0, 0, 0, rect.dy + rect.dh * 0.18);
        topGrad.addColorStop(0, pageTone);
        topGrad.addColorStop(1, `rgba(${bgR}, ${bgG}, ${bgB}, 0)`);
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, cw, rect.dy + rect.dh * 0.18);

        const botFadeStart = rect.dy + rect.dh * 0.78;
        const botGrad = ctx.createLinearGradient(0, botFadeStart, 0, ch);
        botGrad.addColorStop(0, `rgba(${bgR}, ${bgG}, ${bgB}, 0)`);
        botGrad.addColorStop(0.55, `rgba(${bgR}, ${bgG}, ${bgB}, 0.82)`);
        botGrad.addColorStop(1, pageTone);
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, botFadeStart, cw, ch - botFadeStart);
      }

      const displayedFrame = Math.min(
        TOTAL_FRAMES,
        Math.max(1, Math.round(lerp(1, TOTAL_FRAMES, progress))),
      );
      if (hudFrameRef.current) {
        hudFrameRef.current.textContent = `FRAME ${pad3(displayedFrame)} / ${TOTAL_FRAMES}`;
      }
      if (hudFillRef.current) {
        hudFillRef.current.style.width = `${(progress * 100).toFixed(1)}%`;
      }

      if (displayedFrame !== lastTickedFrame) {
        lastTickedFrame = displayedFrame;
        playHorologicalTick(displayedFrame);
      }
    }

    function updateCopyCallout(el, progress, center, halfWidth) {
      if (!el) return;
      const dist = Math.abs(progress - center);
      if (dist >= halfWidth) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        return;
      }
      const norm = dist / halfWidth;
      const alpha = Math.cos(norm * Math.PI * 0.5);
      const offsetY = progress < center ? (1 - alpha) * 16 : -(1 - alpha) * 16;
      el.style.opacity = alpha.toFixed(3);
      el.style.transform = `translateY(${offsetY.toFixed(1)}px)`;
    }

    function updateOverlays(progress) {
      if (heroOverlayRef.current) {
        if (progress <= 0.11) {
          const heroAlpha = 1 - progress / 0.11;
          heroOverlayRef.current.style.opacity = heroAlpha.toFixed(3);
          heroOverlayRef.current.style.transform = `translateY(${(-progress * 140).toFixed(1)}px)`;
        } else {
          heroOverlayRef.current.style.opacity = '0';
        }
      }

      updateCopyCallout(copy20Ref.current, progress, 0.2, 0.11);
      updateCopyCallout(copy50Ref.current, progress, 0.5, 0.11);
      updateCopyCallout(copy80Ref.current, progress, 0.8, 0.11);

      const t = Math.min(1, Math.max(0, progress));
      const r = Math.round(START_RGB[0] * (1 - t));
      const g = Math.round(START_RGB[1] * (1 - t));
      const b = Math.round(START_RGB[2] * (1 - t));
      document.documentElement.style.setProperty('--bg-current', `rgb(${r}, ${g}, ${b})`);
    }

    function readScrollTarget() {
      const section = flipbookRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const maxScroll = Math.max(1, section.offsetHeight - window.innerHeight);
      const scrolled = -rect.top;
      targetProgress = Math.min(1, Math.max(0, scrolled / maxScroll));
    }

    function tick() {
      rafId = 0;
      if (!readyFlag) return;

      const diff = targetProgress - smoothProgress;
      const absDiff = Math.abs(diff);

      if (absDiff > 0.00015) {
        const step = Math.sign(diff) * Math.min(absDiff * 0.085, 0.014);
        smoothProgress += step;
      } else {
        smoothProgress = targetProgress;
      }

      if (Math.abs(smoothProgress - lastDrawnProgress) > 0.00005 || needsResize) {
        renderCompositeFrame(smoothProgress);
        updateOverlays(smoothProgress);
        lastDrawnProgress = smoothProgress;
      }

      if (Math.abs(targetProgress - smoothProgress) > 0.00015 || needsResize) {
        rafId = requestAnimationFrame(tick);
      }
    }

    function scheduleTick() {
      readScrollTarget();
      if (!rafId) {
        rafId = requestAnimationFrame(tick);
      }
    }

    window.__syncFlipbookNow = () => {
      readScrollTarget();
      smoothProgress = targetProgress;
      renderCompositeFrame(smoothProgress);
      updateOverlays(smoothProgress);
      lastDrawnProgress = smoothProgress;
    };

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.src = getFrameUrl(i + 1);

      const onDone = () => {
        loaded++;
        setLoadedCount(loaded);
        if (i === 0) {
          updateCanvasSize();
          renderCompositeFrame(0);
        }
        if (loaded === TOTAL_FRAMES) {
          readyFlag = true;
          setIsReady(true);
          document.body.classList.remove('loading');
          readScrollTarget();
          smoothProgress = targetProgress;
          needsResize = true;
          scheduleTick();

          // Pre-warm the 12 2K studio, scale, vault & microscope plates in the background
          setTimeout(() => {
            ATELIER_GALLERY_PLATES.forEach((plate) => {
              const mediaImg = new Image();
              mediaImg.decoding = 'async';
              mediaImg.src = getMediaUrl(plate.file);
            });
          }, 150);
        }
      };

      img.onload = onDone;
      img.onerror = onDone;
      framesRef.current[i] = img;
    }

    const onResize = () => {
      needsResize = true;
      scheduleTick();
    };

    window.addEventListener('scroll', scheduleTick, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', scheduleTick);
      window.removeEventListener('resize', onResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [playHorologicalTick]);

  // ─── INTERACTIVE ACTIONS ───
  const scrollToProgress = (pct) => {
    const section = flipbookRef.current;
    if (!section) return;
    const maxScroll = Math.max(1, section.offsetHeight - window.innerHeight);
    const targetY = section.offsetTop + maxScroll * pct;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  const handleHoldEdition = async (editionNum) => {
    setHoldNotice('');
    try {
      const res = await fetch(getApiUrl(`editions/${editionNum}/hold`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-atelier-session': getSessionToken(),
        },
        body: JSON.stringify({ sessionToken: getSessionToken() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHoldNotice(data.error || 'Could not hold edition.');
        return;
      }
      setEditions(data.editions || []);
      setSelectedEdition(editionNum);
      setHoldNotice(`Edition N° ${String(editionNum).padStart(2, '0')}/10 locked for 15:00 minutes.`);
    } catch {
      setHoldNotice('Network error while locking edition.');
    }
  };

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    setReservationStatus({ loading: true, error: '', pass: null });
    try {
      const res = await fetch(getApiUrl('reservations'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-atelier-session': getSessionToken(),
        },
        body: JSON.stringify({
          ...configForm,
          ...clientForm,
          editionNumber: selectedEdition,
          sessionToken: getSessionToken(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReservationStatus({ loading: false, error: data.error || 'Reservation failed.', pass: null });
        return;
      }
      setEditions(data.editions || []);
      setReservationStatus({ loading: false, error: '', pass: data.reservation });
      setLookupCode(data.reservation.referenceCode);
      setLookupResult(data.reservation);
    } catch {
      setReservationStatus({ loading: false, error: 'Could not reach Atelier reservation service.', pass: null });
    }
  };

  const handleLookupDossier = async (e) => {
    if (e) e.preventDefault();
    setLookupError('');
    try {
      const res = await fetch(getApiUrl(`reservations/${encodeURIComponent(lookupCode.trim())}`));
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error || 'Dossier not found.');
        setLookupResult(null);
        return;
      }
      setLookupResult(data.reservation);
    } catch {
      setLookupError('Unable to query vault ledger.');
    }
  };

  const handleBookSalon = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(getApiUrl('appointments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salonForm),
      });
      const data = await res.json();
      if (res.ok && data.appointment) {
        setSalonConfirmed(data.appointment);
      }
    } catch {
      // ignore
    }
  };

  const openAdminPortal = async () => {
    setAdminOpen(true);
    try {
      const res = await fetch(getApiUrl('admin/overview'));
      if (res.ok) {
        setAdminData(await res.json());
      }
    } catch {
      // ignore
    }
  };

  const handleAdminReleaseEdition = async (num) => {
    await fetch(getApiUrl(`editions/${num}/release`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminReset: true }),
    });
    await openAdminPortal();
    await fetchSuiteData();
  };

  const loadPct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
  const activePiece = pieces.find((p) => p.slug === selectedPieceSlug) || pieces[0];
  const configuredPiece = pieces.find((p) => p.slug === configForm.pieceSlug) || activePiece || pieces[0];
  const activeCert = certificates.find((c) => c.id === selectedCertId) || certificates[0];
  const availableCount = editions.filter((e) => e.status === 'AVAILABLE').length;

  // Compute the active image & caption for the Anatomical Piece Spotlight stage
  const spotlightImageFile =
    pieceViewMode === 'SCALE'
      ? activePiece?.media?.scaleImage || 'scale-wrist.jpg'
      : pieceViewMode === 'GIRDLE'
        ? 'gia-girdle-microscope.jpg'
        : activePiece?.media?.studioImage || 'piece-01-bracelet.jpg';

  const spotlightImageCaption =
    pieceViewMode === 'SCALE'
      ? activePiece?.media?.scaleCaption || 'Human Scale Reference'
      : pieceViewMode === 'GIRDLE'
        ? `150× Gemological Microscope Verification · Girdle ID: ${activePiece?.diamondLots?.[0]?.girdleInscription || 'GIA 2267849102'}`
        : activePiece?.media?.studioCaption || '2K Studio Macro';

  // Compute the active image & caption for the Bespoke Configurator stage
  const configStageData = (() => {
    if (configVisualMode === 'ENGRAVING') {
      return {
        file: 'engraving-macro.jpg',
        badge: '5-MICRON LASER HALLMARK PREVIEW',
        caption: `Interior Comfort-Radius Gallery · Inscribed: “${configForm.engravingText || 'ICE TRAY · GENEVA'}”`,
      };
    }
    if (configVisualMode === 'METALLURGY') {
      if (configForm.metalAlloy === 'AU750_OBS') {
        return {
          file: 'metal-obsidian.jpg',
          badge: 'AU750_OBS · BLACK-RHODIUM MACRO',
          caption: '18k Obsidian Black-Rhodium PVD Prong Architecture against D-Flawless Fire',
        };
      }
      return {
        file: configuredPiece?.media?.studioImage || 'piece-02-solitaire.jpg',
        badge: `${configForm.metalAlloy} · SPECULAR CHASSIS`,
        caption: `${liveQuote?.metalAlloy?.name || 'Cryo-Forged 950 Platinum'} Mirror-Lapped Gallery`,
      };
    }
    if (configVisualMode === 'SCALE') {
      return {
        file: configuredPiece?.media?.scaleImage || 'scale-hand.jpg',
        badge: configuredPiece?.media?.scaleLabel || 'ON-SKIN PROPORTION',
        caption: configuredPiece?.media?.scaleCaption || 'Natural Daylight Human Scale Reference',
      };
    }
    // Default 'SELECTION' mode
    if (configForm.scope === 'FULL_SUITE') {
      return {
        file: suitePreviewFile || 'vault-box.jpg',
        badge:
          suitePreviewFile === 'vault-box.jpg'
            ? 'COMPLETE 5-PIECE PARURE · OBSIDIAN VAULT CHEST'
            : 'SUITE COMPONENT STUDIO PLATE',
        caption:
          suitePreviewFile === 'vault-box.jpg'
            ? 'Bespoke Matte-Black Obsidian Vault Case housing all 5 signature pieces (24.80 ct total)'
            : 'Click any piece thumbnail below to inspect individual silhouettes included in the suite',
      };
    }
    return {
      file: configuredPiece?.media?.studioImage || 'piece-01-bracelet.jpg',
      badge: `PIECE ${configuredPiece?.code || '01'} · 2K STUDIO PLATE`,
      caption: configuredPiece?.media?.studioCaption || '2K Studio Macro',
    };
  })();

  return (
    <>
      {/* ─── FULL-FRAME PRELOADER ─── */}
      <div id="loader" className={isReady ? 'hidden' : ''} role="status" aria-live="polite">
        <div className="loader-top-bar">
          <div className="loader-top-bar-fill" style={{ width: `${loadPct}%` }} />
        </div>
        <div className="loader-content">
          <div className="loader-brand">Ice Tray Diamonds</div>
          <div className="loader-track">
            <div className="loader-fill" style={{ width: `${loadPct}%` }} />
          </div>
          <div className="loader-meta">
            <span>Loading Optical Frames ({loadedCount}/{TOTAL_FRAMES})</span>
            <span>{loadPct}%</span>
          </div>
        </div>
      </div>

      {/* ─── FIXED HAUTE JOAILLERIE NAVIGATION ─── */}
      <header className="site-nav">
        <div className="nav-brand-wrap">
          <a href="#flipbook" className="nav-logo">
            Ice Tray Diamonds
          </a>
          <span className="nav-status-pill" title="Connected to SQLite WAL Atelier Ledger">
            <span className="status-dot" />
            {availableCount}/10 Suites Open
          </span>
        </div>

        <nav className="nav-links">
          <a href="#flipbook">Deconstruction</a>
          <a href="#specifications">Anatomical Dossier</a>
          <a href="#editions">Editions (01–10)</a>
          <a href="#acquire">Bespoke Atelier</a>
          <a href="#gia-registry">GIA Registry</a>
          <a href="#concierge">Vault Lookup</a>
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            className={`nav-pill-btn ${soundEnabled ? 'active' : ''}`}
            onClick={() => setSoundEnabled((v) => !v)}
            title="Toggle Horological Audio Feedback"
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span>Audio</span>
          </button>
          <button
            type="button"
            className="nav-pill-btn"
            onClick={openAdminPortal}
            title="Open Atelier Command Center (Live Database Ledger)"
          >
            <Terminal size={13} />
            <span>Atelier OS</span>
          </button>
        </div>
      </header>

      {/* ─── 440VH PINNED 60FPS INERTIAL FLIPBOOK SECTION ─── */}
      <section className="flipbook-section" id="flipbook" ref={flipbookRef}>
        <div className="canvas-sticky">
          <canvas
            id="flipbook-canvas"
            ref={canvasRef}
            aria-label="Interactive 3D exploded view of Ice Tray Diamonds collection"
          />
          <div className="canvas-vignette" />

          {/* Large Serif Headline at Top of Scroll */}
          <div className="hero-overlay" id="hero-overlay" ref={heroOverlayRef}>
            <div className="hero-header-group">
              <p className="hero-eyebrow">Haute Joaillerie — Archive Edition N° 01</p>
              <h1 className="hero-headline">Ice Tray Diamonds</h1>
              <p className="hero-sub">
                Five architectural diamond silhouettes, deconstructed in motion.
              </p>
            </div>
            <div className="scroll-cue">
              <span>Scroll to Deconstruct</span>
              <div className="scroll-cue-line" />
            </div>
          </div>

          {/* Three Short Lines of Copy at 20%, 50%, and 80% of Scroll */}
          <div className="story-overlay">
            <div className="story-line" id="copy-20" ref={copy20Ref}>
              <span className="story-index">01 / 20% — Spectral Clarity</span>
              <p className="story-copy">
                Type IIa D-flawless diamonds, custom-cut to bend light with sub-zero precision.
              </p>
            </div>

            <div className="story-line" id="copy-50" ref={copy50Ref}>
              <span className="story-index">02 / 50% — Suspended Architecture</span>
              <p className="story-copy">
                Every prong, bezel, and pavé gallery milled from solid 950 platinum to tolerances of five microns.
              </p>
            </div>

            <div className="story-line" id="copy-80" ref={copy80Ref}>
              <span className="story-index">03 / 80% — Eternal Tension</span>
              <p className="story-copy">
                384 interlocking components engineered to float seamlessly against the skin.
              </p>
            </div>
          </div>

          {/* Subtle Frame HUD */}
          <div className="canvas-bottom-bar" style={{ justifyContent: 'flex-end' }}>
            <div className="scroll-hud">
              <span id="hud-frame" ref={hudFrameRef}>
                FRAME 001 / 384
              </span>
              <div className="scroll-hud-bar">
                <div className="scroll-hud-fill" id="hud-fill" ref={hudFillRef} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PITCH BLACK FULL-STACK ATELIER PLATFORM ─── */}
      <main className="post-scroll-content" id="specifications">
        <div className="atelier-container">
          {/* 1. ANATOMICAL SPECIFICATIONS & INTERACTIVE 5-PIECE EXPLORER */}
          <section className="atelier-section">
            <div className="section-header">
              <p className="section-eyebrow">Technical Dossier · Live SQLite Telemetry</p>
              <h2 className="section-title">Anatomical Specifications</h2>
              <p className="section-desc">
                The Ice Tray Parure unites five signature pieces—Tennis Bracelet, Cathedral Solitaire Ring,
                Eternity Band, Cascade Drop Earrings, and Halo Medallion Pendant—crafted as a single numbered suite.
              </p>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">24.80 ct</div>
                <div className="metric-label">Total Diamond Weight</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">D / VVS1</div>
                <div className="metric-label">Color &amp; Clarity Grade</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">Pt 950</div>
                <div className="metric-label">Cryo-Forged Platinum</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">384</div>
                <div className="metric-label">Micro-Milled Components</div>
              </div>
            </div>

            {/* Interactive 5-Piece Selector Tabs with 2K Studio Thumbnails */}
            {pieces.length > 0 && (
              <>
                <div className="piece-tabs" role="tablist">
                  {pieces.map((piece) => (
                    <button
                      key={piece.id}
                      type="button"
                      role="tab"
                      aria-selected={selectedPieceSlug === piece.slug}
                      className={`piece-tab-btn ${selectedPieceSlug === piece.slug ? 'active' : ''}`}
                      onClick={() => setSelectedPieceSlug(piece.slug)}
                    >
                      <div className="piece-tab-thumb-wrap">
                        <img
                          src={getMediaUrl(piece.media?.studioImage || 'piece-01-bracelet.jpg')}
                          alt={piece.name}
                          className="piece-tab-thumb"
                          loading="lazy"
                        />
                        <span className="piece-tab-price-pill">
                          ${piece.basePriceUsd.toLocaleString()}
                        </span>
                      </div>
                      <span className="piece-tab-code">PIECE {piece.code} / 05</span>
                      <span className="piece-tab-name">{piece.name}</span>
                      <span className="piece-tab-meta">
                        {piece.baseCaratWeight.toFixed(2)} ct · {piece.componentCount} parts
                      </span>
                    </button>
                  ))}
                </div>

                {activePiece && (
                  <div className="piece-spotlight-card">
                    <div>
                      <p className="piece-french-tag">{activePiece.frenchTitle}</p>
                      <h3 className="piece-spotlight-title">
                        {activePiece.code}. {activePiece.name}
                      </h3>
                      <p className="piece-spotlight-summary">{activePiece.summary}</p>

                      <div className="piece-tech-grid">
                        <div className="piece-tech-item">
                          <div className="piece-tech-label">Carat &amp; Stone Count</div>
                          <div className="piece-tech-val">
                            {activePiece.baseCaratWeight.toFixed(2)} ct ({activePiece.diamondCount} Diamonds)
                          </div>
                        </div>
                        <div className="piece-tech-item">
                          <div className="piece-tech-label">Milled Architecture</div>
                          <div className="piece-tech-val">
                            {activePiece.componentCount} Parts · ±{activePiece.toleranceMicrons}µm Tolerance
                          </div>
                        </div>
                        <div className="piece-tech-item">
                          <div className="piece-tech-label">Pt 950 Mass &amp; Lock</div>
                          <div className="piece-tech-val">
                            {activePiece.gramWeightPt950}g · {activePiece.claspMechanism.split('·')[0]}
                          </div>
                        </div>
                        <div className="piece-tech-item">
                          <div className="piece-tech-label">Individual Valuation</div>
                          <div className="piece-tech-val">
                            ${activePiece.basePriceUsd.toLocaleString()} USD
                          </div>
                        </div>
                      </div>

                      <div className="piece-spotlight-actions" style={{ marginBottom: '1.75rem' }}>
                        <button
                          type="button"
                          className="btn-outline-ice"
                          onClick={() => scrollToProgress(activePiece.hotspots?.optimalScrollPct || 0.3)}
                        >
                          <Compass size={14} />
                          <span>View Exploded Frame on Canvas</span>
                        </button>
                        <button
                          type="button"
                          className="btn-primary-white"
                          onClick={() => {
                            setConfigForm((prev) => ({
                              ...prev,
                              scope: 'SINGLE_PIECE',
                              pieceSlug: activePiece.slug,
                            }));
                            setConfigVisualMode('SELECTION');
                            document.getElementById('acquire')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <Sliders size={14} />
                          <span>Configure {activePiece.name}</span>
                        </button>
                      </div>

                      <div>
                        <div className="config-label" style={{ marginBottom: '0.75rem' }}>
                          Registered GIA Diamond Parcels in Piece {activePiece.code}
                        </div>
                        {(activePiece.diamondLots || []).map((lot) => (
                          <div
                            key={lot.id}
                            style={{
                              padding: '0.9rem 1rem',
                              border: '1px solid rgba(255,255,255,0.1)',
                              background: 'rgba(255,255,255,0.02)',
                              marginBottom: '0.65rem',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                              <span className="gia-report-num">{lot.giaReportNumber}</span>
                              <span className="gia-verified-pill">
                                {lot.colorGrade} / {lot.clarityGrade}
                              </span>
                            </div>
                            <div style={{ fontFamily: 'var(--serif)', fontSize: '1.08rem', marginBottom: '0.2rem' }}>
                              {lot.lotTitle}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {lot.caratWeight.toFixed(2)} ct ({lot.stoneCount} stones) · {lot.cutShape} · {lot.originMine}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Column: Interactive 2K Studio Macro & On-Skin Human Scale Stage */}
                    <div className="piece-visual-column">
                      <div className="visual-stage-header">
                        <span className="config-label">Optical Inspection Stage (2K)</span>
                        <div className="visual-mode-pills" role="group" aria-label="Piece Visual Mode">
                          <button
                            type="button"
                            className={`visual-pill-btn ${pieceViewMode === 'STUDIO' ? 'active' : ''}`}
                            onClick={() => setPieceViewMode('STUDIO')}
                          >
                            2K Studio Macro
                          </button>
                          <button
                            type="button"
                            className={`visual-pill-btn ${pieceViewMode === 'SCALE' ? 'active' : ''}`}
                            onClick={() => setPieceViewMode('SCALE')}
                          >
                            {activePiece.media?.scaleLabel || 'On-Skin Scale'}
                          </button>
                          <button
                            type="button"
                            className={`visual-pill-btn ${pieceViewMode === 'GIRDLE' ? 'active' : ''}`}
                            onClick={() => setPieceViewMode('GIRDLE')}
                          >
                            150× GIA Girdle
                          </button>
                        </div>
                      </div>

                      <div
                        className={`piece-visual-viewport ${pieceViewMode === 'SCALE' ? 'portrait-mode' : ''}`}
                        onClick={() =>
                          setLightboxPlate({
                            file: spotlightImageFile,
                            tag: `PIECE ${activePiece.code} / 05 · ${pieceViewMode} VIEW`,
                            title: `${activePiece.code}. ${activePiece.name}`,
                            caption: spotlightImageCaption,
                          })
                        }
                        title="Click to inspect full 2K plate"
                      >
                        <img
                          src={getMediaUrl(spotlightImageFile)}
                          alt={`${activePiece.name} — ${pieceViewMode}`}
                          className="piece-visual-img"
                        />
                        <div className="visual-viewport-overlay-top">
                          <span className="visual-plate-tag">
                            {pieceViewMode === 'SCALE'
                              ? `HUMAN SCALE · ${activePiece.media?.scaleLabel?.toUpperCase()}`
                              : pieceViewMode === 'GIRDLE'
                                ? '150× GEMOLOGICAL MICROSCOPE'
                                : `PIECE ${activePiece.code} · 2K STUDIO PLATE`}
                          </span>
                          <span className="visual-zoom-pill">
                            <ArrowUpRight size={12} />
                            <span>2K Loupe</span>
                          </span>
                        </div>
                        {pieceViewMode === 'GIRDLE' && (
                          <div className="girdle-live-overlay">
                            <span>LASER INSCRIPTION VERIFIED:</span>
                            <strong>{activePiece.diamondLots?.[0]?.girdleInscription || 'GIA 2267849102 · ITD-01'}</strong>
                          </div>
                        )}
                      </div>

                      <div className="piece-visual-caption-bar">
                        <span>{spotlightImageCaption}</span>
                        <button
                          type="button"
                          className="visual-link-btn"
                          onClick={() =>
                            setLightboxPlate({
                              file: spotlightImageFile,
                              tag: `PIECE ${activePiece.code} / 05 · ${pieceViewMode} VIEW`,
                              title: `${activePiece.code}. ${activePiece.name}`,
                              caption: spotlightImageCaption,
                            })
                          }
                        >
                          Open 12-Plate Gallery
                        </button>
                      </div>

                      {/* Dual Thumbnail Strip: Studio vs On-Skin Scale */}
                      <div className="piece-dual-thumbs">
                        <button
                          type="button"
                          className={`dual-thumb-card ${pieceViewMode === 'STUDIO' ? 'active' : ''}`}
                          onClick={() => setPieceViewMode('STUDIO')}
                        >
                          <img
                            src={getMediaUrl(activePiece.media?.studioImage || 'piece-01-bracelet.jpg')}
                            alt="2K Studio Macro"
                          />
                          <div>
                            <span className="dual-thumb-tag">01 · Studio Plate</span>
                            <strong className="dual-thumb-title">Obsidian Slate Macro</strong>
                          </div>
                        </button>
                        <button
                          type="button"
                          className={`dual-thumb-card ${pieceViewMode === 'SCALE' ? 'active' : ''}`}
                          onClick={() => setPieceViewMode('SCALE')}
                        >
                          <img
                            src={getMediaUrl(activePiece.media?.scaleImage || 'scale-wrist.jpg')}
                            alt="On-Skin Human Scale"
                          />
                          <div>
                            <span className="dual-thumb-tag">02 · Human Scale</span>
                            <strong className="dual-thumb-title">
                              {activePiece.media?.scaleLabel || 'On-Skin Proportion'}
                            </strong>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* 2. LIVE EDITION ALLOCATION MATRIX (01/10 - 10/10) */}
          <section className="atelier-section" id="editions">
            <div className="section-header">
              <p className="section-eyebrow">Concurrency-Safe Vault Ledger</p>
              <h2 className="section-title">Archive Edition Allocation (01 / 10 — 10 / 10)</h2>
              <p className="section-desc">
                Strictly ten numbered suites exist worldwide. Select any available edition slot below to place an
                authenticated 15-minute concierge hold while configuring your commission.
              </p>
            </div>

            {holdNotice && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                  border: '1px solid rgba(252, 211, 77, 0.4)',
                  background: 'rgba(252, 211, 77, 0.08)',
                  fontSize: '0.78rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-amber)',
                }}
              >
                {holdNotice}
              </div>
            )}

            <div className="edition-matrix-grid">
              {editions.map((ed) => {
                const isSelected = selectedEdition === ed.editionNumber;
                const statusLower = ed.status.toLowerCase();
                return (
                  <div
                    key={ed.editionNumber}
                    className={`edition-cell ${statusLower} ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      if (ed.status !== 'ACQUIRED') {
                        handleHoldEdition(ed.editionNumber);
                      }
                    }}
                  >
                    <div>
                      <div className="edition-top">
                        <span className="edition-code">{ed.editionCode}</span>
                        <span className={`edition-status-badge ${statusLower}`}>
                          {ed.status === 'HELD'
                            ? `HELD ${Math.floor(ed.holdRemainingSeconds / 60)}:${String(
                                ed.holdRemainingSeconds % 60,
                              ).padStart(2, '0')}`
                            : ed.status}
                        </span>
                      </div>
                      <p className="edition-city">{ed.vaultCity}</p>
                    </div>

                    <div className="edition-foot">
                      {ed.status === 'ACQUIRED' ? (
                        <>
                          <span>Collector: {ed.collectorMonogram}</span>
                          <Lock size={12} />
                        </>
                      ) : ed.status === 'HELD' ? (
                        <>
                          <span>Soft-Locked</span>
                          <Sparkles size={12} />
                        </>
                      ) : (
                        <>
                          <span>Click to Hold Slot</span>
                          <Unlock size={12} />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. BESPOKE PARURE CONFIGURATOR & LIVE QUOTE ENGINE */}
          <section className="atelier-section" id="acquire">
            <div className="section-header">
              <p className="section-eyebrow">Dynamic Pricing &amp; Metallurgy Engine</p>
              <h2 className="section-title">Bespoke Atelier Configurator</h2>
              <p className="section-desc">
                Tailor the complete 5-piece parure or an individual silhouette with your preferred precious alloy,
                Type IIa optical diamond grade, custom sizing, and laser-inscribed gallery hallmark.
              </p>
            </div>

            <div className="configurator-layout">
              <div className="config-controls-panel">
                {/* Scope Selection */}
                <div className="config-group">
                  <div className="config-label-row">
                    <span className="config-label">01. Acquisition Scope</span>
                    <span className="config-hint">Suite bundle saves $2,000 USD</span>
                  </div>
                  <div className="config-option-grid">
                    <button
                      type="button"
                      className={`config-choice-btn ${configForm.scope === 'FULL_SUITE' ? 'active' : ''}`}
                      onClick={() => {
                        setConfigForm((f) => ({ ...f, scope: 'FULL_SUITE' }));
                        setSuitePreviewFile('vault-box.jpg');
                        setConfigVisualMode('SELECTION');
                      }}
                    >
                      <span className="choice-title">Complete 5-Piece Parure</span>
                      <span className="choice-sub">24.80 ct · All 5 Signature Pieces in Vault Chest · $48,500 Base</span>
                    </button>
                    <button
                      type="button"
                      className={`config-choice-btn ${configForm.scope === 'SINGLE_PIECE' ? 'active' : ''}`}
                      onClick={() => {
                        setConfigForm((f) => ({ ...f, scope: 'SINGLE_PIECE' }));
                        setConfigVisualMode('SELECTION');
                      }}
                    >
                      <span className="choice-title">Individual Signature Piece</span>
                      <span className="choice-sub">Acquire a single piece from the collection</span>
                    </button>
                  </div>

                  {configForm.scope === 'SINGLE_PIECE' && (
                    <div style={{ marginTop: '0.85rem' }}>
                      <select
                        className="atelier-select"
                        value={configForm.pieceSlug}
                        onChange={(e) => {
                          setConfigForm((f) => ({ ...f, pieceSlug: e.target.value }));
                          setConfigVisualMode('SELECTION');
                        }}
                      >
                        {pieces.map((p) => (
                          <option key={p.id} value={p.slug}>
                            {p.code}. {p.name} ({p.baseCaratWeight.toFixed(2)} ct — ${p.basePriceUsd.toLocaleString()} USD)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Metallurgy Alloy */}
                <div className="config-group">
                  <div className="config-label-row">
                    <span className="config-label">02. Precious Metallurgy</span>
                    <span className="config-hint">Cryo-hardened chassis · Live optical preview</span>
                  </div>
                  <div className="config-option-grid">
                    {(suiteData?.options?.alloys || []).map((alloy) => (
                      <button
                        key={alloy.code}
                        type="button"
                        className={`config-choice-btn ${configForm.metalAlloy === alloy.code ? 'active' : ''}`}
                        onClick={() => {
                          setConfigForm((f) => ({ ...f, metalAlloy: alloy.code }));
                          if (alloy.code === 'AU750_OBS') {
                            setConfigVisualMode('METALLURGY');
                          } else if (configVisualMode === 'METALLURGY') {
                            setConfigVisualMode('SELECTION');
                          }
                        }}
                      >
                        <span className="choice-title">{alloy.name}</span>
                        <span className="choice-sub">{alloy.description}</span>
                      </button>
                    ))}
                  </div>
                  {configForm.metalAlloy === 'AU750_OBS' && (
                    <div className="config-inline-visual-strip">
                      <img
                        src={getMediaUrl('metal-obsidian.jpg')}
                        alt="18k Obsidian Black-Rhodium Claw Setting Macro"
                        onClick={() =>
                          setLightboxPlate(
                            ATELIER_GALLERY_PLATES.find((p) => p.file === 'metal-obsidian.jpg'),
                          )
                        }
                      />
                      <div>
                        <span className="gia-report-num">AU750_OBS · BESPOKE DARK METALLURGY</span>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Sub-micron PVD obsidian ruthenium-rhodium coating applied to the claw tips and gallery rails
                          to eliminate metal reflection and amplify D-color diamond contrast.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Diamond Grade Tier */}
                <div className="config-group">
                  <div className="config-label-row">
                    <span className="config-label">03. Optical Diamond Grade</span>
                    <span className="config-hint">100% GIA Certified</span>
                  </div>
                  <div className="config-option-grid">
                    {(suiteData?.options?.diamondTiers || []).map((tier) => (
                      <button
                        key={tier.code}
                        type="button"
                        className={`config-choice-btn ${configForm.diamondTier === tier.code ? 'active' : ''}`}
                        onClick={() => setConfigForm((f) => ({ ...f, diamondTier: tier.code }))}
                      >
                        <span className="choice-title">{tier.name}</span>
                        <span className="choice-sub">{tier.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sizing & Destination Hub */}
                <div className="config-group">
                  <div className="config-label-row">
                    <span className="config-label">04. Bespoke Sizing &amp; Vault Dispatch</span>
                    <span className="config-hint">Complimentary precision fit</span>
                  </div>
                  <div className="config-inputs-row">
                    <div>
                      <label className="config-hint" style={{ display: 'block', marginBottom: '0.35rem' }}>
                        Solitaire &amp; Eternity Ring Size
                      </label>
                      <select
                        className="atelier-select"
                        value={configForm.ringSize}
                        onChange={(e) => setConfigForm((f) => ({ ...f, ringSize: e.target.value }))}
                      >
                        <option>EU 48 (US 4.5)</option>
                        <option>EU 50 (US 5.25)</option>
                        <option>EU 52 (US 6)</option>
                        <option>EU 54 (US 6.75)</option>
                        <option>EU 56 (US 7.5)</option>
                        <option>EU 58 (US 8.25)</option>
                      </select>
                    </div>
                    <div>
                      <label className="config-hint" style={{ display: 'block', marginBottom: '0.35rem' }}>
                        Bracelet Wrist Length: {configForm.wristSizeMm} mm
                      </label>
                      <input
                        type="range"
                        min="145"
                        max="195"
                        step="5"
                        value={configForm.wristSizeMm}
                        onChange={(e) => setConfigForm((f) => ({ ...f, wristSizeMm: Number(e.target.value) }))}
                        style={{ width: '100%', accentColor: '#dce8ef', marginTop: '0.6rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <label className="config-hint" style={{ display: 'block', marginBottom: '0.35rem' }}>
                      Destination Vault / Armoured Handover Hub
                    </label>
                    <select
                      className="atelier-select"
                      value={configForm.destination}
                      onChange={(e) => setConfigForm((f) => ({ ...f, destination: e.target.value }))}
                    >
                      {(suiteData?.options?.destinationHubs || []).map((hub) => (
                        <option key={hub.code} value={hub.code}>
                          {hub.name} ({hub.courierFeeUsd === 0 ? 'Complimentary Flagship Handover' : `+$${hub.courierFeeUsd} Courier + Insured Transit`})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Custom Laser Engraving */}
                <div className="config-group">
                  <div className="config-label-row">
                    <span className="config-label">05. Interior Gallery Laser Micro-Inscription</span>
                    <span className="config-hint">Up to 36 characters · 5-micron depth</span>
                  </div>
                  <input
                    type="text"
                    maxLength={36}
                    className="atelier-input"
                    placeholder="Enter custom motto, initials, or date..."
                    value={configForm.engravingText}
                    onFocus={() => setConfigVisualMode('ENGRAVING')}
                    onChange={(e) => {
                      setConfigForm((f) => ({ ...f, engravingText: e.target.value }));
                      setConfigVisualMode('ENGRAVING');
                    }}
                  />
                  <div className="engraving-visual-preview-card">
                    <img
                      src={getMediaUrl('engraving-macro.jpg')}
                      alt="Interior Gallery Laser-Engraved Ring Shank Macro"
                      className="engraving-macro-thumb"
                      onClick={() =>
                        setLightboxPlate(
                          ATELIER_GALLERY_PLATES.find((p) => p.file === 'engraving-macro.jpg'),
                        )
                      }
                      title="Click to inspect 2K laser hallmark macro"
                    />
                    <div className="engraving-preview-content">
                      <span className="engraving-preview-label">Live Inner Shank Hallmark Preview</span>
                      <span className="engraving-preview-text">
                        {configForm.engravingText || 'ICE TRAY · GENEVA'}
                      </span>
                      <span className="engraving-preview-sub">
                        Pt950 · N° {String(selectedEdition).padStart(2, '0')}/10 · 24.80 CT
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Visual Stage + Live Server Quote + Acquisition Form */}
              <div className="valuation-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="nav-status-pill">
                    Edition N° {String(selectedEdition).padStart(2, '0')} / 10 Selected
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', letterSpacing: '0.14em' }}>
                    LIVE API VALUATION
                  </span>
                </div>

                {/* Live Interactive Visual Stage inside the Checkout / Valuation Column */}
                <div className="config-visual-stage">
                  <div className="config-stage-tabs" role="tablist">
                    <button
                      type="button"
                      className={`visual-pill-btn ${configVisualMode === 'SELECTION' ? 'active' : ''}`}
                      onClick={() => setConfigVisualMode('SELECTION')}
                    >
                      {configForm.scope === 'FULL_SUITE' ? 'Vault Chest' : 'Studio Plate'}
                    </button>
                    <button
                      type="button"
                      className={`visual-pill-btn ${configVisualMode === 'SCALE' ? 'active' : ''}`}
                      onClick={() => setConfigVisualMode('SCALE')}
                    >
                      On-Skin Scale
                    </button>
                    <button
                      type="button"
                      className={`visual-pill-btn ${configVisualMode === 'METALLURGY' ? 'active' : ''}`}
                      onClick={() => setConfigVisualMode('METALLURGY')}
                    >
                      Alloy Finish
                    </button>
                    <button
                      type="button"
                      className={`visual-pill-btn ${configVisualMode === 'ENGRAVING' ? 'active' : ''}`}
                      onClick={() => setConfigVisualMode('ENGRAVING')}
                    >
                      Laser Hallmark
                    </button>
                  </div>

                  <div
                    className={`config-stage-viewport ${configVisualMode === 'SCALE' ? 'portrait-crop' : ''}`}
                    onClick={() =>
                      setLightboxPlate({
                        file: configStageData.file,
                        tag: configStageData.badge,
                        title: liveQuote?.title || 'The Complete Ice Tray Parure',
                        caption: configStageData.caption,
                      })
                    }
                    title="Click to open full 2K plate inspection"
                  >
                    <img
                      src={getMediaUrl(configStageData.file)}
                      alt={configStageData.badge}
                      className="config-stage-img"
                    />
                    <div className="visual-viewport-overlay-top">
                      <span className="visual-plate-tag">{configStageData.badge}</span>
                      <span className="visual-zoom-pill">
                        <ArrowUpRight size={11} />
                        <span>2K</span>
                      </span>
                    </div>
                    {configVisualMode === 'ENGRAVING' && (
                      <div className="config-stage-engraving-badge">
                        <span>CUSTOM SHANK INSCRIPTION:</span>
                        <strong>“{configForm.engravingText || 'ICE TRAY · GENEVA'}”</strong>
                      </div>
                    )}
                  </div>

                  <div className="config-stage-caption">{configStageData.caption}</div>

                  {/* Quick 6-Plate Selector Strip when Full Suite is active */}
                  {configForm.scope === 'FULL_SUITE' && configVisualMode === 'SELECTION' && (
                    <div className="suite-mini-strip" aria-label="Suite Component Quick Switcher">
                      <button
                        type="button"
                        className={`suite-mini-thumb ${suitePreviewFile === 'vault-box.jpg' ? 'active' : ''}`}
                        onClick={() => setSuitePreviewFile('vault-box.jpg')}
                        title="Obsidian Vault Presentation Chest (All 5 Pieces)"
                      >
                        <img src={getMediaUrl('vault-box.jpg')} alt="Vault Chest" />
                        <span>Vault</span>
                      </button>
                      {pieces.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`suite-mini-thumb ${suitePreviewFile === p.media?.studioImage ? 'active' : ''}`}
                          onClick={() => setSuitePreviewFile(p.media?.studioImage || 'piece-01-bracelet.jpg')}
                          title={`${p.code}. ${p.name}`}
                        >
                          <img src={getMediaUrl(p.media?.studioImage || 'piece-01-bracelet.jpg')} alt={p.name} />
                          <span>{p.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <h3 className="piece-spotlight-title" style={{ fontSize: '1.55rem', marginBottom: '0.35rem' }}>
                  {liveQuote?.title || 'The Complete Ice Tray Parure'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {liveQuote?.metalAlloy?.name} · {liveQuote?.diamondTier?.name}
                </p>

                {liveQuote && (
                  <>
                    <div className="line-items">
                      <div className="line-item">
                        <span>Base Atelier Valuation</span>
                        <strong>${liveQuote.breakdown.basePriceUsd.toLocaleString()}</strong>
                      </div>
                      <div className="line-item">
                        <span>Metallurgy Adjustment ({liveQuote.metalAlloy.code})</span>
                        <strong>
                          {liveQuote.breakdown.alloyDeltaUsd >= 0 ? '+' : ''}
                          ${liveQuote.breakdown.alloyDeltaUsd.toLocaleString()}
                        </strong>
                      </div>
                      <div className="line-item">
                        <span>Optical Diamond Grade ({liveQuote.diamondTier.code})</span>
                        <strong>
                          {liveQuote.breakdown.diamondDeltaUsd >= 0 ? '+' : ''}
                          ${liveQuote.breakdown.diamondDeltaUsd.toLocaleString()}
                        </strong>
                      </div>
                      <div className="line-item">
                        <span>Wrist Sizing ({liveQuote.wristSizeMm}mm) &amp; Laser Hallmark</span>
                        <strong>
                          +${(liveQuote.breakdown.sizingDeltaUsd + liveQuote.breakdown.engravingFeeUsd).toLocaleString()}
                        </strong>
                      </div>
                      <div className="line-item">
                        <span>Armoured Logistics &amp; Lloyd’s Transit Insurance</span>
                        <strong>+${liveQuote.breakdown.logisticsUsd.toLocaleString()}</strong>
                      </div>
                      <div className="line-item" style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <span>Total Weight &amp; Crafting Lead Time</span>
                        <strong>
                          {liveQuote.metrics.totalCarats} ct · {liveQuote.metrics.estimatedGramWeight}g · {liveQuote.metrics.estimatedLeadDays} Days
                        </strong>
                      </div>
                    </div>

                    <div className="valuation-total-row">
                      <span className="config-label">Total Commission Valuation</span>
                      <span className="valuation-total-amount">
                        ${liveQuote.breakdown.totalValuationUsd.toLocaleString()} USD
                      </span>
                    </div>
                  </>
                )}

                {/* Direct Reservation Form */}
                <form onSubmit={handleCreateReservation} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input
                    type="text"
                    required
                    className="atelier-input"
                    placeholder="Collector Full Name (e.g. Lady Evelyn Vance)"
                    value={clientForm.clientName}
                    onChange={(e) => setClientForm((f) => ({ ...f, clientName: e.target.value }))}
                  />
                  <div className="config-inputs-row">
                    <input
                      type="email"
                      required
                      className="atelier-input"
                      placeholder="Private Email Address"
                      value={clientForm.clientEmail}
                      onChange={(e) => setClientForm((f) => ({ ...f, clientEmail: e.target.value }))}
                    />
                    <input
                      type="tel"
                      className="atelier-input"
                      placeholder="Direct Phone / Family Office"
                      value={clientForm.clientPhone}
                      onChange={(e) => setClientForm((f) => ({ ...f, clientPhone: e.target.value }))}
                    />
                  </div>
                  <select
                    className="atelier-select"
                    value={clientForm.dispatchMethod}
                    onChange={(e) => setClientForm((f) => ({ ...f, dispatchMethod: e.target.value }))}
                  >
                    <option value="ARMOURED_COURIER">Armoured Courier Dispatch (Brink’s Global)</option>
                    <option value="SALON_HANDOVER">Flagship Salon Private Handover</option>
                    <option value="PRIVATE_AVIATION">Private Aviation Tarmac Escort</option>
                  </select>

                  {reservationStatus.error && (
                    <div style={{ color: '#fca5a5', fontSize: '0.78rem' }}>{reservationStatus.error}</div>
                  )}

                  <button
                    type="submit"
                    className="btn-primary-white"
                    disabled={reservationStatus.loading}
                    style={{ width: '100%', padding: '1.1rem' }}
                  >
                    <ShieldCheck size={16} />
                    <span>
                      {reservationStatus.loading
                        ? 'Issuing Cryptographic Vault Pass...'
                        : `Buy Now — Lock Edition N° ${String(selectedEdition).padStart(2, '0')}/10`}
                    </span>
                  </button>
                </form>

                {reservationStatus.pass && (
                  <div className="vault-pass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="gia-verified-pill">ALLOCATION CONFIRMED</span>
                      <span className="gia-report-num">{reservationStatus.pass.referenceCode}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '1.35rem', marginBottom: '0.35rem' }}>
                      {reservationStatus.pass.itemTitle} — {reservationStatus.pass.editionCode}
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                      Reserved for <strong>{reservationStatus.pass.clientName}</strong> · Valuation:{' '}
                      <strong>${reservationStatus.pass.totalValuationUsd.toLocaleString()} USD</strong> · Est. Handover:{' '}
                      {reservationStatus.pass.estimatedLeadDays} days
                    </p>
                    <div className="gia-hash">
                      SHA-256 Vault Signature: {reservationStatus.pass.provenanceSignature}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 4. GIA PROVENANCE & OPTICAL REGISTRY */}
          <section className="atelier-section" id="gia-registry">
            <div className="section-header">
              <p className="section-eyebrow">Cryptographic Kimberley Process Ledger</p>
              <h2 className="section-title">GIA Optical &amp; Provenance Registry</h2>
              <p className="section-desc">
                Every diamond parcel in the Ice Tray Parure is laser-inscribed on the girdle and cryptographically
                hashed into our Geneva registry. Search by GIA report number, mine origin, or piece name.
              </p>
            </div>

            {/* 150x Gemological Microscope Girdle Inscription Inspector */}
            {activeCert && (
              <div className="gia-microscope-banner">
                <div
                  className="gia-microscope-viewport"
                  onClick={() =>
                    setLightboxPlate({
                      file: 'gia-girdle-microscope.jpg',
                      tag: `150× OPTICAL MICROSCOPE · ${activeCert.giaReportNumber}`,
                      title: `Laser Girdle Inscription — ${activeCert.lotTitle}`,
                      caption: `Inscribed Girdle ID: ${activeCert.girdleInscription} · Origin: ${activeCert.originMine}`,
                    })
                  }
                  title="Click to enlarge 2K 150x Gemological Microscope Plate"
                >
                  <img
                    src={getMediaUrl('gia-girdle-microscope.jpg')}
                    alt="150x Gemological Microscope View of Laser-Inscribed Diamond Girdle"
                    className="gia-microscope-img"
                  />
                  <div className="visual-viewport-overlay-top">
                    <span className="visual-plate-tag">150× DARKFIELD OPTICS · 100 µm SCALE</span>
                    <span className="visual-zoom-pill">
                      <ArrowUpRight size={12} />
                      <span>2K Plate</span>
                    </span>
                  </div>
                </div>

                <div className="gia-microscope-telemetry">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="section-eyebrow" style={{ marginBottom: 0 }}>
                      Active Optical Loupe Telemetry
                    </span>
                    <span className="gia-verified-pill">COLD-LASER VERIFIED</span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.65rem', fontWeight: 300 }}>
                    {activeCert.lotTitle}
                  </h3>
                  <div className="girdle-inscription-readout">
                    <span>LASER GIRDLE ID:</span>
                    <strong>{activeCert.girdleInscription}</strong>
                  </div>
                  <div className="piece-tech-grid" style={{ marginBottom: '0.75rem' }}>
                    <div className="piece-tech-item">
                      <div className="piece-tech-label">GIA Report &amp; Grade</div>
                      <div className="piece-tech-val">
                        {activeCert.giaReportNumber} · {activeCert.colorGrade} / {activeCert.clarityGrade}
                      </div>
                    </div>
                    <div className="piece-tech-item">
                      <div className="piece-tech-label">Mine Provenance</div>
                      <div className="piece-tech-val">{activeCert.originMine}</div>
                    </div>
                  </div>
                  <div className="gia-hash" style={{ marginTop: 0 }}>
                    SHA-256 Registry Hash: {activeCert.provenanceHash}
                  </div>
                </div>
              </div>
            )}

            <div className="gia-toolbar">
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  className="atelier-input"
                  placeholder="Search by GIA Report (e.g. GIA-2267849102), Girdle ID, Mine, or Piece..."
                  value={giaSearch}
                  onChange={(e) => setGiaSearch(e.target.value)}
                />
              </div>
              <button type="button" className="btn-outline-ice" onClick={() => setGiaSearch('')}>
                Show All ({certificates.length})
              </button>
            </div>

            <div className="gia-grid">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className={`gia-card ${selectedCertId === cert.id ? 'active-cert' : ''}`}
                  onClick={() => setSelectedCertId(cert.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="gia-card-top">
                    <div>
                      <span className="gia-report-num">{cert.giaReportNumber}</span>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-subtle)', marginTop: '0.15rem' }}>
                        Girdle Laser ID: {cert.girdleInscription}
                      </div>
                    </div>
                    <span className="gia-verified-pill">
                      {selectedCertId === cert.id ? 'Inspecting 150×' : 'SHA-256 Verified'}
                    </span>
                  </div>

                  <h4 className="gia-lot-title">{cert.lotTitle}</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', marginBottom: '0.4rem' }}>
                    Piece {cert.pieceCode}: {cert.pieceName} · {cert.originMine}
                  </p>

                  <div className="gia-specs-strip">
                    <div className="gia-spec-cell">
                      <span>Carat / Count</span>
                      <strong>
                        {cert.caratWeight.toFixed(2)} ct ({cert.stoneCount})
                      </strong>
                    </div>
                    <div className="gia-spec-cell">
                      <span>Grade</span>
                      <strong>
                        {cert.colorGrade} / {cert.clarityGrade}
                      </strong>
                    </div>
                    <div className="gia-spec-cell">
                      <span>Table / Depth</span>
                      <strong>
                        {cert.proportions.tablePct}% / {cert.proportions.depthPct}%
                      </strong>
                    </div>
                    <div className="gia-spec-cell">
                      <span>Angles (Cr/Pv)</span>
                      <strong>
                        {cert.proportions.crownAngle}° / {cert.proportions.pavilionAngle}°
                      </strong>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {cert.diamondType} · Cut: {cert.cutGrade} · Fluorescence: {cert.fluorescence} · Dimensions:{' '}
                    {cert.measurementsMm}
                  </div>
                  <div className="gia-hash">Hash: {cert.provenanceHash}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 5. VAULT DOSSIER LOOKUP & PRIVATE SALON VIEWING */}
          <section className="atelier-section" id="concierge">
            <div className="dual-concierge-grid">
              {/* Vault Pass Verification */}
              <div className="config-controls-panel">
                <p className="section-eyebrow">Client Dossier Verification</p>
                <h3 className="piece-spotlight-title" style={{ fontSize: '1.65rem', marginBottom: '0.5rem' }}>
                  Vault Pass &amp; Allocation Lookup
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Enter a reservation reference code (such as <code>ITD-2026-0101</code> or your newly issued Vault
                  Pass) to verify live allocation status and cryptographic provenance.
                </p>

                <form onSubmit={handleLookupDossier} style={{ display: 'flex', gap: '0.65rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    className="atelier-input"
                    value={lookupCode}
                    onChange={(e) => setLookupCode(e.target.value)}
                    placeholder="ITD-2026-0101"
                  />
                  <button type="submit" className="btn-outline-ice">
                    <Search size={14} />
                    <span>Verify</span>
                  </button>
                </form>

                {lookupError && <div style={{ color: '#fca5a5', fontSize: '0.8rem' }}>{lookupError}</div>}

                {lookupResult && (
                  <div className="vault-pass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="gia-report-num">{lookupResult.referenceCode}</span>
                      <span className="gia-verified-pill">{lookupResult.status}</span>
                    </div>
                    <h4 style={{ fontFamily: 'var(--serif)', fontSize: '1.35rem', marginBottom: '0.35rem' }}>
                      {lookupResult.editionCode} — {lookupResult.itemTitle}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      <div>
                        <strong>Collector:</strong> {lookupResult.clientName} ({lookupResult.monogram})
                      </div>
                      <div>
                        <strong>Specification:</strong> {lookupResult.metalAlloy?.name} · {lookupResult.diamondTier?.name}
                      </div>
                      <div>
                        <strong>Sizing &amp; Hallmark:</strong> Ring {lookupResult.ringSize} · Wrist {lookupResult.wristSizeMm}mm ·{' '}
                        <em>“{lookupResult.engravingText || 'Standard Atelier Hallmark'}”</em>
                      </div>
                      <div>
                        <strong>Dispatch Hub:</strong> {lookupResult.destinationHub?.name} ({lookupResult.dispatchMethod})
                      </div>
                      <div>
                        <strong>Valuation:</strong> ${lookupResult.totalValuationUsd?.toLocaleString()} USD
                      </div>
                    </div>
                    <div className="gia-hash">Signature: {lookupResult.provenanceSignature}</div>
                  </div>
                )}
              </div>

              {/* Private Salon Viewing Appointment */}
              <div className="config-controls-panel">
                <p className="section-eyebrow">White-Glove Presentation</p>
                <h3 className="piece-spotlight-title" style={{ fontSize: '1.65rem', marginBottom: '0.5rem' }}>
                  Schedule a Private Salon Viewing
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Arrange a private champagne presentation of the physical Ice Tray Parure under gemological
                  daylight optics in Geneva, New York, Tokyo, or Zurich.
                </p>

                <form onSubmit={handleBookSalon} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div className="config-inputs-row">
                    <input
                      type="text"
                      required
                      className="atelier-input"
                      placeholder="Your Full Name"
                      value={salonForm.clientName}
                      onChange={(e) => setSalonForm((f) => ({ ...f, clientName: e.target.value }))}
                    />
                    <input
                      type="email"
                      required
                      className="atelier-input"
                      placeholder="Private Email"
                      value={salonForm.clientEmail}
                      onChange={(e) => setSalonForm((f) => ({ ...f, clientEmail: e.target.value }))}
                    />
                  </div>
                  <div className="config-inputs-row">
                    <select
                      className="atelier-select"
                      value={salonForm.salonCity}
                      onChange={(e) => setSalonForm((f) => ({ ...f, salonCity: e.target.value }))}
                    >
                      <option>Geneva — Rue du Rhône Flagship</option>
                      <option>New York — Fifth Avenue Penthouse Vault</option>
                      <option>Tokyo — Ginza Chuo-ku Private Salon</option>
                      <option>Zurich — Bahnhofstrasse Vault</option>
                      <option>London — New Bond Street Salon</option>
                    </select>
                    <input
                      type="date"
                      className="atelier-input"
                      value={salonForm.preferredDate}
                      onChange={(e) => setSalonForm((f) => ({ ...f, preferredDate: e.target.value }))}
                    />
                  </div>
                  <input
                    type="text"
                    className="atelier-input"
                    placeholder="Special requests (security escort, specific pieces to stage...)"
                    value={salonForm.notes}
                    onChange={(e) => setSalonForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                  <button type="submit" className="btn-outline-ice" style={{ justifyContent: 'center', padding: '1rem' }}>
                    <Calendar size={15} />
                    <span>Request Private Salon Appointment</span>
                  </button>
                </form>

                {salonConfirmed && (
                  <div className="vault-pass-card" style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span className="gia-verified-pill">SALON CONFIRMED</span>
                      <span className="gia-report-num">{salonConfirmed.bookingCode}</span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                      Private viewing scheduled for <strong>{salonConfirmed.clientName}</strong> at{' '}
                      <strong>{salonConfirmed.salonCity}</strong> on <strong>{salonConfirmed.preferredDate}</strong>.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <footer className="site-footer">
            <span>© 2026 ICE TRAY DIAMONDS ATELIER · FULL-STACK DIGITAL ARCHIVE (REACT 19 · EXPRESS 5 · SQLITE WAL)</span>
            <span>GENEVA · NEW YORK · TOKYO · ZURICH</span>
          </footer>
        </div>
      </main>

      {/* ─── SLIDE-OVER DRAWER: PIECE ANATOMICAL DOSSIER (FROM CANVAS HOTSPOTS) ─── */}
      {drawerPiece && (
        <div className="drawer-backdrop" onClick={() => setDrawerPiece(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <span className="section-eyebrow">Spatial Canvas Hotspot Dossier</span>
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.75rem', fontWeight: 300 }}>
                  {drawerPiece.code}. {drawerPiece.name}
                </h3>
              </div>
              <button type="button" className="nav-pill-btn" onClick={() => setDrawerPiece(null)}>
                <X size={16} />
              </button>
            </div>

            <p className="piece-french-tag">{drawerPiece.frenchTitle}</p>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--text-muted)' }}>{drawerPiece.summary}</p>

            <div className="piece-tech-grid">
              <div className="piece-tech-item">
                <div className="piece-tech-label">Diamond Weight</div>
                <div className="piece-tech-val">
                  {drawerPiece.baseCaratWeight.toFixed(2)} ct ({drawerPiece.diamondCount} Stones)
                </div>
              </div>
              <div className="piece-tech-item">
                <div className="piece-tech-label">Micro-Milled Parts</div>
                <div className="piece-tech-val">
                  {drawerPiece.componentCount} Components (±{drawerPiece.toleranceMicrons}µm)
                </div>
              </div>
              <div className="piece-tech-item">
                <div className="piece-tech-label">Pt 950 Mass</div>
                <div className="piece-tech-val">{drawerPiece.gramWeightPt950} Grams</div>
              </div>
              <div className="piece-tech-item">
                <div className="piece-tech-label">Piece Valuation</div>
                <div className="piece-tech-val">${drawerPiece.basePriceUsd.toLocaleString()} USD</div>
              </div>
            </div>

            <div>
              <div className="config-label" style={{ marginBottom: '0.65rem' }}>
                Associated GIA Certificates
              </div>
              {(drawerPiece.diamondLots || []).map((lot) => (
                <div
                  key={lot.id}
                  style={{
                    padding: '0.9rem',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '0.6rem',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="gia-report-num">{lot.giaReportNumber}</span>
                    <span className="gia-verified-pill">
                      {lot.caratWeight.toFixed(2)} ct · {lot.colorGrade}/{lot.clarityGrade}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>{lot.lotTitle}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '0.15rem' }}>
                    {lot.originMine} · Inscription: {lot.girdleInscription}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
              <button
                type="button"
                className="btn-primary-white"
                style={{ flex: 1 }}
                onClick={() => {
                  const slug = drawerPiece.slug;
                  setDrawerPiece(null);
                  setSelectedPieceSlug(slug);
                  setConfigForm((f) => ({ ...f, scope: 'SINGLE_PIECE', pieceSlug: slug }));
                  document.getElementById('acquire')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Configure This Piece in Atelier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SLIDE-OVER DRAWER: ATELIER OS ADMIN COMMAND CENTER ─── */}
      {adminOpen && (
        <div className="drawer-backdrop" onClick={() => setAdminOpen(false)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <span className="section-eyebrow">Backend Telemetry &amp; SQLite Ledger</span>
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.7rem', fontWeight: 300 }}>
                  Atelier OS — Command Center
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="nav-pill-btn" onClick={openAdminPortal}>
                  <RefreshCw size={13} />
                </button>
                <button type="button" className="nav-pill-btn" onClick={() => setAdminOpen(false)}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {adminData ? (
              <>
                <div className="piece-tech-grid">
                  <div className="piece-tech-item">
                    <div className="piece-tech-label">Edition Ledger</div>
                    <div className="piece-tech-val">
                      {adminData.metrics.availableEditions} Open · {adminData.metrics.heldEditions} Held ·{' '}
                      {adminData.metrics.acquiredEditions} Acquired
                    </div>
                  </div>
                  <div className="piece-tech-item">
                    <div className="piece-tech-label">Pipeline Valuation</div>
                    <div className="piece-tech-val">
                      ${adminData.metrics.totalPipelineUsd.toLocaleString()} USD ({adminData.metrics.totalReservations} Dossiers)
                    </div>
                  </div>
                </div>

                <div>
                  <div className="config-label" style={{ marginBottom: '0.6rem' }}>
                    Manage Edition Slots (Reset Holds / Allocations)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                    {adminData.editions.map((ed) => (
                      <div
                        key={ed.editionNumber}
                        style={{
                          padding: '0.65rem 0.8rem',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.75rem',
                        }}
                      >
                        <div>
                          <strong>{ed.editionCode}</strong> · {ed.status}
                        </div>
                        {(ed.status === 'HELD' || (ed.status === 'ACQUIRED' && ed.editionNumber > 3 && ed.editionNumber !== 6)) && (
                          <button
                            type="button"
                            className="nav-pill-btn"
                            onClick={() => handleAdminReleaseEdition(ed.editionNumber)}
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="config-label" style={{ marginBottom: '0.6rem' }}>
                    Recent Client Reservations (SQLite `reservations` table)
                  </div>
                  {adminData.reservations.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        padding: '0.8rem',
                        border: '1px solid var(--border-subtle)',
                        marginBottom: '0.5rem',
                        fontSize: '0.78rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="gia-report-num">{r.referenceCode}</span>
                        <strong>${r.totalValuationUsd.toLocaleString()} USD</strong>
                      </div>
                      <div>
                        {r.editionCode} · {r.clientName} ({r.clientEmail})
                      </div>
                      <div style={{ color: 'var(--text-subtle)', fontSize: '0.7rem' }}>
                        {r.itemTitle} · {r.metalAlloy?.code} · {r.diamondTier?.code}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="config-label" style={{ marginBottom: '0.6rem' }}>
                    Immutable Atelier Audit Log (`atelier_audit_log` table)
                  </div>
                  {adminData.auditLog.slice(0, 8).map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: '0.6rem 0',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        fontSize: '0.74rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-ice)' }}>
                        <span>{log.eventType}</span>
                        <span style={{ color: 'var(--text-subtle)' }}>{log.actor}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', marginTop: '0.15rem' }}>{log.detail}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>Loading Atelier OS telemetry...</div>
            )}
          </div>
        </div>
      )}

      {/* ─── FULL-SCREEN 2K OPTICAL PLATE LIGHTBOX MODAL ─── */}
      {lightboxPlate && (
        <div className="lightbox-backdrop" onClick={() => setLightboxPlate(null)} role="dialog" aria-modal="true">
          <div className="lightbox-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-header">
              <div>
                <span className="visual-plate-tag">{lightboxPlate.tag}</span>
                <h3 className="lightbox-title">{lightboxPlate.title}</h3>
              </div>
              <button type="button" className="nav-pill-btn" onClick={() => setLightboxPlate(null)}>
                <X size={16} />
                <span>Close 2K Loupe</span>
              </button>
            </div>

            <div className="lightbox-stage">
              <img
                src={getMediaUrl(lightboxPlate.file)}
                alt={lightboxPlate.title}
                className="lightbox-main-img"
              />
            </div>

            <p className="lightbox-caption">{lightboxPlate.caption}</p>

            {/* 12-Plate Filmstrip Switcher */}
            <div className="lightbox-filmstrip">
              {ATELIER_GALLERY_PLATES.map((plate) => (
                <button
                  key={plate.id}
                  type="button"
                  className={`lightbox-thumb-btn ${lightboxPlate.file === plate.file ? 'active' : ''}`}
                  onClick={() => setLightboxPlate(plate)}
                  title={plate.title}
                >
                  <img src={getMediaUrl(plate.file)} alt={plate.title} loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
