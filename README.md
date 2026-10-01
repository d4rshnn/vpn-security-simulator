# VPN Simulation

A browser-based VPN simulation for the VJTI Community of Coders cybersecurity stall. It shows what someone on café Wi-Fi can read when a message is sent over plain HTTP, HTTPS, and through a VPN. Everything is simulated; nothing is stored or sent anywhere.

## Run

Needs Node.js 20.19+ or 22.12+.

```
npm install
npm run dev
```

For offline use (works with Wi-Fi off), build once and serve the result:

```
npm run build && npm run preview
```

Other scripts: `npm test`, `npm run lint`.

## Deploy

Import the repo in Vercel (Vite preset, build command `npm run build`, output directory `dist`).

Fonts: OFL-1.1 (Inter, JetBrains Mono). Icons: Lucide, ISC.
