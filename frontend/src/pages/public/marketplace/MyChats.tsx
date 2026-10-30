import { useNavigate } from 'react-router-dom';
import { useShopContext } from '../../../store/ShopContext';
import { MessageCircle } from 'lucide-react';

export default function MyChats() {
  const navigate = useNavigate();
  const { isLoggedIn } = useShopContext();

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-gray-100">
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-lg border border-red-500/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Access Restricted</h2>
            <p className="text-slate-400 mb-6">Please sign in to view your chats.</p>
            <button
              onClick={() => navigate('/sign-in')}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-gray-100">
      <div className="min-h-[calc(100vh-140px)] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">My Chats</h1>
          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-12 text-center">
            <MessageCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Chats Yet</h3>
            <p className="text-slate-400">Your marketplace conversations will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
