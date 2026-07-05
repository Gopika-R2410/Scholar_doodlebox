# Scholar — Student Productivity Dashboard

## Run it in VS Code

1. Unzip this folder and open it in VS Code (`File → Open Folder…`).
2. Open a terminal in VS Code (`` Ctrl+` `` / `` Cmd+` ``).
3. Install dependencies:
   ```
   npm install
   ```
4. Start the dev server:
   ```
   npm run dev
   ```
5. Open the URL it prints (usually `http://localhost:5173`) in your browser.

Requires Node.js 18+ (check with `node -v`; get it from https://nodejs.org if needed).

## Notes

- Data (goals, notes, Pomodoro sessions, connected accounts) is kept in memory only — refreshing the page resets it. Wire up `localStorage` or a backend if you want it to persist.
- Press `F` anywhere on the dashboard to jump into Focus Mode.

### Platform integrations — what's real vs. simulated

| Platform | What happens |
|---|---|
| **GitHub** | Real — calls the public GitHub API for profile + recent public events (no login needed for public data). |
| **LeetCode** | Tries a public community stats API; if it's unreachable, falls back to consistent simulated numbers for that username. LeetCode has no official public API, so live sync isn't guaranteed. |
| **GeeksforGeeks** | Same pattern as LeetCode — tries an unofficial community mirror, falls back to simulated stats. |
| **HackerRank** | No public profile API exists at all, so this always shows a clearly-labelled simulated card. |
| **LinkedIn** | Not a "connect" — it's a manual profile card. LinkedIn's API requires OAuth + app review and doesn't expose stats like connection counts to third-party apps, and scraping violates their ToS, so there's no real login here by design. |
| **Spotify** | Real — embeds Spotify's public player widget (no login required). Paste any playlist/album/track link to swap the default one. |

If you want a *fully* live LeetCode/HackerRank connection, that requires either an official partner API (not publicly available for these two) or your own backend that scrapes/proxies data — happy to help scaffold that if you want to go that route.
