import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

function SuccessContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams?.get('order_id');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      navigate('/');
    }
  }, [countdown, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <CheckCircle className="w-20 h-20 mx-auto text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Payment Successful!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Thank you for your purchase. Your order has been confirmed.
        </p>
        {orderId && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Order ID: <span className="font-mono font-medium">{orderId}</span>
          </p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
          Redirecting to home in {countdown} seconds...
        </p>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
