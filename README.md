# VPN Simulation

An interactive, browser-based simulation that shows what someone snooping on public Wi-Fi can read when you send a message, and how that changes with HTTPS and a VPN.

The same message is sent three ways, drawn as mail:

| Scenario | The message is... | The snooper sees... |
|---|---|---|
| Insecure (HTTP) | a postcard | the message itself |
| HTTPS | a postcard sealed in an envelope | who it is addressed to, not what it says |
| VPN | that envelope inside a bigger envelope | only a sealed envelope going to the VPN server |

Everything is simulated in the browser. Nothing is stored, tracked, or sent anywhere. Works on laptops and phones.

## Requirements

- Node.js 20.19+ or 22.12+ (check with `node -v`)
- npm (comes with Node)

The exact list is in `requirements.txt`.

## Run it

```
git clone <repo-url>
cd vpn-security-simulator
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173).

## Run it offline

Build once, then serve the built files. This works with Wi-Fi switched off.

```
npm run build
npm run preview
```

Open the address it prints (usually http://localhost:4173).

## Other commands

| Command | What it does |
|---|---|
| `npm test` | run the tests |
| `npm run lint` | check the code style |
| `npm run build` | build to `dist/` |

## Deploy

Import the repo in Vercel with the Vite preset: build command `npm run build`, output directory `dist`. No environment variables needed.

## Credits

Fonts: Inter and JetBrains Mono (OFL-1.1). Icons: Lucide (ISC).
