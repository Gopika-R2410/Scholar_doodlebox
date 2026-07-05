import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  CheckCircle2, Flame, Play, Pause, RotateCcw,
  Plus, Moon, Sun, Focus, Sparkles,
  Github, Code2, StickyNote, X, CloudRain, TreePine, Volume2, VolumeX,
  ChevronRight, Quote as QuoteIcon, Calendar, Mail, Lock, User as UserIcon,
  LogIn, UserPlus, Loader2, CheckCircle, Link2, LogOut,
  Award, Trophy, Linkedin, Briefcase, Users, Music2, PlayCircle
} from "lucide-react";
import * as Tone from "tone";

/* ------------------------------------------------------------------ */
/*  Sample seed data                                                   */
/* ------------------------------------------------------------------ */

const QUOTES = [
  "Small daily improvements lead to staggering long-term results.",
  "Discipline is choosing between what you want now and what you want most.",
  "The expert in anything was once a beginner.",
  "Focus on progress, not perfection.",
  "You don't have to be great to start, but you have to start to be great.",
  "Consistency beats intensity, every single time.",
  "Your future is created by what you do today, not tomorrow.",
];

const seedGoals = [
  { id: "g1", text: "Review lecture notes before class", done: true },
  { id: "g2", text: "Finish 2 LeetCode mediums", done: false },
  { id: "g3", text: "Draft essay outline", done: false },
  { id: "g4", text: "30 min German vocab", done: true },
];

const seedNotes = [
  { id: "n1", text: "Office hours moved to Thursday 3–4pm", color: "burgundy" },
  { id: "n2", text: "Ask about extension on the CS lab", color: "terracotta" },
  { id: "n3", text: "Group project: split slides by Sunday", color: "rose" },
];

const NOTE_COLORS = { burgundy: "#7C2D42", terracotta: "#C97B3D", rose: "#B85C75", sage: "#6E7F57" };

function levelColor(count) {
  if (count === 0) return "var(--heat-0)";
  if (count <= 1) return "var(--heat-1)";
  if (count <= 3) return "var(--heat-2)";
  if (count <= 5) return "var(--heat-3)";
  return "var(--heat-4)";
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* deterministic pseudo-random generator seeded from a string, so a given
   username always produces the same "simulated" stats */
function seededRandom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function genGithubDays(realEventDates) {
  const days = [];
  const today = new Date();
  const realSet = new Map();
  (realEventDates || []).forEach((d) => realSet.set(d, (realSet.get(d) || 0) + 1));
  for (let i = 371; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    let count = realSet.get(key) || 0;
    if (!count) {
      const r = Math.random();
      if (r > 0.6) count = Math.floor(Math.random() * 3) + 1;
      if (r > 0.88) count = Math.floor(Math.random() * 4) + 4;
    }
    days.push({ date: key, count });
  }
  return days;
}

/* ------------------------------------------------------------------ */
/*  Small helpers                                                     */
/* ------------------------------------------------------------------ */

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/* ------------------------------------------------------------------ */
/*  Confetti                                                          */
/* ------------------------------------------------------------------ */

function Confetti({ show }) {
  const colors = ["#7C2D42", "#C97B3D", "#B85C75", "#6E7F57", "#E8D9BE"];
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.6 + Math.random() * 1.2,
        color: colors[i % colors.length],
        rotate: Math.random() * 360,
        size: 6 + Math.random() * 6,
      })),
    [show]
  );
  if (!show) return null;
  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            width: p.size,
            height: p.size * 0.6,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Auth Gate                                                          */
/* ------------------------------------------------------------------ */

