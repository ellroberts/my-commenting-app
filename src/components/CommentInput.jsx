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
      className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-64 max-w-80 z-50 comment-input"
      style={{ 
        left: x + 20, 
        top: y + 10,
        transform: y > window.innerHeight - 200 ? 'translateY(-100%)' : 'none'
      }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a comment..."
        className="w-full text-sm border border-gray-300 rounded px-2 py-1 resize-none"
        rows={3}
      />
      <div className="flex gap-2 justify-end mt-2">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="px-3 py-1 text-xs text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: '#A34696'
          }}
        >
          Comment
        </button>
      </div>
    </div>
  );
};

export default CommentInput;