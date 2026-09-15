import { useEffect, useRef, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { ShieldCheck } from 'lucide-react';

interface GoogleAuthButtonProps {
  /** Receives the Google ID token (credential) to exchange with the backend. */
  onSuccess: (credential: string) => void | Promise<void>;
  onError?: (message?: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  /** Shows a blocking overlay while the backend verifies the credential. */
  loading?: boolean;
  disabled?: boolean;
  label?: string;
}

// Google Identity Services renders a fixed-width iframe (200–400px) that cannot
// be styled directly, so the wrapper measures itself and feeds the width back.
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function GoogleAuthButton({
  onSuccess,
  onError,
  text = 'continue_with',
  loading = false,
  disabled = false,
  label = 'Secure sign-in powered by Google',
}: GoogleAuthButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const next = Math.floor(el.clientWidth);
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next)));
    };

    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      onError?.('Google did not return a credential. Please try again.');
      return;
    }
    await onSuccess(response.credential);
  };

  const handleError = (message?: string) => {
    onError?.(message || 'Google sign-in was cancelled or failed. Please try again.');
  };

  const blocked = loading || disabled;

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="group relative mx-auto flex w-full max-w-[400px] items-center justify-center"
      >
        {/* Soft brand glow so the fixed-size Google widget sits inside a
            premium surface instead of floating on the page. */}
        <div
          className="pointer-events-none absolute -inset-[3px] rounded-2xl bg-gradient-to-r from-purple-500/40 via-pink-500/30 to-cyan-500/40 opacity-60 blur-[6px] transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />

        <div
          className={`relative w-full rounded-2xl bg-[#0F0F1A] p-[3px] shadow-lg shadow-black/40 transition-all duration-300 ${
            blocked ? 'pointer-events-none' : ''
          }`}
        >
          <div
            className={`flex items-center justify-center rounded-[13px] bg-[#0F0F1A] py-0.5 transition-opacity duration-200 ${
              blocked ? 'opacity-30' : 'opacity-100'
            }`}
          >
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              theme="filled_black"
              size="large"
              text={text}
              shape="pill"
              logo_alignment="left"
              width={width}
            />
          </div>
        </div>

        {blocked && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-gray-900/70 backdrop-blur-[2px]">
            <div className="flex items-center gap-2.5 text-sm font-medium text-white">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {loading ? 'Verifying with Google...' : 'Please wait...'}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3.5 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/70" />
        {label}
      </div>
    </div>
  );
}
