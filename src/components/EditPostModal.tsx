import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save } from 'lucide-react';
import { useAeirmist } from '../context/AeirmistContext';

interface EditPostModalProps {
  post: any;
  onClose: () => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({ post, onClose }) => {
  const [content, setContent] = useState(post.content);
  const { editPost, addToast } = useAeirmist();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await editPost(post.id, content, post.mediaUrls);
      if (addToast) {
        addToast({
          title: 'POST UPDATED',
          message: 'Your transmission has been successfully saved.',
          type: 'success'
        });
      }
      onClose();
    } catch (e) {
      console.error("Edit failed", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ui-modal-backdrop">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}                
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="ui-modal-container max-w-lg"
      >
        <div className="ui-modal-header mb-2">
            <h2 className="ui-heading-2">Edit Post</h2>
            <button type="button" onClick={onClose} className="p-1.5 rounded-xl bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"><X className="ui-icon-md" /></button>
        </div>
        <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="ui-textarea h-36"
            placeholder="Edit your post..."
        />
        <div className="ui-modal-footer">
          <button type="button" onClick={onClose} className="ui-btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={loading} className="ui-btn-primary">
              {loading ? 'Saving...' : <><Save className="ui-icon-sm"/> Save Changes</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
