import React from 'react';
import { PostStudio } from './post_composer/PostStudio';

export const CreatePost = ({ onOpenChange }: { onOpenChange: (open: boolean) => void }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#05070a]/75 border border-white/10 rounded-3xl w-full max-w-6xl p-4 sm:p-6 shadow-2xl relative backdrop-blur-2xl my-auto">
        <PostStudio onClose={() => onOpenChange(false)} />
      </div>
    </div>
  );
};
