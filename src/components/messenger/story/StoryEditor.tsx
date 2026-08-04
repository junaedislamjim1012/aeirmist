import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Camera } from 'lucide-react';

export const StoryEditor = ({ onClose }: { onClose: () => void }) => {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
        >
            {/* Top Toolbar */}
            <div className="absolute top-0 left-0 right-0 p-4 z-10 text-white">
                <button onClick={onClose}><ArrowLeft size={24} /></button>
            </div>

            {/* Camera Preview / Placeholder */}
            <div className="flex-1 bg-neutral-900 flex items-center justify-center">
                <span className="text-white/20">Camera Preview</span>
            </div>

            {/* Bottom Camera Trigger */}
            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center z-10">
                <button className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center">
                    <Camera size={32} className="text-white" />
                </button>
            </div>
        </motion.div>
    );
};
