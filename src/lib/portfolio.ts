export type PortfolioLink = { label: string; href: string };

export type PortfolioGroup = 'tools' | 'clients' | 'disciplines';

export type PortfolioItem = {
  group: PortfolioGroup;
  icon: string;
  hue: string;
  title: string;
  chip?: string;
  star?: boolean;
  link?: string;
  desc: string;
  links?: PortfolioLink[];
  descAfter?: string;
  tags: string[];
  /** one-line example invocation, rendered as dim shell chrome */
  run?: string;
  /** factual meta rows (key/value), rendered mono inside the feature cell */
  meta?: [string, string][];
  /** key into the still map on portfolio.astro (astro image pipeline) */
  still?: 'sectape' | 'skroutz-feed' | 'shopify-headless' | 'crewvista' | 'alabasterskin' | 'totemica';
};

export const portfolioItems: PortfolioItem[] = [
  {
    group: 'tools',
    icon: 'tabler:terminal-2',
    hue: 'var(--teal)',
    title: 'Sectape',
    chip: 'own tool',
    desc: 'A terminal-session recorder I designed and built. It captures every command and its output so security work stays auditable and reproducible - made for CTF labs, useful anywhere a shell runs.',
    run: 'sectape record',
    still: 'sectape',
    meta: [
      ['lang', 'python'],
      ['license', 'mit'],
      ['type', 'cli tool'],
    ],
    tags: ['session recording', 'audit trail', 'security tooling'],
  },
  {
    group: 'tools',
    icon: 'tabler:repeat',
    hue: 'var(--amber)',
    title: 'Skroutz XML Sync Framework',
    star: true,
    desc: "Python feed scripts keeping products, prices and stock in sync with Skroutz, Greece's largest price engine - in production for clients like",
    links: [
      { label: 'bathify.gr', href: 'https://bathify.gr' },
      { label: 'painfix.gr', href: 'https://painfix.gr' },
    ],
    descAfter: 'and more. Hardened across client stores, then generalized into a reusable framework built to sell.',
    still: 'skroutz-feed',
    tags: ['python', 'production feeds', 'client work'],
  },
  {
    group: 'tools',
    icon: 'tabler:shopping-cart',
    hue: 'var(--green)',
    title: 'Headless Shopify Framework',
    chip: 'open source',
    star: true,
    desc: "An open-source headless commerce starter: Shopify's engine behind a fully custom storefront. Decoupled, fast, and free for anyone to build on.",
    still: 'shopify-headless',
    tags: ['shopify', 'headless', 'open source'],
  },
  {
    group: 'clients',
    icon: 'tabler:rocket',
    hue: 'var(--sky)',
    title: 'crewvista.gr',
    link: 'https://crewvista.gr',
    still: 'crewvista',
    chip: 'in progress',
    star: true,
    desc: 'Maintaining and extending the platform ahead of its public release: upgrades, fixes and release prep, shipped continuously.',
    tags: ['maintenance', 'upgrades', 'release prep'],
  },
  {
    group: 'clients',
    icon: 'tabler:brand-wordpress',
    hue: 'var(--coral)',
    title: 'alabasterskin.gr',
    link: 'https://alabasterskin.gr',
    still: 'alabasterskin',
    desc: 'WordPress + WooCommerce work for a skincare brand: catalog, checkout flow, and the daily care a live store needs.',
    tags: ['wordpress', 'woocommerce'],
  },
  {
    group: 'clients',
    icon: 'tabler:shopping-bag',
    hue: 'var(--violet)',
    title: 'totemica.gr',
    link: 'https://totemica.gr',
    still: 'totemica',
    desc: 'A full WordPress + WooCommerce build, theme to checkout - plus the ongoing maintenance that keeps it selling.',
    tags: ['wordpress', 'woocommerce', 'full build'],
  },
  {
    group: 'disciplines',
    icon: 'tabler:robot',
    hue: 'var(--teal)',
    title: 'AI Agent Engineering',
    desc: 'Fluent in nearly every model and harness on the market, and in the glue that makes them useful: skills, MCP servers, Docker-based sandboxes. I know what each tool is good at, where it breaks, and how to chain them into agent pipelines that finish real work with few errors.',
    tags: ['agents', 'mcp', 'docker', 'prompting'],
  },
  {
    group: 'disciplines',
    icon: 'tabler:cpu',
    hue: 'var(--green)',
    title: 'Linux, daily, 5+ years',
    desc: 'Daily-driving Linux on my own hardware for over five years. The terminal is home, systemd is a coworker, and every breakage is a lesson I keep.',
    tags: ['arch btw', 'shell', 'self-hosting'],
  },
  {
    group: 'disciplines',
    icon: 'tabler:trophy',
    hue: 'var(--amber)',
    title: 'TryHackMe: top 8%',
    desc: '100+ rooms completed, top 8% of the platform. The catalog is the proof of work: every room that mattered, written up spoiler-free.',
    tags: ['100+ rooms', 'top 8%', 'ctf writeups'],
  },
];
