import { devLog } from '../../utils/devLogger';
import React, { useEffect, useState } from "react";
import api from '../../lib/axios';
import { useNavigate } from "react-router-dom";
import {
    ShoppingCart,
    Star,
    Shield,
    Zap,
    Globe,
    Lock,
    Phone,
    Wallet,
    CheckCircle2,
    Sparkle,
    MessageCircle,
    Headset,
    Gift,
    ArrowLeftRight,
    Repeat,
    Coins,
    BookOpen,
    ChevronRight,
    Package,
    Users,
    Settings,
    Home,
} from "lucide-react";

import PromoMarquee from "./PromoMarquee";
import LiveOrderTicker from "./LiveOrderTicker";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// ─── HeroSection ──────────────────────────────────────────────────────────────
interface HeroSectionProps {
    heroRef: React.RefObject<HTMLDivElement>;
    sideSliderSettings?: any;
    liveOrders: any[];
}

export default function HeroSection({ heroRef, sideSliderSettings, liveOrders }: HeroSectionProps) {
    const navigate = useNavigate();
    const [promoOffers, setPromoOffers] = useState<{ image: string; title: string; desc: string; link?: string; type?: 'image' | 'lottie' }[]>([]);

    // Icon mapping function
    const getIconComponent = (iconName: string) => {
        const iconMap: { [key: string]: any } = {
            gift: Gift,
            'arrow-left-right': ArrowLeftRight,
            repeat: Repeat,
            coins: Coins,
            'book-open': BookOpen,
            shield: Shield,
            zap: Zap,
            shopping: ShoppingCart,
            package: Package,
            users: Users,
            settings: Settings,
            message: MessageCircle,
            wallet: Wallet,
            home: Home,
            globe: Globe,
            lock: Lock,
            star: Star,
        };
        return iconMap[iconName] || Gift;
    };

    useEffect(() => {
        fetchPromoOffers();
    }, []);

    const fetchPromoOffers = async () => {
        try {
            const response = await api.get('/public/promo-offers');
            const result = response.data;

            if (result.success) {
                const offers = result.data
                    .filter((offer: any) => offer.enabled)
                    .sort((a: any, b: any) => a.order - b.order)
                    .map((offer: any) => ({
                        image: offer.imageUrl,
                        title: offer.title,
                        desc: offer.description,
                        link: offer.link,
                        type: offer.type || 'image',
                    }));
                setPromoOffers(offers);
            }
        } catch (error) {
            devLog('Error fetching promo offers:', error);
            // Fallback to default offers if API fails
            setPromoOffers([
                { image: "/images/promo60.webp", title: "Special Promo", desc: "Limited time offer" },
                { image: "/images/promo70.webp", title: "Special Promo", desc: "Limited time offer" },
                { image: "/images/buy1get1.webp", title: "Buy 1 Get 1", desc: "Exclusive deal" },
            ]);
        }
    };

    return (
        <section
            ref={heroRef}
            className="relative isolate text-white pt-6 sm:pt-10 pb-12 sm:pb-20 overflow-hidden min-h-[500px] lg:min-h-[450px] flex items-start hero-section"
        >
            {/* ── SIDE PANEL — Quick Access (Pinned to Edge, Desktop only) ── */}
            <div className="hidden xl:flex absolute left-0 top-10 bottom-24 flex-col w-72 z-20 animate-fade-in-left side-panel">
                <div className="relative h-full rounded-r-3xl overflow-hidden border-r border-t border-b border-blue-500/50 shadow-[20px_0_40px_rgba(0,0,0,0.4)] backdrop-blur-2xl bg-black/40 flex flex-col">
                    {/* Decorative elements */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10 flex flex-col h-full">
                        {/* Nav Items */}
                        <div className="p-6 pr-8 flex-1 overflow-hidden min-h-0">
                            <div className="overflow-y-auto h-full custom-scrollbar no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {(sideSliderSettings?.navigation || [])
                                    .filter((item: any) => item.enabled)
                                    .sort((a: any, b: any) => a.order - b.order)
                                    .map((item: any, idx: number) => {
                                        const IconComponent = getIconComponent(item.icon);
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    navigate(item.slug === "all" ? "/" : `/${item.slug}`);
                                                }}
                                                className="w-full group relative flex items-center gap-4 px-2 py-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all duration-400 transform hover:translate-x-2 mb-[10px]"
                                            >
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg shadow-black/20 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
                                                    <div className="text-white scale-90"><IconComponent className="w-5 h-5" /></div>
                                                </div>
                                                <div className="flex-1 text-left min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <p className="text-white font-bold text-xs truncate">{item.name}</p>
                                                    </div>
                                                    <p className="text-white/40 text-[9px] truncate group-hover:text-white/60 transition-colors uppercase tracking-wider">{item.description}</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Bottom content */}
                        <div className="p-4 border-t border-white/10 space-y-4 flex-shrink-0">
                            {/* Live Order Ticker */}
                            {sideSliderSettings?.liveActivity?.enabled !== false && (
                                <div className="rounded-xl bg-white/5 border border-white/5 overflow-hidden">
                                    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5 bg-white/5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                                        <span className="text-white/50 text-[9px] font-bold tracking-wider uppercase">Live Activity</span>
                                    </div>
                                    <LiveOrderTicker orders={liveOrders} height={48} />
                                </div>
                            )}

                            {/* Compact Trust Badges */}
                            {sideSliderSettings?.trustBadges?.safe?.enabled !== false || sideSliderSettings?.trustBadges?.fast?.enabled !== false ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {/* Safe Badge */}
                                    {sideSliderSettings?.trustBadges?.safe?.enabled !== false && (
                                        <div className="group relative flex flex-col items-center gap-0.5 p-2 rounded-xl bg-white/5 border border-white/5 hover:border-green-400/30 hover:bg-green-400/5 transition-all duration-500 cursor-default overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/10 to-transparent -translate-x-full group-hover:animate-[shimmer-slide_1s_ease-in-out]" />
                                            <div className="relative z-10 flex flex-col items-center gap-0.5">
                                                <Shield className="w-3.5 h-3.5 text-green-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                                                <span className="text-white/40 group-hover:text-green-300/90 text-[8px] font-bold text-center leading-tight uppercase tracking-tighter transition-colors duration-300">{sideSliderSettings?.trustBadges?.safe?.label || 'Safe'}</span>
                                            </div>
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-8 bg-green-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        </div>
                                    )}

                                    {/* Fast Badge */}
                                    {sideSliderSettings?.trustBadges?.fast?.enabled !== false && (
                                        <div className="group relative flex flex-col items-center gap-0.5 p-2 rounded-xl bg-white/5 border border-white/5 hover:border-orange-400/30 hover:bg-orange-400/5 transition-all duration-500 cursor-default overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/10 to-transparent -translate-x-full group-hover:animate-[shimmer-slide_1s_ease-in-out]" />
                                            <div className="relative z-10 flex flex-col items-center gap-0.5">
                                                <Zap className="w-3.5 h-3.5 text-orange-400 group-hover:scale-110 group-hover:-rotate-12 group-hover:animate-pulse transition-all duration-300" />
                                                <span className="text-white/40 group-hover:text-orange-300/90 text-[8px] font-bold text-center leading-tight uppercase tracking-tighter transition-colors duration-300">{sideSliderSettings?.trustBadges?.fast?.label || 'Fast'}</span>
                                            </div>
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-8 bg-orange-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            {/* ZI Premium Services */}
                            {sideSliderSettings?.premiumServices?.enabled !== false && (
                                <div className="flex items-center space-x-2 p-3 rounded-xl bg-white/5 border border-white/10">
                                    <div className="p-1.5 bg-gradient-to-br from-blue-350 to-purple-600 rounded-lg shadow-lg flex-shrink-0">
                                        <img src={sideSliderSettings?.premiumServices?.logo || '/zi-logo.svg'} alt="ZI Logo" className="w-5 h-5 object-contain" loading="lazy" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h1 className="text-sm font-black leading-tight whitespace-nowrap">
                                            <span className="bg-gradient-to-r from-pink-500 via-amber-400 to-sky-500 bg-clip-text text-transparent drop-shadow-sm cinzel-decorative-black">
                                                {sideSliderSettings?.premiumServices?.title}
                                            </span>
                                        </h1>
                                        <p className="text-[10px] text-gray-400/80 font-medium">{sideSliderSettings?.premiumServices?.subtitle}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── RIGHT SIDE PANEL — Promo Offers (Pinned to Edge, Desktop only) ── */}
            <div className="hidden xl:flex absolute right-0 top-10 bottom-24 flex-col w-72 z-20 animate-fade-in-right">
                <div className="relative h-full rounded-l-3xl overflow-hidden border-l border-t border-b border-red-500/50 shadow-[-20px_0_40px_rgba(0,0,0,0.4)] bg-transparent flex flex-col">
                    {/* Decorative elements */}
                    <div className="absolute -top-10 -left-10 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10 flex flex-col h-full overflow-hidden">
                        {/* Special Offer — Fixed Card */}
                        <div className="flex-shrink-0 px-6 pt-5 pb-2">
                            <button
                                onClick={() => navigate('/special-offer')}
                                className="group relative w-full rounded-xl overflow-hidden border border-orange-500/40 bg-gradient-to-br from-orange-600/25 via-amber-600/20 to-yellow-600/25 p-3 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/15"
                            >
                                <div className="absolute -top-4 -right-4 w-16 h-16 bg-orange-500/15 rounded-full blur-2xl" />
                                <div className="relative z-10 flex items-center gap-3">
                                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 2.879a3 3 0 00-4.242 0L3.04 9.718a3 3 0 00-.879 2.122v9.657a.75.75 0 00.75.75h18a.75.75 0 00.75-.75v-9.657a3 3 0 00-.879-2.122l-6.839-6.84a3 3 0 00-4.242 0zM9.75 21v-6a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v6" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors">Special Offers</p>
                                        <p className="text-[9px] text-gray-400 mt-0.5">Limited time deals</p>
                                    </div>
                                    <div className="flex-shrink-0 px-2 py-1 rounded-md bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[9px] font-bold group-hover:bg-orange-500/30 transition-colors">View</div>
                                </div>
                            </button>
                        </div>

                        {/* Scrolling promo offers - bottom to top */}
                        <div className="flex-1 px-6 pb-5 overflow-hidden custom-scrollbar" style={{
                            maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)'
                        }}>
                            <div className="marquee-promo-track">
                                {/* Original items */}
                                {promoOffers.map((offer, idx) => (
                                    <div
                                        key={idx}
                                        className="group relative rounded-2xl overflow-hidden bg-slate-800 hover:border-slate-600 transition-all duration-300 hover:scale-[1.02] flex-shrink-0 border border-slate-700 cursor-pointer mb-4"
                                        onClick={() => {
                                            if (offer.link) {
                                                navigate(offer.link);
                                            }
                                        }}
                                    >
                                        {offer.type === 'lottie' ? (
                                            <div className="w-full h-32 sm:h-40 flex items-center justify-center bg-black/20 rounded-2xl overflow-hidden">
                                                <DotLottieReact
                                                    src={offer.image}
                                                    loop
                                                    autoplay
                                                    className="w-full h-full"
                                                    style={{ width: '100%', height: '100%' }}
                                                />
                                            </div>
                                        ) : (
                                            <img src={offer.image} alt={offer.title} className="w-full h-full object-cover rounded-2xl" onClick={(e) => e.preventDefault()} style={{ pointerEvents: 'none' }} />
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent rounded-b-2xl">
                                            <p className="text-white font-bold text-sm mb-1 drop-shadow-lg">{offer.title}</p>
                                            <p className="text-slate-200 text-xs drop-shadow-md">{offer.desc}</p>
                                        </div>
                                    </div>
                                ))}
                                {/* Duplicate for seamless loop */}
                                {promoOffers.map((offer, idx) => (
                                    <div
                                        key={`dup-${idx}`}
                                        className="group relative rounded-2xl overflow-hidden bg-slate-800 hover:border-slate-600 transition-all duration-300 hover:scale-[1.02] flex-shrink-0 border border-slate-700 cursor-pointer mb-4"
                                        onClick={() => {
                                            if (offer.link) {
                                                navigate(offer.link);
                                            }
                                        }}
                                    >
                                        {offer.type === 'lottie' ? (
                                            <div className="w-full h-32 sm:h-40 flex items-center justify-center bg-black/20 rounded-2xl overflow-hidden">
                                                <DotLottieReact
                                                    src={offer.image}
                                                    loop
                                                    autoplay
                                                    className="w-full h-full"
                                                    style={{ width: '100%', height: '100%' }}
                                                />
                                            </div>
                                        ) : (
                                            <img src={offer.image} alt={offer.title} className="w-full h-full object-cover rounded-2xl" onClick={(e) => e.preventDefault()} style={{ pointerEvents: 'none' }} />
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent rounded-b-2xl">
                                            <p className="text-white font-bold text-sm mb-1 drop-shadow-lg">{offer.title}</p>
                                            <p className="text-slate-200 text-xs drop-shadow-md">{offer.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/images/hero-background.webp')" }}
            ></div>

            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/40"></div>

            {/* Static gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-pink-900/30"></div>

            {/* Hero Content */}
            <div className="relative z-10 w-full hero-content">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 xl:px-8">
                    <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-6 xl:gap-12 hero-main-flex">

                        {/* ── LEFT SIDE ── */}
                        <div className="flex-1 text-center lg:text-left min-w-0">
                            <div className="mb-8 sm:mb-10 animate-fade-in">
                                {/* Top badge */}
                                <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-yellow-400/40 bg-yellow-400/10 backdrop-blur-sm">
                                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse flex-shrink-0" />
                                    <span className="text-yellow-200 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase">
                                        Welcome to
                                    </span>
                                </div>

                                {/* Main heading */}
                                <h1 className="font-black mb-4 sm:mb-6 leading-[1.1] sm:leading-tight">
                                    <span className="relative inline-block max-w-full">
                                        <div className="absolute inset-0 rounded-lg opacity-50 -z-10" style={{ backgroundImage: 'radial-gradient( circle 710px at 5.2% 7.2%, rgba(37,89,222,1) 0%, rgba(37,89,222,1) 7.5%, rgba(4,4,29,1) 44.7% )' }}>
                                        </div>
                                        <span className="relative z-10 px-3 sm:px-4 py-1.5 sm:py-1 text-[clamp(1.2rem,5vw,3rem)] bg-gradient-to-r from-lime-500 via-red-500 to-lime-500 bg-clip-text text-transparent drop-shadow-2xl block sm:inline-block text-center whitespace-normal sm:whitespace-nowrap cinzel-decorative-black">
                                            ZI PREMIUM SERVICES
                                        </span>
                                    </span>

                                    <span className="block mt-4 sm:mt-3 text-[8px] sm:text-sm md:text-base font-bold sm:font-semibold tracking-[0.15em] sm:tracking-[0.25em] uppercase" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                                        <span className="bg-gradient-to-r from-orange-200 via-yellow-100 to-pink-200 bg-clip-text text-transparent">
                                            Unlock Premium Services at the Best Prices
                                        </span>
                                    </span>
                                </h1>
                            </div>

                            {/* New Text and Image Div */}
                            <div className="mb-6 sm:mb-8 lg:mb-10 flex items-center justify-center gap-4 sm:gap-6 lg:gap-8 animate-fade-in">
                                {/* Left side text */}
                                <div className="flex-1 text-center lg:text-left">
                                    <p className="text-xs sm:text-sm md:text-base lg:text-xl font-semibold leading-tight text-white/90 drop-shadow-lg" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                                        Get access to all your favourite premium services at{" "}
                                        <span className="text-yellow-400 font-bold underline">unbeatable prices.</span>
                                        <br className="hidden md:block" />
                                        Quality, reliability, and{" "}
                                        <span className="text-yellow-400 font-bold">savings</span> — all in one place.
                                    </p>
                                </div>

                                {/* Right side image */}
                                <div className="flex-shrink-0 p-0">
                                    <img
                                        src="/images/genie.png"
                                        alt="Genie"
                                        className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-32 lg:w-40 lg:h-40 object-contain drop-shadow-2xl animate-hero-float"
                                        onClick={(e) => e.preventDefault()}
                                        style={{ pointerEvents: 'none' }}
                                    />
                                </div>
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 justify-center lg:justify-start items-center mb-10 sm:mb-12">

                                {/* Shop Now */}
                                <button
                                    onClick={() => {
                                        const productsSection = document.getElementById('products');
                                        if (productsSection) {
                                            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        } else {
                                            window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
                                        }
                                    }}
                                    className="cta-btn"
                                >
                                    <span className="span flex items-center gap-3">
                                        <div className="w-12 h-12">
                                            <DotLottieReact src="/lottie/shopping cart.lottie" loop autoplay />
                                        </div>
                                        <span className="cinzel-decorative-bold text-lg">BUY NOW</span>
                                    </span>
                                    <span className="second">
                                        <svg
                                            width="50px"
                                            height="20px"
                                            viewBox="0 0 66 43"
                                            version="1.1"
                                            xmlns="http://www.w3.org/2000/svg"
                                            xmlnsXlink="http://www.w3.org/1999/xlink"
                                        >
                                            <g
                                                id="arrow"
                                                stroke="none"
                                                strokeWidth="1"
                                                fill="none"
                                                fillRule="evenodd"
                                            >
                                                <path
                                                    className="one"
                                                    d="M40.1543933,3.89485454 L43.9763149,0.139296592 C44.1708311,-0.0518420739 44.4826329,-0.0518571125 44.6771675,0.139262789 L65.6916134,20.7848311 C66.0855801,21.1718824 66.0911863,21.8050225 65.704135,22.1989893 C65.7000188,22.2031791 65.6958657,22.2073326 65.6916762,22.2114492 L44.677098,42.8607841 C44.4825957,43.0519059 44.1708242,43.0519358 43.9762853,42.8608513 L40.1545186,39.1069479 C39.9575152,38.9134427 39.9546793,38.5968729 40.1481845,38.3998695 C40.1502893,38.3977268 40.1524132,38.395603 40.1545562,38.3934985 L56.9937789,21.8567812 C57.1908028,21.6632968 57.193672,21.3467273 57.0001876,21.1497035 C56.9980647,21.1475418 56.9959223,21.1453995 56.9937605,21.1432767 L40.1545208,4.60825197 C39.9574869,4.41477773 39.9546013,4.09820839 40.1480756,3.90117456 C40.1501626,3.89904911 40.1522686,3.89694235 40.1543933,3.89485454 Z"
                                                    fill="#FFFFFF"
                                                ></path>
                                                <path
                                                    className="two"
                                                    d="M20.1543933,3.89485454 L23.9763149,0.139296592 C24.1708311,-0.0518420739 24.4826329,-0.0518571125 24.6771675,0.139262789 L45.6916134,20.7848311 C46.0855801,21.1718824 46.0911863,21.8050225 45.704135,22.1989893 C45.7000188,22.2031791 45.6958657,22.2073326 45.6916762,22.2114492 L24.677098,42.8607841 C24.4825957,43.0519059 24.1708242,43.0519358 23.9762853,42.8608513 L20.1545186,39.1069479 C19.9575152,38.9134427 19.9546793,38.5968729 20.1481845,38.3998695 C20.1502893,38.3977268 20.1524132,38.395603 20.1545562,38.3934985 L36.9937789,21.8567812 C37.1908028,21.6632968 37.193672,21.3467273 37.0001876,21.1497035 C36.9980647,21.1475418 36.9959223,21.1453995 36.9937605,21.1432767 L20.1545208,4.60825197 C19.9574869,4.41477773 19.9546013,4.09820839 20.1480756,3.90117456 C20.1501626,3.89904911 20.1522686,3.89694235 20.1543933,3.89485454 Z"
                                                    fill="#FFFFFF"
                                                ></path>
                                                <path
                                                    className="three"
                                                    d="M0.154393339,3.89485454 L3.97631488,0.139296592 C4.17083111,-0.0518420739 4.48263286,-0.0518571125 4.67716753,0.139262789 L25.6916134,20.7848311 C26.0855801,21.1718824 26.0911863,21.8050225 25.704135,22.1989893 C25.7000188,22.2031791 25.6958657,22.2073326 25.6916762,22.2114492 L4.67709797,42.8607841 C4.48259567,43.0519059 4.17082418,43.0519358 3.97628526,42.8608513 L0.154518591,39.1069479 C-0.0424848215,38.9134427 -0.0453206733,38.5968729 0.148184538,38.3998695 C0.150289256,38.3977268 0.152413239,38.395603 0.154556228,38.3934985 L16.9937789,21.8567812 C17.1908028,21.6632968 17.193672,21.3467273 17.0001876,21.1497035 C16.9980647,21.1475418 16.9959223,21.1453995 16.9937605,21.1432767 L0.15452076,4.60825197 C-0.0425130651,4.41477773 -0.0453986756,4.09820839 0.148075568,3.90117456 C0.150162624,3.89904911 0.152268631,3.89694235 0.154393339,3.89485454 Z"
                                                    fill="#FFFFFF"
                                                ></path>
                                            </g>
                                        </svg>
                                    </span>
                                </button>

                                {/* Contact Us */}
                                <button
                                    onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
                                    className="group relative px-10 py-5 bg-black/40 backdrop-blur-xl border-2 border-white/20 text-white rounded-2xl font-bold text-lg sm:text-xl transition-all duration-500
                             hover:scale-105 hover:bg-white/10 shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                                >
                                    <div
                                        className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-border opacity-0 group-hover:opacity-100 transition-opacity duration-500 [mask-image:linear-gradient(white,white)] [-webkit-mask-image:linear-gradient(white,white)]"
                                        style={{ transform: "scale(1.02)" }}
                                    ></div>
                                    <div className="relative z-10 flex items-center gap-3">
                                        <div className="relative">
                                            <Phone className="w-6 h-6 text-cyan-400 group-hover:text-white transition-colors group-hover:rotate-12 duration-300" />
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        </div>
                                        <span className="text-white/90 group-hover:text-white transition-colors cinzel-decorative-bold">CONTACT US</span>
                                        <div className="flex -space-x-2 ml-1">
                                            <MessageCircle className="w-4 h-4 text-purple-400 group-hover:scale-125 transition-transform" />
                                            <Sparkle className="w-4 h-4 text-yellow-500 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="absolute top-1/2 left-4 w-8 h-8 bg-cyan-500/10 blur-xl rounded-full group-hover:h-12 group-hover:w-12 transition-all"></div>
                                    <div className="absolute bottom-2 right-4 w-6 h-6 bg-purple-500/10 blur-xl rounded-full group-hover:h-10 group-hover:w-10 transition-all"></div>
                                </button>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-2 sm:gap-4 px-2 sm:px-0 stats-row">

                                {/* Stat 1 — Save Up To */}
                                <div className="group relative rounded-xl sm:rounded-2xl border border-yellow-500/30 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(251,191,36,0.4)]">
                                    <div className="bg-black/60 p-2 sm:p-4 flex flex-col items-center text-center h-full">
                                        <div className="text-lg sm:text-3xl font-black bg-gradient-to-r from-yellow-200 via-orange-200 to-yellow-300 bg-clip-text text-transparent leading-none mb-1">75%</div>
                                        <div className="text-[7px] sm:text-xs font-bold tracking-wider text-yellow-100/80 uppercase">Save Up To</div>
                                    </div>
                                </div>

                                {/* Stat 2 — 24/7 Support */}
                                <div className="group relative rounded-xl sm:rounded-2xl border border-blue-500/30 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(99,179,237,0.4)]">
                                    <div className="bg-black/60 p-2 sm:p-4 flex flex-col items-center text-center h-full">
                                        <div className="text-lg sm:text-3xl font-black bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-300 bg-clip-text text-transparent leading-none mb-1">24/7</div>
                                        <div className="text-[7px] sm:text-xs font-bold tracking-wider text-cyan-100/80 uppercase">Support</div>
                                    </div>
                                </div>

                                {/* Stat 3 — Happy Customers */}
                                <div className="group relative rounded-xl sm:rounded-2xl border border-pink-500/30 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(236,72,153,0.4)]">
                                    <div className="relative bg-black/60 p-2 sm:p-4 flex flex-col items-center text-center h-full">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                                        <div className="text-lg sm:text-3xl font-black bg-gradient-to-r from-pink-200 via-fuchsia-200 to-purple-200 bg-clip-text text-transparent leading-none mb-1">1k+</div>
                                        <div className="text-[7px] sm:text-xs font-bold tracking-wider text-pink-100/80 uppercase">Customers</div>
                                    </div>
                                </div>
                            </div>

                            {/* Sponsored Section */}
                            <div className="mt-8 sm:mt-10 relative group">
                                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-xl p-3 transition-all duration-300 hover:scale-[1.02] hover:border-white/20 hover:shadow-lg">
                                    {/* Animated background gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-x" />

                                    <div className="relative z-10 flex items-center gap-4">
    {/* We Accept Badge */}
    <div className="flex-shrink-0">
        <img
            src="/images/we-accept-badge.png"
            alt="We Accept"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shadow-md"
            onClick={(e) => e.preventDefault()}
            style={{ pointerEvents: 'none' }}
        />
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0 overflow-hidden">
        {/* Desktop: Single line layout */}
        <div className="hidden lg:flex items-center gap-2 overflow-hidden">
            <img
                src="/images/bkash-logo.webp"
                alt="bKash"
                className="w-14 h-14 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0 payment-logo"
                onClick={(e) => e.preventDefault()}
                style={{ pointerEvents: 'none' }}
            />
            <img
                src="/images/nagad-logo.webp"
                alt="Nagad"
                className="w-14 h-14 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0 payment-logo"
                onClick={(e) => e.preventDefault()}
                style={{ pointerEvents: 'none' }}
            />
            <img
                src="/images/rocket-logo.webp"
                alt="Rocket"
                className="w-14 h-14 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0 payment-logo"
                onClick={(e) => e.preventDefault()}
                style={{ pointerEvents: 'none' }}
            />
            <img
                src="/images/binance-logo.webp"
                alt="Binance"
                className="w-14 h-14 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0 payment-logo"
                onClick={(e) => e.preventDefault()}
                style={{ pointerEvents: 'none' }}
            />
            <img
                src="/images/bitget-logo.webp"
                alt="Bitget"
                className="w-14 h-14 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0 payment-logo"
                onClick={(e) => e.preventDefault()}
                style={{ pointerEvents: 'none' }}
            />
            <img
                src="/images/bybit-logo.webp"
                alt="Bybit"
                className="w-14 h-14 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0 payment-logo"
                onClick={(e) => e.preventDefault()}
                style={{ pointerEvents: 'none' }}
            />
            <img
                src="/images/mexc-logo.webp"
                alt="MEXC"
                className="w-14 h-14 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0 payment-logo"
                onClick={(e) => e.preventDefault()}
                style={{ pointerEvents: 'none' }}
            />
            <img
                src="/images/metamask-logo.webp"
                alt="MetaMask"
                className="w-14 h-14 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0 payment-logo"
                onClick={(e) => e.preventDefault()}
                style={{ pointerEvents: 'none' }}
            />
            <img
                src="/images/btc-logo.webp"
                alt="Bitcoin"
                className="w-14 h-14 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0 payment-logo"
                onClick={(e) => e.preventDefault()}
                style={{ pointerEvents: 'none' }}
            />
        </div>

        {/* Mobile: Single line marquee */}
        <div className="lg:hidden overflow-hidden w-full">
            <div className="flex animate-marquee-right-to-left">
                <div className="flex gap-2 items-center">
                    <img
                        src="/images/bkash-logo.webp"
                        alt="bKash"
                        className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0"
                        onClick={(e) => e.preventDefault()}
                        style={{ pointerEvents: 'none' }}
                    />
                    <img
                        src="/images/nagad-logo.webp"
                        alt="Nagad"
                        className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0"
                        onClick={(e) => e.preventDefault()}
                        style={{ pointerEvents: 'none' }}
                    />
                    <img
                        src="/images/rocket-logo.webp"
                        alt="Rocket"
                        className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0"
                        onClick={(e) => e.preventDefault()}
                        style={{ pointerEvents: 'none' }}
                    />
                    <img
                        src="/images/binance-logo.webp"
                        alt="Binance"
                        className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0"
                        onClick={(e) => e.preventDefault()}
                        style={{ pointerEvents: 'none' }}
                    />
                    <img
                        src="/images/bitget-logo.webp"
                        alt="Bitget"
                        className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0"
                        onClick={(e) => e.preventDefault()}
                        style={{ pointerEvents: 'none' }}
                    />
                    <img
                        src="/images/bybit-logo.webp"
                        alt="Bybit"
                        className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0"
                        onClick={(e) => e.preventDefault()}
                        style={{ pointerEvents: 'none' }}
                    />
                    <img
                        src="/images/mexc-logo.webp"
                        alt="MEXC"
                        className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0"
                        onClick={(e) => e.preventDefault()}
                        style={{ pointerEvents: 'none' }}
                    />
                    <img
                        src="/images/metamask-logo.webp"
                        alt="MetaMask"
                        className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0"
                        onClick={(e) => e.preventDefault()}
                        style={{ pointerEvents: 'none' }}
                    />
                    <img
                        src="/images/btc-logo.webp"
                        alt="Bitcoin"
                        className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0"
                        onClick={(e) => e.preventDefault()}
                        style={{ pointerEvents: 'none' }}
                    />
                    {/* Duplicate for seamless loop */}
                    <img
                        src="/images/bkash-logo.webp"
                        alt="bKash"
                        className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0"
                        onClick={(e) => e.preventDefault()}
                        style={{ pointerEvents: 'none' }}
                    />
                    <img
                        src="/images/nagad-logo.webp"
                        alt="Nagad"
                        className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0"
                        onClick={(e) => e.preventDefault()}
                        style={{ pointerEvents: 'none' }}
                    />
                    <img
                        src="/images/rocket-logo.webp"
                        alt="Rocket"
                        className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0"
                        onClick={(e) => e.preventDefault()}
                        style={{ pointerEvents: 'none' }}
                    />
                    <img
                        src="/images/binance-logo.webp"
                        alt="Binance"
                        className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0"
                        onClick={(e) => e.preventDefault()}
                        style={{ pointerEvents: 'none' }}
                    />
                    <img
                        src="/images/bitget-logo.webp"
                        alt="Bitget"
                        className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0"
                        onClick={(e) => e.preventDefault()}
                        style={{ pointerEvents: 'none' }}
                    />
                    <img
                        src="/images/bybit-logo.webp"
                        alt="Bybit"
                        className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0"
                        onClick={(e) => e.preventDefault()}
                        style={{ pointerEvents: 'none' }}
                    />
                    <img
                        src="/images/mexc-logo.webp"
                        alt="MEXC"
                        className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0"
                        onClick={(e) => e.preventDefault()}
                        style={{ pointerEvents: 'none' }}
                    />
                    <img
                        src="/images/metamask-logo.webp"
                        alt="MetaMask"
                        className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0"
                        onClick={(e) => e.preventDefault()}
                        style={{ pointerEvents: 'none' }}
                    />
                    <img
                        src="/images/btc-logo.webp"
                        alt="Bitcoin"
                        className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-md flex-shrink-0"
                        onClick={(e) => e.preventDefault()}
                        style={{ pointerEvents: 'none' }}
                    />
                </div>
            </div>
        </div>
    </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* ── END LEFT SIDE ── */}

                        {/* ── RIGHT SIDE — Features Panel ── */}
                        <div className="w-full lg:w-[400px] xl:w-[460px] flex-shrink-0 hero-right-panel">
                            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-900/40 backdrop-blur-xl bg-black/30">

                                {/* Animated top accent bar */}
                                <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-pink-500 via-yellow-400 to-cyan-400 animate-gradient-x" />

                                {/* Panel Header */}
                                <div className="px-5 pt-5 pb-3 border-b border-white/10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                                                <Sparkle className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-sm leading-tight">Why Choose Us?</p>
                                                <p className="text-white/50 text-[10px]">Premium features included</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Feature Cards Grid */}
                                <div className="p-3 lg:p-3.5 xl:p-4 grid grid-cols-2 gap-2.5 lg:gap-3 feature-cards-grid">

                                    {/* Instant Delivery */}
                                    <div className="group relative rounded-2xl p-2.5 lg:p-3 xl:p-3.5 bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-400/20 hover:border-yellow-400/50 hover:bg-yellow-500/15 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-yellow-500/20 cursor-default overflow-hidden feature-card">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                        <div className="relative z-10">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-2.5 shadow-lg shadow-yellow-500/30 group-hover:scale-110 transition-transform duration-300">
                                                <Zap className="w-[18px] h-[18px] text-white" />
                                            </div>
                                            <p className="text-white font-bold text-xs leading-tight mb-1 feature-title">Instant Delivery</p>
                                            <p className="text-white/50 text-[10px] leading-snug feature-desc">Get your service within minutes of purchase</p>
                                            <div className="mt-2 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                                                <span className="text-yellow-400/80 text-[9px] font-semibold">AUTO-DELIVER</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Secure Payment */}
                                    <div className="group relative rounded-2xl p-2.5 lg:p-3 xl:p-3.5 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-400/20 hover:border-green-400/50 hover:bg-green-500/15 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-green-500/20 cursor-default overflow-hidden feature-card">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                        <div className="relative z-10">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-2.5 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                                                <Shield className="w-[18px] h-[18px] text-white" />
                                            </div>
                                            <p className="text-white font-bold text-xs leading-tight mb-1 feature-title">Secure Payment</p>
                                            <p className="text-white/50 text-[10px] leading-snug feature-desc">bKash, Nagad, Crypto & more</p>
                                            <div className="mt-2 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                                <span className="text-green-400/80 text-[9px] font-semibold">256-BIT SSL</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 24/7 Support */}
                                    <div className="group relative rounded-2xl p-2.5 lg:p-3 xl:p-3.5 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-400/20 hover:border-blue-400/50 hover:bg-blue-500/15 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-blue-500/20 cursor-default overflow-hidden feature-card">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                        <div className="relative z-10">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center mb-2.5 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                                                <Headset className="w-[18px] h-[18px] text-white" />
                                            </div>
                                            <p className="text-white font-bold text-xs leading-tight mb-1 feature-title">24/7 Live Support</p>
                                            <p className="text-white/50 text-[10px] leading-snug feature-desc">Real human support anytime you need</p>
                                            <div className="mt-2 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                                <span className="text-blue-400/80 text-[9px] font-semibold">ALWAYS ONLINE</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Best Prices */}
                                    <div className="group relative rounded-2xl p-2.5 lg:p-3 xl:p-3.5 bg-gradient-to-br from-pink-500/10 to-fuchsia-500/5 border border-pink-400/20 hover:border-pink-400/50 hover:bg-pink-500/15 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-pink-500/20 cursor-default overflow-hidden feature-card">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-400/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                        <div className="relative z-10">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-fuchsia-500 flex items-center justify-center mb-2.5 shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform duration-300">
                                                <Wallet className="w-[18px] h-[18px] text-white" />
                                            </div>
                                            <p className="text-white font-bold text-xs leading-tight mb-1 feature-title">Best Prices</p>
                                            <p className="text-white/50 text-[10px] leading-snug feature-desc">Up to 75% off retail price guaranteed</p>
                                            <div className="mt-2 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                                                <span className="text-pink-400/80 text-[9px] font-semibold">PRICE MATCH</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Global Access */}
                                    <div className="group relative rounded-2xl p-2.5 lg:p-3 xl:p-3.5 bg-gradient-to-br from-purple-500/10 to-violet-500/5 border border-purple-400/20 hover:border-purple-400/50 hover:bg-purple-500/15 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-purple-500/20 cursor-default overflow-hidden feature-card">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                        <div className="relative z-10">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center mb-2.5 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                                                <Globe className="w-[18px] h-[18px] text-white" />
                                            </div>
                                            <p className="text-white font-bold text-xs leading-tight mb-1 feature-title">Global Access</p>
                                            <p className="text-white/50 text-[10px] leading-snug feature-desc">Works worldwide, no restrictions</p>
                                            <div className="mt-2 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                                                <span className="text-purple-400/80 text-[9px] font-semibold">WORLDWIDE</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Premium Quality */}
                                    <div className="group relative rounded-2xl p-2.5 lg:p-3 xl:p-3.5 bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-400/20 hover:border-orange-400/50 hover:bg-orange-500/15 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-orange-500/20 cursor-default overflow-hidden feature-card">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                        <div className="relative z-10">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mb-2.5 shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                                                <Star className="w-[18px] h-[18px] text-white fill-white" />
                                            </div>
                                            <p className="text-white font-bold text-xs leading-tight mb-1 feature-title">Premium Quality</p>
                                            <p className="text-white/50 text-[10px] leading-snug feature-desc">100% genuine accounts & subscriptions</p>
                                            <div className="mt-2 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                                                <span className="text-orange-400/80 text-[9px] font-semibold">VERIFIED</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Live Order Ticker */}
                                <div className="mx-4 mb-4 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/5">
                                        <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-400/40 rounded-full px-2.5 py-1">
                                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                            <span className="text-green-300 text-[9px] font-bold tracking-wider">LIVE</span>
                                        </div>
                                        <span className="text-white/70 text-[10px] font-semibold tracking-wider uppercase">Recent Orders</span>
                                    </div>
                                    <LiveOrderTicker orders={liveOrders} height={72} interval={4000} />
                                </div>

                                {/* Trust Badges */}
                                <div className="px-4 pb-5">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1 flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 border border-white/10">
                                            <Lock className="w-4 h-4 text-green-400" />
                                            <span className="text-white/60 text-[9px] font-semibold text-center leading-tight">Secure<br />Checkout</span>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 border border-white/10">
                                            <CheckCircle2 className="w-4 h-4 text-blue-400" />
                                            <span className="text-white/60 text-[9px] font-semibold text-center leading-tight">Money-Back<br />Guarantee</span>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 border border-white/10">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            <span className="text-white/60 text-[9px] font-semibold text-center leading-tight">4.9★<br />Rated</span>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 border border-white/10">
                                            <Zap className="w-4 h-4 text-orange-400" />
                                            <span className="text-white/60 text-[9px] font-semibold text-center leading-tight">Instant<br />Delivery</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* ── END RIGHT SIDE ── */}

                    </div>
                </div>
            </div>

            {/* PromoMarquee pinned to bottom */}
            <div className="absolute bottom-0 left-0 w-full z-20">
                <PromoMarquee />
            </div>
        </section>
    );
}
