import React, { useState, useEffect } from "react";
import {
    Gift,
    ChevronRight,
    Timer,
    Users,
    ExternalLink,
    Sparkle,
    Trophy,
    Zap,
    ShieldCheck,
    ArrowRight,
    AlertTriangle,
    ShieldAlert,
    Lock,
    Key,
    Cpu,
    Layers,
    Info,
    Flame,
    Star,
    Coins,
} from "lucide-react";

import { useShopContext } from "../../store/ShopContext";

// Particle Background Component (Simplified version for Airdrop page)
const AirdropParticles = () => {
    return null;
};

export default function AirdropPage() {
    const {
        setView,
    } = useShopContext();

    const [activeTab, setActiveTab] = useState("latest");

    interface AirdropItem {
        id: number;
        title: string;
        description: string;
        reward: string;
        participants: string;
        timeLeft: string;
        type: string;
        category: string;
        color: string;
        icon: React.ReactNode;
    }

    const [activeAirdrops] = useState<AirdropItem[]>([]);

    useEffect(() => {
        setView("home");
    }, [setView]);

    const [scrollProgress, setScrollProgress] = useState(0);

    // Scroll progress effect
    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
                    const progress = (window.scrollY / totalHeight) * 100;
                    setScrollProgress(progress);
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleClaim = (_title: string) => {
        // Alert disabled as requested
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-gray-100 transition-colors selection:bg-purple-500/30">

            {/* Scroll Progress Bar */}
            <div
                className="fixed top-0 left-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 z-[100] transition-all duration-150 ease-out shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                style={{ width: `${scrollProgress}%` }}
            />

            <main className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
                <AirdropParticles />

                {/* Hero Section */}
                <div className="relative z-10 text-center mb-16 animate-fade-in">
                    <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-sm shadow-lg shadow-purple-500/10">
                        <Sparkle className="w-4 h-4 text-purple-400 animate-pulse" />
                        <span className="text-purple-200 text-xs sm:text-sm font-bold tracking-widest uppercase">
                            Exclusive Airdrop Center
                        </span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-black mb-6 bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent drop-shadow-sm">
                        Claim Your Premium <br /> Rewards Today
                    </h1>

                    <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
                        Join the most rewarding digital community. Participate in exclusive airdrops,
                        giveaways, and community events to win premium subscriptions and digital assets.
                    </p>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16 relative z-10">
                    {[
                        { label: "Total Distributed", value: "$25,000+", icon: <Trophy className="w-5 h-5" />, color: "text-yellow-400" },
                        { label: "Active Participants", value: "45k+", icon: <Users className="w-5 h-5" />, color: "text-blue-400" },
                        { label: "Success Rate", value: "99.9%", icon: <ShieldCheck className="w-5 h-5" />, color: "text-green-400" }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex items-center gap-4 group hover:bg-white/10 transition-all duration-300">
                            <div className={`p-3 rounded-xl bg-white/5 ${stat.color} group-hover:scale-110 transition-transform`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-white/40 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                                <p className="text-2xl font-black text-white">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tab Navigation */}
                <div className="relative z-10 mb-12 flex justify-center px-2 sm:px-4">
                    <div className="inline-flex flex-nowrap items-stretch bg-slate-900/40 backdrop-blur-2xl rounded-2xl overflow-x-auto no-scrollbar shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 max-w-full p-1 gap-1 mx-auto">
                        <button
                            onClick={() => setActiveTab('latest')}
                            className={`relative group flex items-center gap-2 sm:gap-3 px-3 sm:px-8 py-3 sm:py-5 text-[10px] sm:text-sm font-black uppercase transition-all duration-500 rounded-xl overflow-hidden whitespace-nowrap ${activeTab === 'latest' ? 'text-white' : 'text-white/50 hover:text-white'}`}
                        >
                            <div className={`absolute inset-0 transition-all duration-500 ${activeTab === 'latest' ? 'bg-purple-500/20' : 'bg-transparent group-hover:bg-purple-500/10'}`} />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none hidden sm:block">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-shimmer-fast" />
                                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-shimmer-fast delay-75" />
                            </div>
                            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] sm:h-[3px] bg-purple-500 rounded-t-full transition-all duration-500 shadow-[0_0_15px_rgba(168,85,247,1)] ${activeTab === 'latest' ? 'w-6 sm:w-10 opacity-100' : 'w-0 opacity-0 group-hover:w-4 sm:group-hover:w-6 group-hover:opacity-100'}`} />
                            <Zap className={`relative z-10 w-3.5 h-3.5 sm:w-5 sm:h-5 transition-all duration-500 ${activeTab === 'latest' ? 'text-purple-400 scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'text-white/40 group-hover:text-purple-400 group-hover:scale-110'}`} />
                            <span className="relative z-10 tracking-wider sm:tracking-widest">Latest</span>
                            <span className="hidden sm:inline relative z-10 tracking-widest ml-1">Airdrops</span>
                            {activeTab === 'latest' && (
                                <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full animate-ping opacity-50" />
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('hot')}
                            className={`relative group flex items-center gap-2 sm:gap-3 px-3 sm:px-8 py-3 sm:py-5 text-[10px] sm:text-sm font-black uppercase transition-all duration-500 rounded-xl overflow-hidden whitespace-nowrap ${activeTab === 'hot' ? 'text-white' : 'text-white/50 hover:text-white'}`}
                        >
                            <div className={`absolute inset-0 transition-all duration-500 ${activeTab === 'hot' ? 'bg-orange-500/20' : 'bg-transparent group-hover:bg-orange-500/10'}`} />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none hidden sm:block">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-shimmer-fast" />
                                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-shimmer-fast delay-75" />
                            </div>
                            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] sm:h-[3px] bg-orange-500 rounded-t-full transition-all duration-500 shadow-[0_0_15px_rgba(249,115,22,1)] ${activeTab === 'hot' ? 'w-6 sm:w-10 opacity-100' : 'w-0 opacity-0 group-hover:w-4 sm:group-hover:w-6 group-hover:opacity-100'}`} />
                            <Flame className={`relative z-10 w-3.5 h-3.5 sm:w-5 sm:h-5 transition-all duration-500 ${activeTab === 'hot' ? 'text-orange-400 scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'text-white/40 group-hover:text-orange-400 group-hover:scale-110'}`} />
                            <span className="relative z-10 tracking-wider sm:tracking-widest">Hot</span>
                            <span className="hidden sm:inline relative z-10 tracking-widest ml-1">Airdrops</span>
                            {activeTab === 'hot' && (
                                <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full animate-ping opacity-50" />
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('potential')}
                            className={`relative group flex items-center gap-2 sm:gap-3 px-3 sm:px-8 py-3 sm:py-5 text-[10px] sm:text-sm font-black uppercase transition-all duration-500 rounded-xl overflow-hidden whitespace-nowrap ${activeTab === 'potential' ? 'text-white' : 'text-white/50 hover:text-white'}`}
                        >
                            <div className={`absolute inset-0 transition-all duration-500 ${activeTab === 'potential' ? 'bg-yellow-500/20' : 'bg-transparent group-hover:bg-yellow-500/10'}`} />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none hidden sm:block">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer-fast" />
                                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer-fast delay-75" />
                            </div>
                            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] sm:h-[3px] bg-yellow-500 rounded-t-full transition-all duration-500 shadow-[0_0_15px_rgba(234,179,8,1)] ${activeTab === 'potential' ? 'w-6 sm:w-10 opacity-100' : 'w-0 opacity-0 group-hover:w-4 sm:group-hover:w-6 group-hover:opacity-100'}`} />
                            <Star className={`relative z-10 w-3.5 h-3.5 sm:w-5 sm:h-5 transition-all duration-500 ${activeTab === 'potential' ? 'text-yellow-400 scale-110 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]' : 'text-white/40 group-hover:text-yellow-400 group-hover:scale-110'}`} />
                            <span className="relative z-10 tracking-wider sm:tracking-widest">Potential</span>
                            <span className="hidden sm:inline relative z-10 tracking-widest ml-1">Airdrops</span>
                            {activeTab === 'potential' && (
                                <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full animate-ping opacity-50" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Active Airdrops */}
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                {activeTab === 'latest' && <Zap className="w-6 h-6 text-purple-500" />}
                                {activeTab === 'hot' && <Flame className="w-6 h-6 text-orange-500" />}
                                {activeTab === 'potential' && <Star className="w-6 h-6 text-yellow-500" />}
                                <span className="capitalize">{activeTab}</span> Airdrops
                            </h2>
                            <p className="text-white/40 text-sm mt-1">
                                {activeTab === 'latest' ? "The newest opportunities in the ecosystem" :
                                    activeTab === 'hot' ? "Trending airdrops with massive participation" :
                                        "Upcoming gems you should keep an eye on"}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {activeAirdrops.filter(a => a.category === activeTab).map((airdrop) => (
                            <div key={airdrop.id} className="group relative bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden hover:border-purple-500/50 transition-all duration-500 hover:shadow-[0_0_50px_rgba(139,92,246,0.15)]">
                                {/* Image Placeholder with Gradient */}
                                <div className={`h-48 bg-gradient-to-br ${airdrop.color} relative overflow-hidden`}>
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center p-4 shadow-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                            {React.cloneElement(airdrop.icon as React.ReactElement, { className: "w-12 h-12 text-white" })}
                                        </div>
                                    </div>
                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[10px] font-bold py-1 px-2 rounded-md bg-purple-500/20 text-purple-300 uppercase tracking-widest border border-purple-500/30">
                                            {airdrop.type}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-bold uppercase tracking-wider ml-auto">
                                            <Timer className="w-3 h-3" />
                                            {airdrop.timeLeft}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold mb-2 group-hover:text-purple-300 transition-colors">{airdrop.title}</h3>
                                    <p className="text-white/50 text-sm leading-relaxed mb-6 h-12 line-clamp-2">
                                        {airdrop.description}
                                    </p>

                                    <div className="flex items-center justify-between py-4 border-t border-white/5">
                                        <div>
                                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Pool Size</p>
                                            <p className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">
                                                {airdrop.reward}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleClaim(airdrop.title)}
                                            className="relative group flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-sm transition-all duration-500 overflow-hidden shadow-[0_10px_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] active:scale-95"
                                        >
                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer-fast" />
                                                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer-fast delay-75" />
                                            </div>
                                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                            <span className="relative z-10">Enter</span>
                                            <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping opacity-0 group-hover:opacity-40" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* How it Works */}
                <div className="mt-20 relative z-10">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black mb-4">How to Participate?</h2>
                        <p className="text-white/40 max-w-xl mx-auto">Follow these simple steps to start receiving your premium rewards and bonuses.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: "Connect", desc: "Sign in to your account to get started.", step: "01" },
                            { title: "Choose", desc: "Select an active airdrop from the list above.", step: "02" },
                            { title: "Complete", desc: "Follow the simple tasks required for entry.", step: "03" },
                            { title: "Win", desc: "Results are announced via email and our social channels.", step: "04" }
                        ].map((step, i) => (
                            <div key={i} className="relative p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                                <span className="absolute top-4 right-6 text-4xl font-black text-white/5">{step.step}</span>
                                <h4 className="text-lg font-bold mb-3">{step.title}</h4>
                                <p className="text-sm text-white/40 leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stay Safe Warning Section */}
                <div className="mt-24 relative z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-amber-500/5 backdrop-blur-3xl rounded-[2.5rem] border border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.05)]" />

                    <div className="relative p-8 sm:p-12">
                        <div className="flex flex-col lg:flex-row gap-12 items-start">
                            {/* Left Side: Warning Content */}
                            <div className="lg:w-1/2">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-6">
                                    <ShieldAlert className="w-4 h-4" />
                                    <span className="text-xs font-black uppercase tracking-widest">Airdrop Warning & Security</span>
                                </div>

                                <h2 className="text-3xl sm:text-4xl font-black mb-6 text-white flex items-center gap-3">
                                    <AlertTriangle className="w-8 h-8 text-amber-500 animate-pulse" />
                                    Stay Safe! Project
                                </h2>
                                <p className="text-lg text-white/60 leading-relaxed mb-8">
                                    Crypto world is full of scammers trying to steal your private keys and cryptocurrency funds.
                                    To avoid getting scammed or hacked we would highly recommend to follow our rules for being safe in crypto space:
                                </p>

                                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                                            <Info className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-bold text-lg text-white">Need Help?</h4>
                                    </div>
                                    <p className="text-sm text-white/50 mb-6">
                                        If you're unsure about any airdrop or need assistance with your security settings, our support team is available 24/7.
                                    </p>
                                    <a
                                        href="/live-support"
                                        className="relative group inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-black text-sm transition-all duration-500 border border-white/10 overflow-hidden shadow-lg"
                                    >
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-shimmer-fast" />
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-shimmer-fast delay-75" />
                                        </div>
                                        <span className="relative z-10 transition-colors duration-300">Contact 24/7 Support</span>
                                        <ExternalLink className="relative z-10 w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </a>
                                </div>
                            </div>

                            {/* Right Side: Security Rules Grid */}
                            <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { icon: <Cpu />, title: "Hardware Wallets", desc: "Use hardware wallets like Trezor or Ledger to store your crypto!" },
                                    { icon: <Key />, title: "Private Keys", desc: "Never give your private key to anyone!" },
                                    { icon: <Lock />, title: "Strong Passwords", desc: "Always use unique and strong passwords for every account!" },
                                    { icon: <Coins />, title: "No Payments", desc: "Do not send ETH or BTC to any airdrop! Real ones are free." },
                                    { icon: <Layers />, title: "Virtual Machines", desc: "Use virtual machines (VMs) for custom or risky wallets!" },
                                    { icon: <ShieldCheck />, title: "2FA Protection", desc: "Activate 2-factor-authentication whenever possible!" }
                                ].map((rule, i) => (
                                    <div key={i} className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-amber-500/30 transition-all group overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <div className="relative z-10 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                                            {rule.icon}
                                        </div>
                                        <h5 className="relative z-10 font-bold text-white mb-2">{rule.title}</h5>
                                        <p className="relative z-10 text-xs text-white/40 leading-relaxed">{rule.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
