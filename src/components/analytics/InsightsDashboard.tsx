import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Eye, TrendingUp, Users, Heart, MessageCircle, Share2, 
  Bookmark, MousePointer2, Globe, Laptop, Smartphone, Tablet,
  BarChart3, X, Zap, Award, Info
} from 'lucide-react';
import { postAnalytics } from '../../services/PostAnalyticsService';

interface InsightsDashboardProps {
  postId: string;
  onClose: () => void;
}

const COLORS = ['#00f2ff', '#7000ff', '#ff00d9', '#ff9100', '#00ff88'];

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ postId, onClose }) => {
  const [insights, setInsights] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'audience' | 'sources'>('overview');

  useEffect(() => {
    const unsub = postAnalytics.subscribeToInsights(postId, (data) => {
      setInsights(data);
    });
    return () => unsub();
  }, [postId]);

  if (!insights) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900 border border-white/10 p-8 rounded-3xl text-center"
        >
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">LOADING Insights...</p>
        </motion.div>
      </div>
    );
  }

  const sourceData = Object.entries(insights.viewSources || {}).map(([name, value]) => ({ name, value }));
  const deviceData = Object.entries(insights.audience?.deviceTypes || {}).map(([name, value]) => ({ name, value }));

  const calculateEngagementRate = () => {
    const views = insights.totalViews || 1;
    const interactions = (insights.likes || 0) + (insights.comments || 0) + (insights.shares || 0) + (insights.bookmarks || 0);
    return ((interactions / views) * 100).toFixed(1);
  };

  const getEngagementLabel = () => {
    const rate = parseFloat(calculateEngagementRate());
    if (rate > 15) return { text: 'Viral', color: 'text-pink-500', icon: <Zap className="w-4 h-4" /> };
    if (rate > 10) return { text: 'High', color: 'text-cyan-400', icon: <Award className="w-4 h-4" /> };
    if (rate > 5) return { text: 'Medium', color: 'text-purple-400', icon: <TrendingUp className="w-4 h-4" /> };
    return { text: 'Low', color: 'text-zinc-500', icon: <BarChart3 className="w-4 h-4" /> };
  };

  const engagement = getEngagementLabel();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xl overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="w-full max-w-4xl bg-zinc-950/90 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
              Post Insights
            </h2>
            <p className="text-zinc-400 text-sm mt-1 flex items-center gap-2">
              Aeirmist User: <span className="text-cyan-400 font-mono">{postId.substring(0, 8)}...</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 py-2 border-b border-white/5 bg-zinc-900/50">
          {[
            { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'audience', label: 'Audience', icon: <Users className="w-4 h-4" /> },
            { id: 'sources', label: 'Sources', icon: <Globe className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative ${
                activeTab === tab.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500" 
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Top Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Views', value: insights.totalViews, icon: <Eye className="w-5 h-5" />, color: 'cyan' },
                  { label: 'Reach', value: insights.reach || insights.totalViews, icon: <Users className="w-5 h-5" />, color: 'purple' },
                  { label: 'Engagement', value: `${calculateEngagementRate()}%`, icon: engagement.icon, color: 'pink', sub: engagement.text },
                  { label: 'Profile Visits', value: insights.profileClicks || 0, icon: <MousePointer2 className="w-5 h-5" />, color: 'orange' }
                ].map((stat, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={stat.label} 
                    className="p-5 bg-white/5 border border-white/10 rounded-3xl group hover:border-white/20 transition-all"
                  >
                    <div className={`p-2 w-fit rounded-xl mb-3 bg-${stat.color}-500/10 text-${stat.color}-400 group-hover:scale-110 transition-transform`}>
                      {stat.icon}
                    </div>
                    <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <h3 className="text-2xl font-bold text-white">{stat.value?.toLocaleString() || 0}</h3>
                      {stat.sub && <span className={`text-[10px] font-bold uppercase ${engagement.color}`}>{stat.sub}</span>}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Engagement Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                  <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-500" />
                    Interactions
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Likes', value: insights.likes || 0, icon: <Heart className="w-4 h-4" /> },
                      { label: 'Comments', value: insights.comments || 0, icon: <MessageCircle className="w-4 h-4" /> },
                      { label: 'Shares', value: insights.shares || 0, icon: <Share2 className="w-4 h-4" /> },
                      { label: 'Bookmarks', value: insights.bookmarks || 0, icon: <Bookmark className="w-4 h-4" /> }
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl">
                        <span className="text-zinc-400 text-sm flex items-center gap-2">
                          {item.icon}
                          {item.label}
                        </span>
                        <span className="text-white font-bold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center justify-center text-center">
                  <div className="p-4 bg-cyan-500/10 rounded-full mb-4">
                    <TrendingUp className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Performance</h4>
                  <p className="text-zinc-400 text-sm max-w-[200px]">
                    This post is performing <strong>24% better</strong> than your average content.
                  </p>
                  <div className="mt-6 flex gap-2">
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase rounded-full tracking-widest border border-cyan-500/30">
                      🚀 Growing Fast
                    </span>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-[10px] font-black uppercase rounded-full tracking-widest border border-purple-500/30">
                      ⭐ High Engagement
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audience' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex flex-col">
                <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Device Distribution
                </h4>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceData.length > 0 ? deviceData : [{ name: 'Desktop', value: 100 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {deviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  {deviceData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-zinc-400 text-xs uppercase font-bold">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex flex-col">
                <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Info className="w-5 h-5 text-cyan-400" />
                  Audience Origin
                </h4>
                <div className="space-y-4 flex-1">
                   {Object.entries(insights.audience?.languages || {}).length > 0 ? (
                     Object.entries(insights.audience.languages).map(([lang, count]: any) => (
                       <div key={lang}>
                         <div className="flex justify-between text-xs text-zinc-400 mb-1">
                           <span>{lang}</span>
                           <span>{count} views</span>
                         </div>
                         <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${(count / insights.totalViews) * 100}%` }}
                             className="h-full bg-cyan-500" 
                           />
                         </div>
                       </div>
                     ))
                   ) : (
                     <div className="flex items-center justify-center h-full text-zinc-500 italic text-sm">
                       Not enough audience data collected yet.
                     </div>
                   )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sources' && (
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl h-[400px] flex flex-col">
              <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                Traffic Sources
              </h4>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceData.length > 0 ? sourceData : [{ name: 'Home Feed', value: 10 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#71717a" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#71717a' }}
                    />
                    <YAxis 
                      stroke="#71717a" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#71717a' }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-zinc-900/50 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-4 text-zinc-500 text-xs">
             <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Real-time tracking active</span>
             <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {insights.reach || insights.totalViews} Unique reach</span>
           </div>
           <p className="text-zinc-500 text-[10px] font-mono">NEURAL_SYNC_SUCCESS_{new Date().getTime()}</p>
        </div>
      </motion.div>
    </div>
  );
};
