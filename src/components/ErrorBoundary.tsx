import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, RefreshCw, Radio, Zap } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Log activity failure to console for developer diagnostics
    console.error('Application Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-aeirmist-bg z-[9999] flex items-center justify-center p-6 overflow-hidden font-sans">
          {/* Ambient Background Aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-aeirmist-magenta/5 blur-[150px] pointer-events-none" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-aeirmist-cyan/5 blur-[100px] pointer-events-none" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg glass-panel p-8 md:p-12 relative overflow-hidden text-center space-y-8"
          >
            {/* Warning Icon with Message */}
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-3xl bg-aeirmist-magenta/10 flex items-center justify-center text-aeirmist-magenta mx-auto border border-aeirmist-magenta/20">
                <AlertTriangle size={40} />
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-aeirmist-magenta/20 blur-xl rounded-full -z-10"
              />
            </div>

            <div className="space-y-4">
              <h1 className="text-2xl md:text-3xl font-display font-black uppercase tracking-[0.2em] text-white leading-tight">
                Digital <span className="text-aeirmist-magenta">Desync</span>
              </h1>
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-white/40 max-w-md mx-auto leading-relaxed">
                An unexpected error occurred. Your Data are safe, but the current stream needs a manual reset.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-left font-mono text-[10px] text-aeirmist-cyan/60 overflow-hidden">
              <p className="uppercase tracking-widest font-black mb-2 flex items-center gap-2 text-aeirmist-magenta">
                <Radio size={12} /> Diagnostic Signature:
              </p>
              <div className="line-clamp-3 opacity-80 break-all select-all cursor-text">
                {this.state.error?.toString() || 'CRITICAL_ERROR'}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button 
                onClick={this.handleReset}
                className="px-8 py-5 rounded-2xl bg-gradient-to-r from-aeirmist-cyan to-aeirmist-magenta text-black font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,242,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <RefreshCw size={16} />
                Refresh Page
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="px-8 py-5 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-white/10 transition-all hover:text-white"
              >
                <Zap size={16} />
                Clean Reboot
              </button>
            </div>

            {/* Decorative Telemetry */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <div className="text-[8px] font-black text-white tracking-[1em] uppercase">SYSTEM_CRITICAL_v4.8</div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
