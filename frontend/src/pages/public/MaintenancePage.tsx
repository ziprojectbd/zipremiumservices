import { useEffect, useState } from 'react';
import { Wrench, AlertTriangle } from 'lucide-react';

interface MaintenancePageProps {
  message?: string;
}

export default function MaintenancePage({ message }: MaintenancePageProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 text-center">
        {/* Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center animate-pulse">
            <Wrench className="w-12 h-12 text-yellow-400" />
          </div>
          <div className="absolute -top-2 -right-2">
            <div className="w-8 h-8 bg-orange-500/30 rounded-full flex items-center justify-center animate-bounce">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-300 to-orange-400 text-transparent bg-clip-text">
          Under Maintenance
        </h1>

        {/* Message */}
        <p className="text-lg text-gray-300 max-w-md mb-2">
          {message || 'We are currently performing scheduled maintenance.'}
        </p>
        <p className="text-gray-400 max-w-md">
          We will be back shortly
          <span className="inline-block w-8 text-left text-yellow-400 font-mono">{dots}</span>
        </p>

        {/* Divider */}
        <div className="w-16 h-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full my-8" />

        {/* Status info */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          Scheduled maintenance in progress
        </div>
      </div>
    </div>
  );
}