function AuthGate({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || (mode === "signup" && !name.trim())) {
      setError("Please fill in every field.");
      return;
    }
    if (password.length < 4) {
      setError("Password should be at least 4 characters.");
      return;
    }
    setError("");
    const displayName = mode === "signup" ? name.trim() : email.split("@")[0];
    onAuth({ name: displayName, email: email.trim() });
  };

  return (
    <div className="auth-shell">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-card reveal">
        <div className="auth-brand">
          <span className="db-brand-mark">◆</span>
          <span>Scholar</span>
        </div>
        <h1 className="auth-title">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="auth-sub">
          {mode === "login"
            ? "Log in to pick up your Pomodoro streak, goals and notes."
            : "Set up your workspace for focus sessions, goals and progress tracking."}
        </p>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === "login" ? "auth-tab-active" : ""}`} onClick={() => { setMode("login"); setError(""); }}>
            <LogIn size={15} /> Log in
          </button>
          <button className={`auth-tab ${mode === "signup" ? "auth-tab-active" : ""}`} onClick={() => { setMode("signup"); setError(""); }}>
            <UserPlus size={15} /> Sign up
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === "signup" && (
            <label className="auth-field">
              <UserIcon size={15} />
              <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
          )}
          <label className="auth-field">
            <Mail size={15} />
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="auth-field">
            <Lock size={15} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button className="primary-btn wide" type="submit">
            {mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <button className="ghost-btn auth-guest" onClick={() => onAuth({ name: "Guest", email: "" })}>
          Continue as guest instead
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Root App                                                           */
/* ------------------------------------------------------------------ */

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("light");
  const [focusMode, setFocusMode] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [quoteFade, setQuoteFade] = useState(true);
  const now = useNow();

  const [goals, setGoals] = useState(seedGoals);
  const [notes, setNotes] = useState(seedNotes);

  // LeetCode connect state
  const [leetUsername, setLeetUsername] = useState("");
  const [leetLoading, setLeetLoading] = useState(false);
  const [leetSource, setLeetSource] = useState(null); // 'live' | 'simulated' | null
  const [leetcode, setLeetcode] = useState({ easy: 0, medium: 0, hard: 0 });

  // GitHub connect state
  const [ghUsername, setGhUsername] = useState("");
  const [ghLoading, setGhLoading] = useState(false);
  const [ghProfile, setGhProfile] = useState(null);
  const [ghSource, setGhSource] = useState(null);
  const [github, setGithub] = useState([]);

  // HackerRank connect state (no public API — simulated profile only)
  const [hrUsername, setHrUsername] = useState("");
  const [hrLoading, setHrLoading] = useState(false);
  const [hrSource, setHrSource] = useState(null);
  const [hackerrank, setHackerrank] = useState({ badges: 0, stars: 0, certifications: 0 });

  // GeeksforGeeks connect state
  const [gfgUsername, setGfgUsername] = useState("");
  const [gfgLoading, setGfgLoading] = useState(false);
  const [gfgSource, setGfgSource] = useState(null);
  const [gfg, setGfg] = useState({ score: 0, solved: 0, rank: 0 });

  // LinkedIn — manual profile card (no live connect, see note in component)
  const [linkedin, setLinkedin] = useState({ name: "", headline: "", connections: "" });

  // Spotify — public embed, no login required
  const [spotifyLink, setSpotifyLink] = useState("");
  const [spotifyEmbed, setSpotifyEmbed] = useState({ type: "playlist", id: "37i9dQZF1DX4WYpdgoIcn6" });

  // Pomodoro
  const [pomoMode, setPomoMode] = useState("focus");
  const DURS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
  const [timeLeft, setTimeLeft] = useState(DURS.focus);
  const [running, setRunning] = useState(false);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const synthRef = useRef(null);

  const [ambience, setAmbience] = useState(null);
  const noiseRef = useRef(null);
  const filterRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const handler = (e) => {
      const tag = (e.target && e.target.tagName) || "";
      if (["INPUT", "TEXTAREA"].includes(tag)) return;
      if (e.key.toLowerCase() === "f" && user) setFocusMode((f) => !f);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [user]);

  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) {
      handleSessionComplete();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, timeLeft]);

  const handleSessionComplete = useCallback(async () => {
    setRunning(false);
    try {
      await Tone.start();
      if (!synthRef.current) synthRef.current = new Tone.Synth().toDestination();
      const s = synthRef.current;
      s.triggerAttackRelease("C6", "8n");
      setTimeout(() => s.triggerAttackRelease("E6", "8n"), 180);
      setTimeout(() => s.triggerAttackRelease("G6", "8n"), 360);
    } catch (e) {}
    if (pomoMode === "focus") setSessionsToday((n) => n + 1);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2200);
  }, [pomoMode]);

  const switchPomoMode = (mode) => {
    setPomoMode(mode);
    setTimeLeft(DURS[mode]);
    setRunning(false);
  };

  const toggleAmbience = async (kind) => {
    try { await Tone.start(); } catch (e) {}
    if (ambience === kind) {
      noiseRef.current?.stop();
      noiseRef.current?.dispose();
      filterRef.current?.dispose();
      noiseRef.current = null;
      setAmbience(null);
      return;
    }
    noiseRef.current?.stop();
    noiseRef.current?.dispose();
    filterRef.current?.dispose();
    const filter = new Tone.Filter(kind === "rain" ? 900 : 400, "lowpass").toDestination();
    const noise = new Tone.Noise(kind === "rain" ? "pink" : "brown").connect(filter);
    noise.volume.value = -18;
    noise.start();
    noiseRef.current = noise;
    filterRef.current = filter;
    setAmbience(kind);
  };

  useEffect(() => {
    return () => {
      noiseRef.current?.stop();
      noiseRef.current?.dispose();
      filterRef.current?.dispose();
    };
  }, []);

  const refreshQuote = () => {
    setQuoteFade(false);
    setTimeout(() => {
      setQuoteIdx((i) => (i + 1) % QUOTES.length);
      setQuoteFade(true);
    }, 220);
  };

  /* ----------------------- LeetCode connect ----------------------- */

  const connectLeetCode = async (e) => {
    e.preventDefault();
    if (!leetUsername.trim()) return;
    setLeetLoading(true);
    setLeetSource(null);
    try {
      const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${encodeURIComponent(leetUsername.trim())}`);
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      if (data.status !== "success") throw new Error("not found");
      setLeetcode({ easy: data.easySolved || 0, medium: data.mediumSolved || 0, hard: data.hardSolved || 0 });
      setLeetSource("live");
    } catch (err) {
      const rand = seededRandom(leetUsername.trim().toLowerCase());
      setLeetcode({
        easy: Math.floor(rand() * 120) + 20,
        medium: Math.floor(rand() * 80) + 10,
        hard: Math.floor(rand() * 25) + 1,
      });
      setLeetSource("simulated");
    } finally {
      setLeetLoading(false);
    }
  };

  const bumpLeet = (key, delta) => setLeetcode((l) => ({ ...l, [key]: Math.max(0, l[key] + delta) }));

  /* ----------------------- GitHub connect ----------------------- */

  const connectGithub = async (e) => {
    e.preventDefault();
    const uname = ghUsername.trim();
    if (!uname) return;
    setGhLoading(true);
    setGhSource(null);
    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(uname)}`);
      if (!res.ok) throw new Error("not found");
      const data = await res.json();
      let eventDates = [];
      try {
        const evRes = await fetch(`https://api.github.com/users/${encodeURIComponent(uname)}/events/public`);
        if (evRes.ok) {
          const events = await evRes.json();
          eventDates = events.map((ev) => ev.created_at?.slice(0, 10)).filter(Boolean);
        }
      } catch (er) {}
      setGhProfile({
        login: data.login,
        name: data.name || data.login,
        avatar: data.avatar_url,
        publicRepos: data.public_repos,
        followers: data.followers,
      });
      setGithub(genGithubDays(eventDates));
      setGhSource(eventDates.length ? "live" : "partial");
    } catch (err) {
      const rand = seededRandom(uname.toLowerCase());
      setGhProfile({
        login: uname,
        name: uname,
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(uname)}`,
        publicRepos: Math.floor(rand() * 40) + 3,
        followers: Math.floor(rand() * 200),
      });
      setGithub(genGithubDays([]));
      setGhSource("simulated");
    } finally {
      setGhLoading(false);
    }
  };

  /* ----------------------- HackerRank connect ----------------------- */
  /* HackerRank has no public API for reading another user's stats, so this
     always shows a clearly-labelled simulated profile (deterministic per
     username) rather than pretending to fetch real data. */

  const connectHackerRank = (e) => {
    e.preventDefault();
    const uname = hrUsername.trim();
    if (!uname) return;
    setHrLoading(true);
    setTimeout(() => {
      const rand = seededRandom(uname.toLowerCase());
      setHackerrank({
        badges: Math.floor(rand() * 18) + 2,
        stars: Math.floor(rand() * 5) + 1,
        certifications: Math.floor(rand() * 4),
      });
      setHrSource("simulated");
      setHrLoading(false);
    }, 500);
  };

  const bumpHr = (key, delta) => setHackerrank((h) => ({ ...h, [key]: Math.max(0, h[key] + delta) }));

  /* ----------------------- GeeksforGeeks connect ----------------------- */
  /* Tries a community stats mirror first (unofficial, not guaranteed to be
     online); falls back to a simulated profile, same pattern as LeetCode. */

  const connectGfg = async (e) => {
    e.preventDefault();
    const uname = gfgUsername.trim();
    if (!uname) return;
    setGfgLoading(true);
    setGfgSource(null);
    try {
      const res = await fetch(`https://geeks-for-geeks-api.vercel.app/${encodeURIComponent(uname)}`);
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      const solved = data.solvedStats
        ? Object.values(data.solvedStats).reduce((a, b) => a + (b?.count || 0), 0)
        : null;
      if (!solved) throw new Error("no data");
      setGfg({ score: data.codingScore || 0, solved, rank: data.instituteRank || 0 });
      setGfgSource("live");
    } catch (err) {
      const rand = seededRandom(uname.toLowerCase());
      setGfg({
        score: Math.floor(rand() * 400) + 50,
        solved: Math.floor(rand() * 250) + 20,
        rank: Math.floor(rand() * 5000) + 100,
      });
      setGfgSource("simulated");
    } finally {
      setGfgLoading(false);
    }
  };

  const bumpGfg = (key, delta) => setGfg((g) => ({ ...g, [key]: Math.max(0, g[key] + delta) }));

  /* ----------------------- LinkedIn (manual profile) ----------------------- */
  /* LinkedIn's API requires OAuth + app review and does not expose profile
     stats like connection counts to third-party apps, and scraping profiles
     violates their terms of service — so this is a manually-editable card
     rather than a "connect" flow. */

  const updateLinkedin = (patch) => setLinkedin((l) => ({ ...l, ...patch }));

  /* ----------------------- Spotify (public embed) ----------------------- */

  const loadSpotifyLink = (e) => {
    e.preventDefault();
    const url = spotifyLink.trim();
    if (!url) return;
    const match = url.match(/spotify\.com\/(track|album|playlist|artist|episode|show)\/([a-zA-Z0-9]+)/) ||
      url.match(/spotify:(track|album|playlist|artist|episode|show):([a-zA-Z0-9]+)/);
    if (match) {
      setSpotifyEmbed({ type: match[1], id: match[2] });
    }
  };

  const githubStreaks = useMemo(() => {
    let cur = 0, longest = 0, run = 0, total = 0;
    github.forEach((d) => {
      total += d.count;
      if (d.count > 0) { run += 1; longest = Math.max(longest, run); } else run = 0;
    });
    for (let i = github.length - 1; i >= 0; i--) {
      if (github[i].count > 0) cur += 1; else break;
    }
    return { cur, longest, total };
  }, [github]);

  /* ----------------------- goals / notes ----------------------- */

  const addGoal = (text) => setGoals((g) => [...g, { id: uid(), text, done: false }]);
  const toggleGoal = (id) => setGoals((g) => g.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  const deleteGoal = (id) => setGoals((g) => g.filter((x) => x.id !== id));

  const addNote = () => setNotes((n) => [{ id: uid(), text: "", color: Object.keys(NOTE_COLORS)[n.length % 4] }, ...n]);
  const updateNote = (id, text) => setNotes((n) => n.map((x) => (x.id === id ? { ...x, text } : x)));
  const deleteNote = (id) => setNotes((n) => n.filter((x) => x.id !== id));

  /* ----------------------- derived stats ----------------------- */

  const leetTotal = leetcode.easy + leetcode.medium + leetcode.hard;
  const leetTarget = 120;
  const goalsDone = goals.filter((g) => g.done).length;

  const productivityScore = useMemo(() => {
    const pomoScore = Math.min(1, sessionsToday / 6) * 35;
    const goalScore = goals.length ? (goalsDone / goals.length) * 30 : 0;
    const leetScore = Math.min(1, leetTotal / leetTarget) * 20;
    const ghScore = Math.min(1, githubStreaks.cur / 14) * 15;
    return Math.round(pomoScore + goalScore + leetScore + ghScore);
  }, [sessionsToday, goals, goalsDone, leetTotal, githubStreaks]);

  const productivityLabel =
    productivityScore < 30 ? "Beginner" : productivityScore < 55 ? "Focused" : productivityScore < 80 ? "Productive" : "Productivity Ninja";

  const greeting = (() => {
    const h = now.getHours();
    if (h < 5) return "Burning the midnight oil";
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    if (h < 21) return "Good Evening";
    return "Good Night";
  })();

  const dateStr = now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  if (!user) {
    return (
      <div className="db-root">
        <style>{CSS}</style>
        <AuthGate onAuth={setUser} />
      </div>
    );
  }

  return (
    <div className="db-root">
      <style>{CSS}</style>
      <Confetti show={showConfetti} />

      {!focusMode && (
        <TopBar theme={theme} setTheme={setTheme} setFocusMode={setFocusMode} user={user} onLogout={() => setUser(null)} />
      )}

      {!focusMode && (
        <FloatingSpotifyDoodle
          spotifyLink={spotifyLink}
          setSpotifyLink={setSpotifyLink}
          spotifyEmbed={spotifyEmbed}
          onLoad={loadSpotifyLink}
        />
      )}

      {focusMode ? (
        <FocusOverlay
          timeLeft={timeLeft}
          running={running}
          setRunning={setRunning}
          pomoMode={pomoMode}
          switchPomoMode={switchPomoMode}
          DURS={DURS}
          ambience={ambience}
          toggleAmbience={toggleAmbience}
          exit={() => setFocusMode(false)}
        />
      ) : (
        <main className="db-shell">
          <Hero
            name={user.name}
            greeting={greeting}
            dateStr={dateStr}
            timeStr={timeStr}
            quote={QUOTES[quoteIdx]}
            quoteFade={quoteFade}
            refreshQuote={refreshQuote}
            score={productivityScore}
            label={productivityLabel}
          />

          <OverviewCards
            sessionsToday={sessionsToday}
            goalsDone={goalsDone}
            goalsTotal={goals.length}
            ghStreak={githubStreaks.cur}
            leetTotal={leetTotal}
          />

          <PomodoroCard
            timeLeft={timeLeft}
            running={running}
            setRunning={setRunning}
            pomoMode={pomoMode}
            switchPomoMode={switchPomoMode}
            DURS={DURS}
            sessionsToday={sessionsToday}
            onReset={() => setTimeLeft(DURS[pomoMode])}
          />

          <div className="db-grid-2">
            <LeetCodeCard
              leetcode={leetcode}
              bumpLeet={bumpLeet}
              username={leetUsername}
              setUsername={setLeetUsername}
              onConnect={connectLeetCode}
              loading={leetLoading}
              source={leetSource}
            />
            <GithubCard
              profile={ghProfile}
              github={github}
              streaks={githubStreaks}
              username={ghUsername}
              setUsername={setGhUsername}
              onConnect={connectGithub}
              loading={ghLoading}
              source={ghSource}
            />
          </div>

          <div className="db-grid-2">
            <HackerRankCard
              hackerrank={hackerrank}
              bumpHr={bumpHr}
              username={hrUsername}
              setUsername={setHrUsername}
              onConnect={connectHackerRank}
              loading={hrLoading}
              source={hrSource}
            />
            <GfgCard
              gfg={gfg}
              bumpGfg={bumpGfg}
              username={gfgUsername}
              setUsername={setGfgUsername}
              onConnect={connectGfg}
              loading={gfgLoading}
              source={gfgSource}
            />
          </div>

          <div className="db-grid-2">
            <LinkedInCard linkedin={linkedin} updateLinkedin={updateLinkedin} />
            <GoalsCard goals={goals} addGoal={addGoal} toggleGoal={toggleGoal} deleteGoal={deleteGoal} />
          </div>

          <NotesCard notes={notes} addNote={addNote} updateNote={updateNote} deleteNote={deleteNote} />

          <footer className="db-footer">
            Press <kbd>F</kbd> to enter Focus Mode · Data lives only in this session
          </footer>
        </main>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TopBar                                                             */
/* ------------------------------------------------------------------ */

function TopBar({ theme, setTheme, setFocusMode, user, onLogout }) {
  return (
    <header className="db-topbar">
      <div className="db-brand">
        <span className="db-brand-mark">◆</span>
        <span>Scholar</span>
      </div>
      <div className="db-topbar-actions">
        <span className="topbar-username">{user.name}</span>
        <button className="icon-btn" title="Enter focus mode (F)" onClick={() => setFocusMode(true)}>
          <Focus size={18} />
        </button>
        <button className="icon-btn theme-toggle" title="Toggle theme" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
          <span className={`theme-icon ${theme}`}>{theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}</span>
        </button>
        <button className="icon-btn" title="Log out" onClick={onLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero({ name, greeting, dateStr, timeStr, quote, quoteFade, refreshQuote, score, label }) {
  return (
    <section className="db-hero reveal">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="hero-content">
        <div className="hero-left">
          <h1 className="hero-greeting">{greeting}, {name} <span className="wave">👋</span></h1>
          <div className="hero-meta">
            <span className="hero-date"><Calendar size={14} /> {dateStr}</span>
            <span className="hero-clock">{timeStr}</span>
          </div>
          <div className={`quote-card ${quoteFade ? "fade-in" : "fade-out"}`}>
            <QuoteIcon size={16} className="quote-mark" />
            <p>{quote}</p>
            <button className="ghost-btn" onClick={refreshQuote}>Refresh</button>
          </div>
        </div>
        <div className="hero-right">
          <ScoreRing score={score} label={label} />
        </div>
      </div>
    </section>
  );
}

function ScoreRing({ score, label }) {
  const r = 62;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="score-ring-wrap">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} className="ring-track" />
        <circle cx="80" cy="80" r={r} className="ring-progress" style={{ strokeDasharray: c, strokeDashoffset: offset }} />
      </svg>
      <div className="score-ring-center">
        <span className="score-num">{score}</span>
        <span className="score-label">{label}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Overview Cards                                                     */
/* ------------------------------------------------------------------ */

function OverviewCards({ sessionsToday, goalsDone, goalsTotal, ghStreak, leetTotal }) {
  const cards = [
    { icon: <Sparkles size={20} />, label: "Pomodoros Today", value: sessionsToday, accent: "burgundy" },
    { icon: <CheckCircle2 size={20} />, label: "Goals Completed", value: `${goalsDone}/${goalsTotal}`, accent: "sage" },
    { icon: <Flame size={20} />, label: "GitHub Streak", value: `${ghStreak} days`, accent: "terracotta" },
    { icon: <Code2 size={20} />, label: "LeetCode Solved", value: leetTotal, accent: "rose" },
  ];
  return (
    <section className="overview-grid">
      {cards.map((c, i) => (
        <div className="stat-card reveal" key={c.label} style={{ animationDelay: `${i * 70}ms` }}>
          <div className={`stat-icon accent-${c.accent}`}>{c.icon}</div>
          <div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        </div>
      ))}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Pomodoro                                                           */
/* ------------------------------------------------------------------ */

function PomodoroCard({ timeLeft, running, setRunning, pomoMode, switchPomoMode, DURS, sessionsToday, onReset }) {
  const total = DURS[pomoMode];
  const pct = 1 - timeLeft / total;
  const r = 80;
  const c = 2 * Math.PI * r;
  return (
    <section className="card reveal">
      <div className="card-head">
        <h2>Pomodoro Timer</h2>
        <span className="pill">{sessionsToday} sessions today</span>
      </div>
      <div className="pomo-modes">
        {[["focus", "Focus 25"], ["short", "Short 5"], ["long", "Long 15"]].map(([m, l]) => (
          <button key={m} className={`chip ${pomoMode === m ? "chip-active" : ""}`} onClick={() => switchPomoMode(m)}>{l}</button>
        ))}
      </div>
      <div className="pomo-timer">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={r} className="ring-track" />
          <circle cx="100" cy="100" r={r} className="ring-progress pomo-ring" style={{ strokeDasharray: c, strokeDashoffset: c - pct * c }} />
        </svg>
        <div className="pomo-time">{fmtTime(timeLeft)}</div>
      </div>
      <div className="pomo-controls">
        <button className="icon-btn-lg" onClick={onReset} title="Reset"><RotateCcw size={18} /></button>
        <button className="primary-btn" onClick={() => setRunning((r2) => !r2)}>
          {running ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Start</>}
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  LeetCode                                                            */
/* ------------------------------------------------------------------ */

function LeetCodeCard({ leetcode, bumpLeet, username, setUsername, onConnect, loading, source }) {
  const total = leetcode.easy + leetcode.medium + leetcode.hard;
  const target = 120;
  const pct = Math.min(100, Math.round((total / target) * 100));

  return (
    <section className="card reveal">
      <div className="card-head">
        <h2><Code2 size={18} style={{ marginRight: 6, verticalAlign: "-3px" }} />LeetCode Progress</h2>
        <span className="pill">{total} solved</span>
      </div>

      <form className="connect-form" onSubmit={onConnect}>
        <label className="connect-field">
          <Link2 size={14} />
          <input placeholder="LeetCode username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <button className="primary-btn small" type="submit" disabled={loading}>
          {loading ? <Loader2 size={15} className="spin" /> : "Connect"}
        </button>
      </form>
      {source === "live" && <div className="connect-status live"><CheckCircle size={13} /> Synced live from LeetCode</div>}
      {source === "simulated" && <div className="connect-status sim">Live sync unavailable — showing simulated stats for this username</div>}

      <div className="leet-body">
        <div className="leet-ring">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r="55" className="ring-track" />
            <circle cx="65" cy="65" r="55" className="ring-progress" style={{ stroke: "#C97B3D", strokeDasharray: 2 * Math.PI * 55, strokeDashoffset: 2 * Math.PI * 55 * (1 - pct / 100) }} />
          </svg>
          <div className="leet-ring-center">
            <span className="score-num">{pct}%</span>
            <span className="score-label">of goal</span>
          </div>
        </div>
        <div className="leet-breakdown">
          {[["easy", "Easy", "#6E7F57"], ["medium", "Medium", "#C97B3D"], ["hard", "Hard", "#7C2D42"]].map(([k, label, color]) => (
            <div className="leet-row" key={k}>
              <span className="leet-dot" style={{ background: color }} />
              <span className="leet-label">{label}</span>
              <span className="leet-count">{leetcode[k]}</span>
              <div className="leet-btns">
                <button className="icon-btn tiny" onClick={() => bumpLeet(k, -1)}>-</button>
                <button className="icon-btn tiny" onClick={() => bumpLeet(k, 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  GitHub                                                              */
/* ------------------------------------------------------------------ */

function GithubCard({ profile, github, streaks, username, setUsername, onConnect, loading, source }) {
  const weeks = [];
  for (let i = 0; i < github.length; i += 7) weeks.push(github.slice(i, i + 7));

  return (
    <section className="card reveal">
      <div className="card-head">
        <h2><Github size={18} style={{ marginRight: 6, verticalAlign: "-3px" }} />GitHub Progress</h2>
      </div>

      <form className="connect-form" onSubmit={onConnect}>
        <label className="connect-field">
          <Link2 size={14} />
          <input placeholder="GitHub username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <button className="primary-btn small" type="submit" disabled={loading}>
          {loading ? <Loader2 size={15} className="spin" /> : "Connect"}
        </button>
      </form>
      {source === "live" && <div className="connect-status live"><CheckCircle size={13} /> Connected — live profile & recent activity</div>}
      {source === "partial" && <div className="connect-status live"><CheckCircle size={13} /> Connected — live profile, heatmap partly simulated</div>}
      {source === "simulated" && <div className="connect-status sim">Couldn't reach GitHub — showing simulated data for this username</div>}

      {profile && (
        <div className="gh-profile">
          <img src={profile.avatar} alt="" className="gh-avatar" />
          <div>
            <div className="gh-name">{profile.name}</div>
            <div className="gh-sub">@{profile.login} · {profile.publicRepos} repos · {profile.followers} followers</div>
          </div>
        </div>
      )}

      {github.length > 0 && (
        <>
          <div className="gh-stats">
            <div><span>{streaks.cur}</span><small>Current streak</small></div>
            <div><span>{streaks.longest}</span><small>Longest streak</small></div>
            <div><span>{streaks.total}</span><small>Total commits</small></div>
          </div>
          <div className="gh-scroll">
            <div className="gh-grid">
              {weeks.map((week, wi) => (
                <div className="gh-col" key={wi}>
                  {week.map((d, di) => (
                    <div key={di} className="gh-cell" style={{ background: levelColor(d.count) }} title={`${d.date}: ${d.count} contributions`} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {github.length === 0 && <div className="empty-row">Connect a GitHub username to see contribution activity.</div>}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  HackerRank                                                          */
/* ------------------------------------------------------------------ */

function HackerRankCard({ hackerrank, bumpHr, username, setUsername, onConnect, loading, source }) {
  return (
    <section className="card reveal">
      <div className="card-head">
        <h2><Trophy size={18} style={{ marginRight: 6, verticalAlign: "-3px" }} />HackerRank</h2>
      </div>

      <form className="connect-form" onSubmit={onConnect}>
        <label className="connect-field">
          <Link2 size={14} />
          <input placeholder="HackerRank username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <button className="primary-btn small" type="submit" disabled={loading}>
          {loading ? <Loader2 size={15} className="spin" /> : "Connect"}
        </button>
      </form>
      {source === "simulated" && (
        <div className="connect-status sim">HackerRank has no public profile API — showing a simulated card for this username</div>
      )}

      <div className="leet-breakdown">
        {[["stars", "Stars", "#C97B3D"], ["badges", "Badges earned", "#7C2D42"], ["certifications", "Certifications", "#6E7F57"]].map(([k, label, color]) => (
          <div className="leet-row" key={k}>
            <span className="leet-dot" style={{ background: color }} />
            <span className="leet-label">{label}</span>
            <span className="leet-count">{hackerrank[k]}</span>
            <div className="leet-btns">
              <button className="icon-btn tiny" onClick={() => bumpHr(k, -1)}>-</button>
              <button className="icon-btn tiny" onClick={() => bumpHr(k, 1)}>+</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  GeeksforGeeks                                                       */
/* ------------------------------------------------------------------ */

function GfgCard({ gfg, bumpGfg, username, setUsername, onConnect, loading, source }) {
  return (
    <section className="card reveal">
      <div className="card-head">
        <h2><Award size={18} style={{ marginRight: 6, verticalAlign: "-3px" }} />GeeksforGeeks</h2>
      </div>

      <form className="connect-form" onSubmit={onConnect}>
        <label className="connect-field">
          <Link2 size={14} />
          <input placeholder="GeeksforGeeks username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <button className="primary-btn small" type="submit" disabled={loading}>
          {loading ? <Loader2 size={15} className="spin" /> : "Connect"}
        </button>
      </form>
      {source === "live" && <div className="connect-status live"><CheckCircle size={13} /> Synced live from GeeksforGeeks</div>}
      {source === "simulated" && (
        <div className="connect-status sim">Live sync unavailable — showing simulated stats for this username</div>
      )}

      <div className="leet-breakdown">
        {[["solved", "Problems solved", "#6E7F57"], ["score", "Coding score", "#C97B3D"], ["rank", "Institute rank", "#7C2D42"]].map(([k, label, color]) => (
          <div className="leet-row" key={k}>
            <span className="leet-dot" style={{ background: color }} />
            <span className="leet-label">{label}</span>
            <span className="leet-count">{gfg[k]}</span>
            <div className="leet-btns">
              <button className="icon-btn tiny" onClick={() => bumpGfg(k, -1)}>-</button>
              <button className="icon-btn tiny" onClick={() => bumpGfg(k, 1)}>+</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  LinkedIn — manual professional profile card                        */
/* ------------------------------------------------------------------ */

function LinkedInCard({ linkedin, updateLinkedin }) {
  return (
    <section className="card reveal">
      <div className="card-head">
        <h2><Linkedin size={18} style={{ marginRight: 6, verticalAlign: "-3px" }} />LinkedIn</h2>
      </div>
      <div className="connect-status sim" style={{ marginBottom: 14 }}>
        LinkedIn doesn't allow apps like this to read profile data (no public API, OAuth needs app review) —
        fill this in yourself instead of a fake "connect" button.
      </div>
      <div className="linkedin-fields">
        <label className="connect-field">
          <UserIcon size={14} />
          <input placeholder="Name" value={linkedin.name} onChange={(e) => updateLinkedin({ name: e.target.value })} />
        </label>
        <label className="connect-field">
          <Briefcase size={14} />
          <input placeholder="Headline (e.g. CS student @ XYZ University)" value={linkedin.headline} onChange={(e) => updateLinkedin({ headline: e.target.value })} />
        </label>
        <label className="connect-field">
          <Users size={14} />
          <input placeholder="Connections" value={linkedin.connections} onChange={(e) => updateLinkedin({ connections: e.target.value })} />
        </label>
      </div>
      {(linkedin.name || linkedin.headline) && (
        <div className="gh-profile" style={{ marginTop: 14 }}>
          <div className="li-avatar"><Linkedin size={20} /></div>
          <div>
            <div className="gh-name">{linkedin.name || "Your name"}</div>
            <div className="gh-sub">{linkedin.headline || "Your headline"}{linkedin.connections ? ` · ${linkedin.connections} connections` : ""}</div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Floating Spotify doodle — a small floating button, not a section   */
/* ------------------------------------------------------------------ */

function FloatingSpotifyDoodle({ spotifyLink, setSpotifyLink, spotifyEmbed, onLoad }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="doodle-wrap">
      {open && (
        <div className="doodle-panel reveal">
          <div className="doodle-panel-head">
            <span><Music2 size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />Relax break</span>
            <button className="icon-btn tiny" onClick={() => setOpen(false)}><X size={14} /></button>
          </div>
          <form className="connect-form" onSubmit={onLoad}>
            <label className="connect-field">
              <PlayCircle size={14} />
              <input
                placeholder="Paste a Spotify link…"
                value={spotifyLink}
                onChange={(e) => setSpotifyLink(e.target.value)}
              />
            </label>
            <button className="primary-btn small" type="submit">Load</button>
          </form>
          <div className="spotify-embed-wrap">
            <iframe
              key={`${spotifyEmbed.type}-${spotifyEmbed.id}`}
              src={`https://open.spotify.com/embed/${spotifyEmbed.type}/${spotifyEmbed.id}?utm_source=generator&theme=0`}
              width="100%"
              height="152"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify player"
              className="spotify-embed"
            />
          </div>
        </div>
      )}
      <button className="doodle-fab" onClick={() => setOpen((o) => !o)} title="Need a break? Play some music">
        <svg viewBox="0 0 60 60" width="34" height="34" className="doodle-svg">
          <path
            d="M20 40 C18 44, 12 44, 11 39 C10 34, 16 32, 20 34 L20 14 L38 10 L38 32"
            fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
          />
          <path
            d="M38 32 C36 36, 30 36, 29 31 C28 26, 34 24, 38 26"
            fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
          />
          <path d="M20 14 L38 10" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </svg>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Goals                                                               */
/* ------------------------------------------------------------------ */

function GoalsCard({ goals, addGoal, toggleGoal, deleteGoal }) {
  const [text, setText] = useState("");
  const done = goals.filter((g) => g.done).length;
  const pct = goals.length ? Math.round((done / goals.length) * 100) : 0;

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    addGoal(text.trim());
    setText("");
  };

  return (
    <section className="card reveal">
      <div className="card-head"><h2>Daily Goals</h2><span className="pill">{done}/{goals.length}</span></div>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
      <form className="inline-form" onSubmit={submit}>
        <input placeholder="Add a goal…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="primary-btn small" type="submit"><Plus size={16} /></button>
      </form>
      <ul className="goal-list">
        {goals.map((g) => (
          <li key={g.id} className={g.done ? "goal-done" : ""}>
            <button className="goal-check" onClick={() => toggleGoal(g.id)}><CheckCircle2 size={18} /></button>
            <span>{g.text}</span>
            <button className="icon-btn tiny" onClick={() => deleteGoal(g.id)}><X size={14} /></button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Notes                                                               */
/* ------------------------------------------------------------------ */

function NotesCard({ notes, addNote, updateNote, deleteNote }) {
  return (
    <section className="card reveal">
      <div className="card-head">
        <h2><StickyNote size={18} style={{ marginRight: 6, verticalAlign: "-3px" }} />Quick Notes</h2>
        <button className="primary-btn small" onClick={addNote}><Plus size={16} /> New</button>
      </div>
      <div className="notes-grid">
        {notes.map((n) => (
          <div className="sticky-note" key={n.id} style={{ background: `color-mix(in srgb, ${NOTE_COLORS[n.color]} 18%, var(--card-solid))`, borderColor: NOTE_COLORS[n.color] }}>
            <button className="note-delete" onClick={() => deleteNote(n.id)}><X size={13} /></button>
            <textarea value={n.text} placeholder="Write a note…" onChange={(e) => updateNote(n.id, e.target.value)} />
          </div>
        ))}
        {notes.length === 0 && <div className="empty-row">No notes yet — click New to add one.</div>}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Focus Mode Overlay                                                  */
/* ------------------------------------------------------------------ */

function FocusOverlay({ timeLeft, running, setRunning, pomoMode, switchPomoMode, DURS, ambience, toggleAmbience, exit }) {
  const total = DURS[pomoMode];
  const pct = 1 - timeLeft / total;
  const r = 130;
  const c = 2 * Math.PI * r;
  return (
    <div className="focus-overlay">
      <button className="icon-btn focus-exit" onClick={exit} title="Exit focus mode (F)"><X size={20} /></button>
      <div className="focus-modes">
        {[["focus", "Focus"], ["short", "Short break"], ["long", "Long break"]].map(([m, l]) => (
          <button key={m} className={`chip ${pomoMode === m ? "chip-active" : ""}`} onClick={() => switchPomoMode(m)}>{l}</button>
        ))}
      </div>
      <div className="focus-timer">
        <svg width="280" height="280" viewBox="0 0 280 280">
          <circle cx="140" cy="140" r={r} className="ring-track" />
          <circle cx="140" cy="140" r={r} className="ring-progress pomo-ring" style={{ strokeDasharray: c, strokeDashoffset: c - pct * c }} />
        </svg>
        <div className="focus-time">{fmtTime(timeLeft)}</div>
      </div>
      <button className="primary-btn large" onClick={() => setRunning((r2) => !r2)}>
        {running ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Start</>}
      </button>
      <div className="ambience-row">
        <button className={`chip ${ambience === "rain" ? "chip-active" : ""}`} onClick={() => toggleAmbience("rain")}><CloudRain size={14} /> Rain</button>
        <button className={`chip ${ambience === "forest" ? "chip-active" : ""}`} onClick={() => toggleAmbience("forest")}><TreePine size={14} /> Forest</button>
        {ambience ? <Volume2 size={14} className="amb-icon" /> : <VolumeX size={14} className="amb-icon" />}
      </div>
      <p className="focus-hint">Press <kbd>F</kbd> or tap <ChevronRight size={12} style={{ verticalAlign: "-1px" }} /> the X to leave focus mode</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles — burgundy & beige theme                                    */
/* ------------------------------------------------------------------ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');

:root, [data-theme='light'] {
  --bg: #F2E9DC;
  --bg-2: #E8D9C2;
  --card-solid: #FBF5EA;
  --card: rgba(251,245,234,0.72);
  --card-border: rgba(124,45,66,0.18);
  --text: #3B1F26;
  --text-dim: #8B6F63;
  --accent: #7C2D42;
  --accent2: #A8425F;
  --green: #6E7F57;
  --orange: #C97B3D;
  --pink: #B85C75;
  --grid-line: rgba(124,45,66,0.10);
  --heat-0: rgba(124,45,66,0.08);
  --heat-1: #E3C7A6;
  --heat-2: #C9946E;
  --heat-3: #A8425F;
  --heat-4: #7C2D42;
}
[data-theme='dark'] {
  --bg: #241016;
  --bg-2: #1A0C10;
  --card-solid: #34181F;
  --card: rgba(52,24,31,0.65);
  --card-border: rgba(216,168,150,0.18);
  --text: #F3E7DA;
  --text-dim: #C9A9A0;
  --accent: #D98BA0;
  --accent2: #E8A9A0;
  --green: #9CB080;
  --orange: #E3A468;
  --pink: #E8A9A0;
  --grid-line: rgba(243,231,218,0.08);
  --heat-0: rgba(243,231,218,0.06);
  --heat-1: #4A2530;
  --heat-2: #6E2F3E;
  --heat-3: #9A4258;
  --heat-4: #D98BA0;
}

.db-root * { box-sizing: border-box; }
.db-root {
  font-family: 'Inter', sans-serif;
  background: radial-gradient(circle at 20% -10%, var(--bg-2), var(--bg) 60%);
  color: var(--text);
  min-height: 100vh;
  transition: background 0.4s ease, color 0.4s ease;
}
.db-root h1, .db-root h2, .db-root h3 { font-family: 'Poppins', sans-serif; margin: 0; }

::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: linear-gradient(var(--accent), var(--accent2)); border-radius: 10px; }

/* ---------- Auth ---------- */
.auth-shell { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; padding: 24px; }
.auth-blob { position: absolute; border-radius: 50%; filter: blur(70px); opacity: .45; }
.auth-blob-1 { width: 320px; height: 320px; background: var(--accent); top: -100px; left: -80px; }
.auth-blob-2 { width: 280px; height: 280px; background: var(--orange); bottom: -100px; right: -60px; }
.auth-card { position: relative; width: 100%; max-width: 400px; background: var(--card); border: 1px solid var(--card-border); border-radius: 24px; padding: 32px; backdrop-filter: blur(18px); }
.auth-brand { display: flex; align-items: center; gap: 8px; font-family: 'Poppins'; font-weight: 600; font-size: 17px; margin-bottom: 18px; }
.auth-title { font-size: 24px; font-weight: 700; margin-bottom: 6px; }
.auth-sub { color: var(--text-dim); font-size: 13px; margin: 0 0 20px; }
.auth-tabs { display: flex; gap: 8px; background: var(--bg-2); padding: 4px; border-radius: 14px; margin-bottom: 20px; }
.auth-tab { flex: 1; border: none; background: transparent; color: var(--text-dim); padding: 9px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all .15s ease; }
.auth-tab-active { background: var(--card-solid); color: var(--accent); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.auth-form { display: flex; flex-direction: column; gap: 12px; }
.auth-field { display: flex; align-items: center; gap: 10px; background: var(--card-solid); border: 1px solid var(--card-border); border-radius: 12px; padding: 11px 14px; color: var(--text-dim); }
.auth-field input { flex: 1; background: transparent; border: none; outline: none; color: var(--text); font-size: 14px; }
.auth-error { color: var(--accent); font-size: 12px; background: color-mix(in srgb, var(--accent) 10%, transparent); padding: 8px 12px; border-radius: 10px; }
.primary-btn.wide { width: 100%; justify-content: center; margin-top: 6px; }
.auth-guest { display: block; margin: 16px auto 0; text-align: center; }

.db-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 28px; position: sticky; top: 0; z-index: 30;
  backdrop-filter: blur(14px); background: color-mix(in srgb, var(--bg) 75%, transparent);
  border-bottom: 1px solid var(--card-border);
}
.db-brand { display: flex; align-items: center; gap: 8px; font-family: 'Poppins'; font-weight: 600; font-size: 18px; }
.db-brand-mark { color: var(--accent); }
.db-topbar-actions { display: flex; gap: 8px; align-items: center; }
.topbar-username { font-size: 13px; color: var(--text-dim); margin-right: 4px; font-weight: 500; }

.icon-btn, .icon-btn-lg, .icon-btn.tiny {
  border: 1px solid var(--card-border); background: var(--card); color: var(--text);
  border-radius: 12px; padding: 9px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
  transition: transform .15s ease, background .15s ease;
}
.icon-btn:hover, .icon-btn-lg:hover { transform: translateY(-2px); background: color-mix(in srgb, var(--accent) 15%, var(--card-solid)); }
.icon-btn.tiny { padding: 5px; border-radius: 8px; }
.theme-icon { display: inline-flex; transition: transform .35s ease; }

.db-shell { max-width: 1100px; margin: 0 auto; padding: 28px 24px 60px; display: flex; flex-direction: column; gap: 22px; }

.reveal { animation: revealUp .6s ease both; }
@keyframes revealUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

.db-hero { position: relative; overflow: hidden; border-radius: 24px; padding: 36px; border: 1px solid var(--card-border); background: var(--card); backdrop-filter: blur(18px); }
.blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: .4; animation: float 10s ease-in-out infinite; }
.blob-1 { width: 260px; height: 260px; background: var(--accent); top: -80px; left: -60px; }
.blob-2 { width: 220px; height: 220px; background: var(--orange); bottom: -90px; right: -40px; animation-delay: 2s; }
@keyframes float { 0%,100% { transform: translate(0,0); } 50% { transform: translate(20px,-20px); } }

.hero-content { position: relative; display: flex; justify-content: space-between; align-items: center; gap: 24px; flex-wrap: wrap; }
.hero-left { flex: 1; min-width: 260px; }
.hero-greeting { font-size: 30px; font-weight: 700; }
.wave { display: inline-block; animation: wave 1.8s infinite; transform-origin: 70% 70%; }
@keyframes wave { 0%,100% { transform: rotate(0deg); } 20% { transform: rotate(16deg);} 40% { transform: rotate(-10deg);} 60% {transform: rotate(14deg);} }
.hero-meta { display: flex; gap: 18px; color: var(--text-dim); font-size: 14px; margin: 10px 0 18px; align-items: center; flex-wrap: wrap; }
.hero-date { display: flex; align-items: center; gap: 6px; }
.hero-clock { font-variant-numeric: tabular-nums; font-weight: 600; color: var(--accent); }

.quote-card { display: flex; align-items: center; gap: 10px; background: color-mix(in srgb, var(--accent) 8%, var(--card-solid)); border: 1px solid var(--card-border); padding: 12px 16px; border-radius: 16px; max-width: 480px; transition: opacity .2s ease; }
.quote-card.fade-in { opacity: 1; } .quote-card.fade-out { opacity: 0; }
.quote-card p { flex: 1; font-size: 14px; margin: 0; }
.quote-mark { color: var(--accent); flex-shrink: 0; }

.score-ring-wrap { position: relative; width: 160px; height: 160px; }
.ring-track { fill: none; stroke: var(--grid-line); stroke-width: 12; }
.ring-progress { fill: none; stroke: var(--accent); stroke-width: 12; stroke-linecap: round; transform: rotate(-90deg); transform-origin: center; transition: stroke-dashoffset 0.6s ease; }
.score-ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.score-num { font-size: 30px; font-weight: 700; font-family: 'Poppins'; }
.score-label { font-size: 12px; color: var(--text-dim); }

.ghost-btn { background: transparent; border: none; color: var(--accent); font-size: 13px; font-weight: 600; cursor: pointer; }

.overview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card { display: flex; align-items: center; gap: 14px; background: var(--card); border: 1px solid var(--card-border); border-radius: 20px; padding: 18px; backdrop-filter: blur(14px); transition: transform .2s ease, box-shadow .2s ease; }
.stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(124,45,66,0.15); }
.stat-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.accent-burgundy { background: color-mix(in srgb, var(--accent) 22%, transparent); color: var(--accent); }
.accent-sage { background: color-mix(in srgb, var(--green) 22%, transparent); color: var(--green); }
.accent-terracotta { background: color-mix(in srgb, var(--orange) 22%, transparent); color: var(--orange); }
.accent-rose { background: color-mix(in srgb, var(--pink) 22%, transparent); color: var(--pink); }
.stat-value { font-size: 20px; font-weight: 700; font-family: 'Poppins'; }
.stat-label { font-size: 12px; color: var(--text-dim); }

.db-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

.card { background: var(--card); border: 1px solid var(--card-border); border-radius: 22px; padding: 22px; backdrop-filter: blur(14px); }
.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
.card-head h2 { font-size: 17px; font-weight: 600; }
.pill { font-size: 12px; padding: 4px 10px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--accent); font-weight: 600; }

.pomo-modes { display: flex; gap: 8px; margin-bottom: 18px; }
.chip { border: 1px solid var(--card-border); background: transparent; color: var(--text-dim); padding: 7px 14px; border-radius: 999px; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all .15s ease; }
.chip-active { background: var(--accent); color: #fff; border-color: var(--accent); }
.pomo-timer { position: relative; width: 200px; height: 200px; margin: 0 auto 18px; }
.pomo-ring { stroke: var(--accent); transition: stroke-dashoffset 1s linear; }
.pomo-time { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 40px; font-weight: 700; font-family: 'Poppins'; font-variant-numeric: tabular-nums; }
.pomo-controls { display: flex; gap: 12px; justify-content: center; align-items: center; }

.primary-btn { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff; border: none; padding: 12px 22px; border-radius: 14px; font-weight: 600; font-size: 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: transform .15s ease, box-shadow .15s ease; }
.primary-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(124,45,66,0.30); }
.primary-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }
.primary-btn.small { padding: 8px 14px; font-size: 13px; border-radius: 10px; }
.primary-btn.large { padding: 16px 32px; font-size: 16px; }
.icon-btn-lg { padding: 12px; border-radius: 14px; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.inline-form { display: flex; gap: 8px; margin-bottom: 14px; }
.inline-form input { background: var(--card-solid); border: 1px solid var(--card-border); color: var(--text); border-radius: 10px; padding: 9px 12px; font-size: 13px; flex: 1; }

.connect-form { display: flex; gap: 8px; margin-bottom: 10px; }
.connect-field { flex: 1; display: flex; align-items: center; gap: 8px; background: var(--card-solid); border: 1px solid var(--card-border); border-radius: 10px; padding: 9px 12px; color: var(--text-dim); }
.connect-field input { flex: 1; background: transparent; border: none; outline: none; color: var(--text); font-size: 13px; }
.connect-status { font-size: 12px; margin-bottom: 14px; display: flex; align-items: center; gap: 6px; }
.connect-status.live { color: var(--green); }
.connect-status.sim { color: var(--orange); }

.empty-row { color: var(--text-dim); font-size: 13px; text-align: center; padding: 14px; }

.leet-body { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
.leet-ring { position: relative; width: 130px; height: 130px; flex-shrink: 0; }
.leet-ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.leet-breakdown { flex: 1; display: flex; flex-direction: column; gap: 10px; min-width: 180px; }
.leet-row { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.leet-dot { width: 10px; height: 10px; border-radius: 50%; }
.leet-label { flex: 1; color: var(--text-dim); }
.leet-count { font-weight: 700; font-family: 'Poppins'; }
.leet-btns { display: flex; gap: 4px; }
.leet-btns button { width: 22px; height: 22px; padding: 0; }

.gh-profile { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; padding: 10px; background: color-mix(in srgb, var(--accent) 5%, transparent); border-radius: 14px; }
.gh-avatar { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; }
.gh-name { font-weight: 600; font-size: 14px; }
.gh-sub { font-size: 12px; color: var(--text-dim); }

.linkedin-fields { display: flex; flex-direction: column; gap: 10px; }
.li-avatar { width: 42px; height: 42px; border-radius: 50%; background: color-mix(in srgb, var(--accent) 20%, transparent); color: var(--accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

.spotify-embed-wrap { border-radius: 14px; overflow: hidden; }
.spotify-embed { border-radius: 14px; display: block; }
.spotify-hint { font-size: 12px; color: var(--text-dim); margin: 10px 0 0; }

.doodle-wrap { position: fixed; right: 24px; bottom: 24px; z-index: 60; display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
.doodle-fab {
  width: 60px; height: 60px; border-radius: 50%; border: 1px solid var(--card-border);
  background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  box-shadow: 0 10px 26px rgba(124,45,66,0.35);
  animation: doodleWiggle 4.5s ease-in-out infinite;
}
.doodle-fab:hover { animation-play-state: paused; transform: scale(1.08) rotate(-4deg); }
.doodle-svg { transform-origin: center; }
@keyframes doodleWiggle {
  0%, 88%, 100% { transform: rotate(0deg) translateY(0); }
  90% { transform: rotate(-8deg) translateY(-2px); }
  93% { transform: rotate(7deg) translateY(0); }
  96% { transform: rotate(-4deg) translateY(-1px); }
}
.doodle-panel {
  width: 280px; background: var(--card-solid); border: 1px solid var(--card-border); border-radius: 18px;
  padding: 14px; box-shadow: 0 16px 40px rgba(0,0,0,0.18); backdrop-filter: blur(14px);
}
.doodle-panel-head { display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 10px; }

@media (max-width: 480px) {
  .doodle-panel { width: calc(100vw - 48px); }
}

.gh-stats { display: flex; gap: 24px; margin-bottom: 14px; }
.gh-stats span { display: block; font-size: 18px; font-weight: 700; font-family: 'Poppins'; color: var(--accent); }
.gh-stats small { color: var(--text-dim); font-size: 11px; }
.gh-scroll { overflow-x: auto; }
.gh-grid { display: flex; gap: 3px; width: max-content; }
.gh-col { display: flex; flex-direction: column; gap: 3px; }
.gh-cell { width: 11px; height: 11px; border-radius: 3px; }

.progress-track { height: 8px; border-radius: 999px; background: var(--grid-line); overflow: hidden; margin-bottom: 14px; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent2)); transition: width .5s ease; border-radius: 999px; }
.goal-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; max-height: 220px; overflow-y: auto; }
.goal-list li { display: flex; align-items: center; gap: 10px; background: color-mix(in srgb, var(--accent) 5%, transparent); padding: 9px 12px; border-radius: 12px; font-size: 13px; }
.goal-list li.goal-done span:not(.goal-check) { text-decoration: line-through; color: var(--text-dim); }
.goal-check { background: none; border: none; color: var(--accent); cursor: pointer; padding: 0; display: flex; }
.goal-list li span:not(.goal-check span) { flex: 1; }

.notes-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.sticky-note { position: relative; border: 1px solid; border-radius: 14px; padding: 12px; min-height: 90px; }
.sticky-note textarea { width: 100%; height: 70px; background: transparent; border: none; outline: none; color: var(--text); font-size: 13px; resize: none; font-family: 'Inter'; }
.note-delete { position: absolute; top: 6px; right: 6px; background: none; border: none; color: var(--text-dim); cursor: pointer; }

.db-footer { text-align: center; color: var(--text-dim); font-size: 12px; padding: 20px 0 4px; }
kbd { background: var(--card-solid); border: 1px solid var(--card-border); border-radius: 6px; padding: 2px 6px; font-size: 11px; }

.confetti-layer { position: fixed; inset: 0; pointer-events: none; z-index: 100; overflow: hidden; }
.confetti-piece { position: absolute; top: -20px; border-radius: 2px; animation: fall linear forwards; }
@keyframes fall { to { transform: translateY(110vh) rotate(600deg); opacity: 0.4; } }

.focus-overlay { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; padding: 24px; position: relative; }
.focus-exit { position: absolute; top: 24px; right: 24px; }
.focus-modes { display: flex; gap: 10px; }
.focus-timer { position: relative; width: 280px; height: 280px; }
.focus-time { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 56px; font-weight: 700; font-family: 'Poppins'; font-variant-numeric: tabular-nums; }
.ambience-row { display: flex; align-items: center; gap: 10px; }
.amb-icon { color: var(--text-dim); }
.focus-hint { color: var(--text-dim); font-size: 12px; }

@media (max-width: 900px) {
  .db-grid-2, .overview-grid, .notes-grid { grid-template-columns: 1fr; }
  .hero-content { flex-direction: column; align-items: flex-start; }
  .hero-right { align-self: center; }
}
`;
