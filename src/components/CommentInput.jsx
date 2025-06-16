// src/components/CommentInput.jsx
import React, { useState, useRef, useEffect } from 'react';

const CommentInput = ({ x, y, onSubmit, onCancel, author }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div 
      className="absolute bg-white rounded-lg shadow-xl z-50"
      style={{ 
        left: x + 28, // 20px (half pin width) + 8px gap
        top: y - 20,  // Top aligned with pin center
        width: '320px', // Fixed width to match playground
        transform: y > window.innerHeight - 200 ? 'translateY(-100%)' : 'none',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)'
      }}
    >
      {/* Header with author name and close */}
      <div className="flex justify-between items-center px-4 pt-4 pb-2">
        <div className="text-sm font-semibold text-gray-900">{author}</div>
        <button 
          onClick={onCancel}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/>
          </svg>
        </button>
      </div>

      {/* Input field with gray background - flexible height */}
      <div className="px-4 pb-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment..."
          className="w-full text-sm border-0 rounded-lg px-3 py-2 resize-none bg-gray-100 focus:bg-gray-50 focus:outline-none transition-all placeholder-gray-500"
          style={{ 
            minHeight: '36px',
            height: 'auto',
            overflow: 'hidden'
          }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
        />
      </div>

      {/* Bottom toolbar */}
      <div className="flex justify-between items-center px-4 pb-4">
        <div className="flex gap-3">
          {/* Emoji icon */}
          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </button>
          
          {/* Image icon */}
          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21"/>
            </svg>
          </button>
        </div>
        
        {/* Arrow submit button */}
        <button 
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="p-2 rounded-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#A34696' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22,2 15,22 11,13 2,9 22,2"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CommentInput;