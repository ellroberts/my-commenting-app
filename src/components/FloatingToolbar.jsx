// src/components/FloatingToolbar.jsx
import React from 'react';
import { ChatCircle } from 'phosphor-react';

const FloatingToolbar = ({ commentMode, onToggleCommentMode, commentCount }) => {
  return (
    <div className="fixed top-4 right-4 z-40">
      <button
        onClick={onToggleCommentMode}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg font-medium transition-all duration-200 ${
          commentMode
            ? 'text-white hover:opacity-90'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
        }`}
        style={{
          backgroundColor: commentMode ? '#A34696' : 'white',
        }}
      >
        <ChatCircle size={18} />
        <span>Comment Mode</span>
        {commentCount > 0 && (
          <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
            commentMode 
              ? 'bg-white bg-opacity-20 text-white' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {commentCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default FloatingToolbar;