import React, { useState } from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';

interface PollComposerProps {
  poll: { question: string; options: string[]; durationDays: number } | null;
  onChange: (poll: { question: string; options: string[]; durationDays: number } | null) => void;
}

export const PollComposer: React.FC<PollComposerProps> = ({ poll, onChange }) => {
  const [question, setQuestion] = useState(poll?.question || '');
  const [options, setOptions] = useState<string[]>(poll?.options || ['', '']);
  const [duration, setDuration] = useState(poll?.durationDays || 3);

  const handleUpdate = (updatedQuestion: string, updatedOptions: string[], updatedDuration: number) => {
    if (!updatedQuestion && updatedOptions.every(o => !o)) {
      onChange(null);
    } else {
      onChange({ question: updatedQuestion, options: updatedOptions, durationDays: updatedDuration });
    }
  };

  const addOption = () => {
    if (options.length < 10) {
      const newOptions = [...options, ''];
      setOptions(newOptions);
      handleUpdate(question, newOptions, duration);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, idx) => idx !== index);
      setOptions(newOptions);
      handleUpdate(question, newOptions, duration);
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const newOptions = [...options];
    newOptions[index] = val;
    setOptions(newOptions);
    handleUpdate(question, newOptions, duration);
  };

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <span className="text-xs font-black uppercase text-white tracking-wider">Create a Poll</span>
        <div className="flex items-center gap-1.5 text-[10px] text-white/50">
          <Clock size={12} className="text-[#00f3ff]" />
          <span>Duration</span>
          <select
            value={duration}
            onChange={(e) => {
              const dur = Number(e.target.value);
              setDuration(dur);
              handleUpdate(question, options, dur);
            }}
            className="bg-black text-white border border-white/10 rounded px-1.5 py-0.5 focus:outline-none focus:border-[#00f3ff]"
          >
            <option value={1}>1 Day</option>
            <option value={3}>3 Days</option>
            <option value={7}>7 Days</option>
            <option value={30}>30 Days</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">Question</label>
          <input
            type="text"
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              handleUpdate(e.target.value, options, duration);
            }}
            placeholder="Ask something..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f3ff] placeholder:text-white/20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Options</label>
          {options.map((option, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="text-xs text-white/30 w-4">{idx + 1}.</span>
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f3ff] placeholder:text-white/20"
              />
              {options.length > 2 && (
                <button
                  onClick={() => removeOption(idx)}
                  className="text-white/40 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}

          {options.length < 10 && (
            <button
              onClick={addOption}
              className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-[#00f3ff] hover:underline"
            >
              <Plus size={12} />
              <span>Add Option</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
