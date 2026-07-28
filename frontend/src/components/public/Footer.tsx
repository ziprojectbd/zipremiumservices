import { Link } from 'react-router-dom';
import { Facebook, Instagram, Send } from 'lucide-react';
import { useAppSettings } from '../../store/AppSettingsContext';

interface FooterLink {
  name: string;
  href: string;
  _id?: string;
}

interface FooterSection {
  title: string;
  color: string;
  hoverColor: string;
  links: FooterLink[];
  _id?: string;
}

export default function Footer() {
  const { settings, loading } = useAppSettings();
  const footerData = settings.footer;
  const footerSections = (footerData as any)?.sections || [];
  const year = new Date().getFullYear();

  if (loading) {
    return (
      <footer className="relative text-gray-100 border-t border-gray-800/70 font-sans overflow-hidden bg-purple-950">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-purple-900/25 to-pink-900/30"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="h-32 bg-white/10 rounded-lg"></div>
              <div className="md:col-span-2 grid grid-cols-2 gap-8">
                <div className="h-32 bg-white/10 rounded-lg"></div>
                <div className="h-32 bg-white/10 rounded-lg"></div>
              </div>
              <div className="h-32 bg-white/10 rounded-lg"></div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative text-gray-100 border-t border-gray-800/70 font-sans overflow-hidden bg-purple-950">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-purple-900/25 to-pink-900/30"></div>

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8" style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}>

          <div className="md:col-span-1 space-y-4 flex flex-col items-center md:items-start text-center md:text-left" style={{ willChange: 'transform' }}>
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <img
                src="/zi-logo.svg"
                alt="ZI Premium Services Logo"
                width={40}
                height={40}
                className="rounded-lg shadow-lg"
              />
              <div className="flex flex-col">
                <h3 className="text-sm sm:text-base md:text-lg font-extrabold leading-tight whitespace-nowrap">
                  <span className="bg-gradient-to-r from-pink-500 via-amber-400 to-sky-500 bg-clip-text text-transparent drop-shadow-sm cinzel-decorative-black">
                    ZI PREMIUM SERVICES
                  </span>
                </h3>
                <span className="text-xs text-gray-200">
                  Your Digital Gateway
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-200 max-w-md leading-relaxed">
              Affordable access to global premium apps, VPNs, and social media growth with trusted local support.
            </p>
          </div>

          <div className="md:col-span-2 grid grid-cols-2 gap-8" style={{ willChange: 'transform' }}>
            {footerSections.map((section: FooterSection, sectionIndex: number) => (
              <div key={section._id || `section-${sectionIndex}`}>
                <p className={`uppercase text-xs tracking-widest font-extrabold mb-3 ${section.color}`}>
                  {section.title}
                </p>
                <ul className="space-y-1.5 text-gray-200 font-medium">
                  {section.links.map((link: FooterLink, linkIndex: number) => (
                    <li key={link._id || `link-${sectionIndex}-${linkIndex}`}>
                      <Link
                        to={link.href}
                        className={`transition-all duration-300 ease-out ${section.hoverColor} hover:underline underline-offset-2 hover:translate-x-1 block`}
                        style={{ willChange: 'transform, color' }}
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="md:col-span-1 space-y-4 text-left md:text-right" style={{ willChange: 'transform' }}>
            <div className="flex justify-start md:justify-end space-x-4 mb-4">
              <a href="https://www.facebook.com/zikrulislam.juwel" target="_blank" rel="noopener noreferrer" className="text-gray-200 hover:text-white transition-all duration-300 ease-out hover:scale-110" style={{ willChange: 'transform, color' }}>
                <Facebook size={20} />
              </a>
              <a href="https://www.instagram.com/zikrulislam.juwel" target="_blank" rel="noopener noreferrer" className="text-gray-200 hover:text-white transition-all duration-300 ease-out hover:scale-110" style={{ willChange: 'transform, color' }}>
                <Instagram size={20} />
              </a>
              <a href="https://t.me/trustedearningsources" target="_blank" rel="noopener noreferrer" className="text-gray-200 hover:text-white transition-all duration-300 ease-out hover:scale-110" style={{ willChange: 'transform, color' }}>
                <Send size={20} />
              </a>
            </div>
            <p className="text-sm font-bold">
              <span className="bg-gradient-to-r from-pink-500 via-amber-400 to-sky-500 bg-clip-text text-transparent drop-shadow-sm cinzel-decorative-black">
                &copy; {year} ZI PREMIUM SERVICES
              </span>
              <span className="block text-gray-300 font-normal">All rights reserved.</span>
            </p>
            <p className="text-sm text-gray-200">
              Crafted by{" "}
              <a
                href="https://t.me/zikrulislamjuwel"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400 hover:brightness-125 transition-all duration-300 ease-out underline-offset-2 hover:underline hover:scale-105"
                style={{ willChange: 'transform, filter, color' }}
              >
                MD ZIKRUL ISLAM
              </a>
            </p>
            <p className="text-xs text-gray-300">
              Global Digital Services, Based in Bangladesh
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800/80">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-300 font-medium">
            <Link to="/about-us" className="hover:text-white hover:underline underline-offset-2 transition-all duration-300 ease-out">
              About Us
            </Link>
            <Link to="/privacy-policy" className="hover:text-white hover:underline underline-offset-2 transition-all duration-300 ease-out">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="hover:text-white hover:underline underline-offset-2 transition-all duration-300 ease-out">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-gray-300 tracking-wider font-semibold">
          Secure Payments · Fast Delivery · 24/7 Support
        </div>
      </div>
    </footer>
  );
}
