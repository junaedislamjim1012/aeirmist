import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, ShieldAlert, HeartHandshake, HelpCircle } from 'lucide-react';

const HelpSettings: React.FC = () => {
  const navigate = useNavigate();

  const links = [
    {
      label: 'Community Guidelines',
      desc: 'Standards for safe & respectful conduct',
      icon: <HeartHandshake className="text-aeirmist-cyan" size={16} />,
      path: '/community-guidelines',
    },
    {
      label: 'Terms of Service',
      desc: 'Core legal agreement & platform rules',
      icon: <FileText className="text-aeirmist-magenta" size={16} />,
      path: '/community-guidelines', // Temporarily linked per request instructions
      isTemp: true,
    },
    {
      label: 'Privacy Policy',
      desc: 'How we protect & manage your data',
      icon: <ShieldAlert className="text-aeirmist-lime" size={16} />,
      path: '/community-guidelines', // Temporarily linked per request instructions
      isTemp: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Introduction block */}
      <div className="p-6 rounded-[2rem] bg-white/[0.01] border border-white/5 space-y-3">
        <div className="flex items-center gap-3">
          <HelpCircle className="text-aeirmist-cyan" size={18} />
          <h4 className="text-xs font-bold uppercase tracking-widest text-white">Grid Assistance Hub</h4>
        </div>
        <p className="text-[10px] text-white/40 leading-relaxed">
          Access core platform documentation, guidelines, and policies to use the platform safely.
        </p>
      </div>

      {/* Styled settings list */}
      <div className="space-y-3">
        {links.map((link, idx) => (
          <div
            key={idx}
            onClick={() => navigate(link.path)}
            className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 group-hover:scale-110 transition-transform">
                {link.icon}
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-white/80 group-hover:text-white">
                  {link.label}
                  {link.isTemp && (
                    <span className="ml-2 text-[8px] font-mono text-white/20 uppercase tracking-normal">
                      (Temp)
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-white/30 lowercase italic mt-0.5">
                  {link.desc}
                </div>
              </div>
            </div>
            <ChevronRight size={14} className="text-white/20 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HelpSettings;
