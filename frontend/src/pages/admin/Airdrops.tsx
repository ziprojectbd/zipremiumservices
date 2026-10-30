import { useState, useMemo } from 'react';
import { Gift, Timer, Users, Trash2, Edit, Plus, ExternalLink } from 'lucide-react';
import type { Airdrop } from '../../types';
import EnhancedAlert from '../../components/public/EnhancedAlert';
import type { AlertConfig } from '../../components/public/EnhancedAlert';

export default function AdminAirdrops() {
  const [airdrops, setAirdrops] = useState<Airdrop[]>([
    {
      id: 1,
      title: 'Premium Welcome Pack',
      description: 'Get a chance to win Netflix, Spotify, and YouTube Premium for 1 month.',
      reward: '$50 Value',
      participants: '1.2k',
      timeLeft: '2 Days',
      type: 'Free',
      color: 'from-blue-500 to-indigo-600',
      status: 'live',
    },
    {
      id: 2,
      title: 'Social Growth Booster',
      description: '500 real Facebook followers for 10 lucky winners!',
      reward: '500 Followers',
      participants: '3.5k',
      timeLeft: '5 Days',
      type: 'Referral',
      color: 'from-blue-500 to-cyan-600',
      status: 'live',
    },
    {
      id: 3,
      title: 'Crypto Starter Kit',
      description: 'Join our community and get a share of $1,000 USDT.',
      reward: '$1,000 USDT',
      participants: '10k',
      timeLeft: '12 Hours',
      type: 'Community',
      color: 'from-yellow-400 to-orange-500',
      status: 'live',
    },
    {
      id: 4,
      title: 'Early Bird Access',
      description: 'Exclusive access to new products before they hit the shop.',
      reward: 'Beta Access',
      participants: '800',
      timeLeft: '0',
      type: 'Exclusive',
      color: 'from-emerald-500 to-teal-600',
      status: 'ended',
    },
  ]);

  const [filter, setFilter] = useState<'all' | 'live' | 'ended' | 'upcoming'>('all');
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  const filteredAirdrops = useMemo(() => {
    if (filter === 'all') return airdrops;
    return airdrops.filter((a) => a.status === filter);
  }, [airdrops, filter]);

  const handleAddAirdrop = () => {
    setAlertConfig({ isOpen: true, type: 'info', title: 'Info', message: 'Add Airdrop Modal would open here (Admin UI)' });
  };

  const handleEditAirdrop = (airdrop: Airdrop) => {
    setAlertConfig({ isOpen: true, type: 'info', title: 'Info', message: `Editing airdrop: ${airdrop.title}` });
  };

  const handleDeleteAirdrop = (id: number) => {
    if (confirm('Are you sure you want to delete this airdrop?')) {
      setAirdrops((prev) => prev.filter((a) => a.id !== id));
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {alertConfig && <EnhancedAlert {...alertConfig} onClose={() => setAlertConfig(null)} />}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Airdrop Management</h2>
            <p className="text-gray-400 text-sm mt-1">Create and manage community reward events</p>
          </div>
          <button
            onClick={handleAddAirdrop}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add New Airdrop
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
          {['all', 'live', 'upcoming', 'ended'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredAirdrops.map((airdrop) => (
            <div
              key={airdrop.id}
              className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300"
            >
              {/* Header Preview */}
              <div
                className={`h-32 bg-gradient-to-br ${airdrop.color} relative p-4 flex flex-col justify-between`}
              >
                <div className="flex justify-between items-start">
                  <span
                    className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider backdrop-blur-md border ${
                      airdrop.status === 'live'
                        ? 'bg-green-500/20 border-green-500/30 text-green-400'
                        : airdrop.status === 'ended'
                          ? 'bg-red-500/20 border-red-500/30 text-red-400'
                          : 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                    }`}
                  >
                    {airdrop.status}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditAirdrop(airdrop)}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md text-white transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAirdrop(airdrop.id)}
                      className="p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-lg backdrop-blur-md text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-white/90">
                  <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-lg truncate">{airdrop.title}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-5 space-y-4">
                <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">{airdrop.description}</p>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Reward Pool</p>
                    <p className="text-blue-300 font-bold">{airdrop.reward}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Type</p>
                    <p className="text-white font-bold">{airdrop.type}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Users className="w-3.5 h-3.5" />
                    {airdrop.participants} participants
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                    <Timer className="w-3.5 h-3.5" />
                    {airdrop.timeLeft}
                  </div>
                </div>

                <button className="w-full py-2.5 rounded-xl border border-white/10 text-white text-sm font-bold hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                  View Live Page
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
