// src/components/CommentPin.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Edit3, Trash2, X } from 'lucide-react';
import { positionUtils } from '../utils/positionUtils';

const CommentPin = ({ 
  comment, 
  onEdit, 
  onDelete, 
  onUpdatePosition, 
  currentUser, 
  isExpanded, 
  onToggleExpand, 
  containerDimensions 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(comment.text);

  // Calculate pixel position using scale-aware positioning
  const pixelPosition = (() => {
    // If we have percentage data, use scale-aware conversion
    if (comment.x_percent !== null && comment.x_percent !== undefined && 
        comment.y_percent !== null && comment.y_percent !== undefined) {
      return positionUtils.scaledPercentToPixels(
        comment.x_percent,
        comment.y_percent,
        containerDimensions.width,
        containerDimensions.height
      );
    }
    // Otherwise, use the old pixel coordinates directly
    return {
      x: comment.x || 0,
      y: comment.y || 0
    };
  })();

  const handleMouseDown = (e) => {
    if (e.target.closest('.comment-bubble')) return;
    
    console.log('Pin mousedown detected');
    e.preventDefault();
    e.stopPropagation();
    
    const startTime = Date.now();
    const startX = e.clientX;
    const startY = e.clientY;
    let hasMoved = false;
    
    const handleMouseMove = (moveEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);
      
      if (deltaX > 3 || deltaY > 3) {
        hasMoved = true;
        console.log('Starting drag mode');
        setIsDragging(true);
        
        const overlay = document.createElement('div');
        overlay.id = 'drag-overlay';
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 9999;
          cursor: grabbing;
          background: transparent;
        `;
        document.body.appendChild(overlay);
        
        const containerRect = document.querySelector('.commenting-container').getBoundingClientRect();
        setDragOffset({
          x: moveEvent.clientX - containerRect.left - pixelPosition.x,
          y: moveEvent.clientY - containerRect.top - pixelPosition.y
        });
        
        document.removeEventListener('mousemove', handleMouseMove);
      }
    };
    
    const handleMouseUp = (upEvent) => {
      console.log('Mouse up - hasMoved:', hasMoved);
      
      if (!hasMoved) {
        console.log('Treating as click - expanding comment');
        onToggleExpand(comment.id);
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      const containerRect = document.querySelector('.commenting-container').getBoundingClientRect();
      const newX = e.clientX - containerRect.left - dragOffset.x;
      const newY = e.clientY - containerRect.top - dragOffset.y;
      
      // Convert to scale-aware percentages before updating
      const scaledPosition = positionUtils.pixelsToScaledPercent(
        newX, 
        newY, 
        containerDimensions.width, 
        containerDimensions.height
      );
      
      onUpdatePosition(comment.id, { 
        x_percent: scaledPosition.x, 
        y_percent: scaledPosition.y 
      });
    }
  }, [isDragging, dragOffset.x, dragOffset.y, comment.id, onUpdatePosition, containerDimensions]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    
    const overlay = document.getElementById('drag-overlay');
    if (overlay) {
      overlay.remove();
    }
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleEdit = () => {
    if (editMode) {
      onEdit(comment.id, editText);
      setEditMode(false);
    } else {
      setEditMode(true);
    }
  };

  const canEdit = comment.author === currentUser;

  return (
    <div
      className={`absolute cursor-pointer select-none z-50 comment-pin ${isDragging ? 'z-60' : ''}`}
      style={{ 
        left: pixelPosition.x, 
        top: pixelPosition.y,
        transform: 'translate(-50%, -50%)'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Figma-style speech bubble */}
      <div 
        className={`relative bg-blue-500 border border-blue-600 rounded-full shadow-lg hover:bg-blue-600 transition-all duration-200 ${
          isExpanded ? 'ring-2 ring-blue-300 ring-opacity-50' : ''
        } ${isDragging ? 'cursor-grabbing scale-110 shadow-xl' : 'cursor-grab hover:scale-105'}`}
        style={{
          width: '24px',
          height: '24px',
        }}
        title="Click to expand, drag to move"
      >
        {/* Speech bubble icon */}
        <div className="w-full h-full flex items-center justify-center">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            className="text-white"
          >
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              fill="currentColor"
            />
          </svg>
        </div>
        
        {/* Small tail/pointer - positioned to point to the exact click location */}
        <div 
          className="absolute bg-blue-500 border-l border-b border-blue-600"
          style={{
            width: '6px',
            height: '6px',
            bottom: '-3px',
            left: '50%',
            transform: 'translateX(-50%) rotate(-45deg)',
            clipPath: 'polygon(0 0, 0 100%, 100% 100%)'
          }}
        />
      </div>

      {/* Hover preview tooltip */}
      {!isExpanded && (
        <div className="absolute left-8 top-0 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-10">
          {comment.author}: {comment.text.substring(0, 50)}{comment.text.length > 50 ? '...' : ''}
        </div>
      )}

      {/* Expanded comment bubble */}
      {isExpanded && (
        <div className="absolute left-8 top-0 bg-white border border-gray-200 rounded-lg shadow-xl p-3 min-w-64 max-w-80 comment-bubble">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm font-medium text-gray-900">{comment.author}</div>
            <div className="flex gap-1">
              {canEdit && (
                <>
                  <button 
                    onClick={handleEdit}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Edit comment"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button 
                    onClick={() => onDelete(comment.id)}
                    className="p-1 hover:bg-gray-100 rounded text-red-600"
                    title="Delete comment"
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              )}
              <button 
                onClick={() => onToggleExpand(comment.id)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Close comment"
              >
                <X size={12} />
              </button>
            </div>
          </div>
          
          {editMode ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditMode(false)}
                  className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-700">{comment.text}</div>
          )}
          
          <div className="text-xs text-gray-500 mt-2">
            {new Date(comment.created_at).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentPin;