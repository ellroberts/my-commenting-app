// src/components/FloatingToolbar.jsx
import React from 'react';
import { MessageCircle, Eye, EyeOff } from 'lucide-react';

const FloatingToolbar = ({ 
  commentMode, 
  onToggleCommentMode, 
  showComments, 
  onToggleShowComments, 
  commentCount 
}) => {
  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-2 z-40">
      <button
        onClick={onToggleCommentMode}
        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
          commentMode 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
      >
        <MessageCircle size={16} className="inline mr-1" />
        Comment Mode
      </button>
      
      <button
        onClick={onToggleShowComments}
        className="px-3 py-2 rounded text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex items-center gap-1"
      >
        {showComments ? <Eye size={16} /> : <EyeOff size={16} />}
        {showComments ? 'Hide' : 'Show'} ({commentCount})
      </button>
    </div>
  );
};

export default FloatingToolbar;