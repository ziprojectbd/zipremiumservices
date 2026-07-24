import { Gift, ArrowLeftRight, Repeat, BookOpen } from "lucide-react";
import type { ReactElement } from "react";

export interface NavItem {
  name: string;
  icon: ReactElement;
  badge: string;
  color: string;
  desc: string;
  slug: string;
}

export const navItems: NavItem[] = [
  {
    name: "Airdrop",
    icon: <Gift className="w-5 h-5" />,
    badge: "New",
    color: "from-pink-500 to-rose-500",
    desc: "Latest rewards",
    slug: "airdrop"
  },
  {
    name: "Trade",
    icon: <ArrowLeftRight className="w-5 h-5" />,
    badge: "Pro",
    color: "from-blue-500 to-cyan-500",
    desc: "Exchange assets",
    slug: "trade"
  },
  {
    name: "Buy / Sell",
    icon: <Repeat className="w-5 h-5" />,
    badge: "Safe",
    color: "from-green-500 to-emerald-500",
    desc: "Instant crypto",
    slug: "trade"
  },
  {
    name: "Blogs",
    icon: <BookOpen className="w-5 h-5" />,
    badge: "Read",
    color: "from-purple-500 to-indigo-500",
    desc: "Market news",
    slug: "all"
  },
];

export const tokenOptions = [
  'USDT', 'USDC', 'BNB', 'ETH', 'SOL', 'TON'
];

export const networkOptions = [
  'Ethereum', 'BNB Chain', 'Tron', 'Solana', 'Polygon',
  'Arbitrum', 'Optimism', 'TON', 'Avalanche', 'Fantom', 'Base', 'Cronos'
];
