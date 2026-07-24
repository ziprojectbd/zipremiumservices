import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/#products', label: 'Services' },
  { href: '/airdrop', label: 'Airdrop' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/my-orders', label: 'My Orders' },
  { href: '/about-us', label: 'About Us' },
  { href: '/contact-us', label: 'Contact Us' },
];

export default function SiteNavigation({ className = '' }: { className?: string }) {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href.includes('#')) return false;
    return location.pathname === href;
  };

  return (
    <nav className={`flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none ${className}`}>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          to={link.href}
          className={`relative group px-3 sm:px-5 py-1.5 sm:py-2 text-sm sm:text-base font-medium rounded-lg whitespace-nowrap transition-all duration-500 overflow-hidden ${
            isActive(link.href)
              ? 'text-purple-200'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          <div className={`absolute inset-0 transition-all duration-500 ${isActive(link.href) ? 'bg-purple-500/20' : 'bg-transparent group-hover:bg-purple-500/10'}`} />

          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none hidden sm:block">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-shimmer-fast" />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-shimmer-fast delay-75" />
          </div>

          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-purple-500 rounded-t-full transition-all duration-500 shadow-[0_0_15px_rgba(168,85,247,1)] ${isActive(link.href) ? 'w-6 opacity-100' : 'w-0 opacity-0 group-hover:w-4 group-hover:opacity-100'}`} />

          <span className="relative z-10">{link.label}</span>
        </Link>
      ))}
    </nav>
  );
}
