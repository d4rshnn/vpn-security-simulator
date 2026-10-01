/*
 * EVERY on-screen string lives here (PROJECT_SPEC.md §C, §D, §H, §I, §J, §K).
 * Wording changes need approval. Emoji from the spec are placeholders: icons replace them.
 */

export const copy = {
  site: {
    name: 'VPN Simulation',
    reset: 'Reset',
    steps: ['Message', 'Simulate', 'Summary'],
    progress: 'Progress',
    footer: 'Simulation only: no real network, traffic or VPN is used.',
  },

  intro: {
    heading: 'See what changes when your connection uses a VPN.',
    subheading: 'A 3-minute interactive simulation',
    prompt: 'Press any key or click to start',
  },

  message: {
    scenario: "You're on free Wi-Fi at a café near campus, sending a private message to a website.",
    pickSample: 'Pick a sample message',
    inputLabel: '…or type your own harmless message',
    safety: 'Use sample messages only. Nothing you type is saved or sent anywhere.',
    realDataWarning: 'This looks like real information. Please use a sample message.',
    counter: (used: number, max: number) => `${used}/${max}`,
    next: 'Next →',
  },

  simulate: {
    scenarios: {
      insecure: 'Insecure (HTTP)',
      https: 'HTTPS',
      vpn: 'With VPN',
    },
    replay: 'Replay',
    summary: 'Summary →',
  },

  diagram: {
    you: 'You',
    router: 'Café Wi-Fi',
    vpn: 'VPN server',
    dest: 'Destination server',
    snooper: 'Snooper',
    regularInternet: 'regular internet',
    tunnel: 'Encrypted VPN tunnel',
    httpsBracket: 'HTTPS: encrypted to the destination',
    delivered: 'Delivered',
    envelopeTo: (to: string) => `To: ${to}`,
  },

  bubble: {
    noticed: 'Noticed traffic',
    cantOpen: "can't open it",
    inside: 'Inside:',
    stillSees: 'Still sees: a VPN is used, when, how much.',
  },

  captions: {
    insecure: {
      packed: 'You write your message on a postcard.',
      wifi: 'It travels over the café Wi-Fi…',
      captured: '…and a snooper on the same Wi-Fi copies it.',
      readable: "It's a postcard, so the snooper can read it.",
      arrives: 'The message still arrives. Nobody noticed the copy.',
      next: 'Now try the same message with HTTPS →',
    },
    https: {
      start: 'This time the website uses HTTPS.',
      encrypt: 'Your browser seals the postcard in an envelope for vjti-chat.example.',
      wifi: 'It crosses the same café Wi-Fi…',
      snooper: "The snooper sees the address, but can't open the envelope.",
      decrypt: 'Only vjti-chat.example can open it.',
      next: 'Now see what a VPN changes →',
    },
    vpn: {
      start: 'You write your message on a postcard.',
      encrypt: 'The site uses HTTPS, so your browser seals it for vjti-chat.example.',
      wrap: 'Your VPN puts that envelope inside a bigger one…',
      wrapAddress: '…addressed to the VPN server.',
      tunnel: 'An encrypted tunnel to the VPN server opens…',
      wifi: '…through the same café Wi-Fi.',
      snooper: "The snooper sees an envelope to a VPN server, but can't open it.",
      decrypt: 'The VPN server opens its envelope. It sees vjti-chat.example, but not your message.',
      trust: "That's why you must trust your VPN provider.",
      regular: "From here it's regular internet, still sealed by HTTPS.",
      open: 'Only vjti-chat.example can open it.',
      next: 'See the summary →',
    },
  },

  summary: {
    title: 'What the snooper on the café Wi-Fi saw',
    cards: {
      insecure: 'Anyone on the Wi-Fi could read it.',
      https: 'They saw where it went, not what it said.',
      vpn: 'They only saw a sealed envelope going to a VPN server.',
    },
    notRun: 'Not run',
    bottomLine: "A VPN protects you on untrusted Wi-Fi, but it won't make you anonymous or stop scams.",
    learnMore: 'Learn more',
    showLess: 'Show less',
    does: {
      title: 'A VPN does',
      items: [
        'Encrypt your traffic between your device and the VPN server',
        'Stop people on your local network from reading it or seeing which sites you visit',
        "Show websites the VPN server's address instead of yours",
      ],
    },
    doesNot: {
      title: 'A VPN does not',
      items: [
        'Make you anonymous: logins, cookies and the VPN provider can still identify you',
        'Protect you from phishing, scams, malware or weak passwords',
        "Hide that you're sending traffic: timing, size, and the fact you use a VPN stay visible",
      ],
    },
    together: 'HTTPS and a VPN work best together.',
    note: 'Simulated encryption: the envelopes stand in for real encryption. This website is a simulation, not a VPN.',
    startOver: 'Start over',
  },
} as const
