// src/components/CommentPin.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { PencilSimple, Trash, X } from 'phosphor-react';
import { positionUtils } from '../utils/positionUtils';
import { getUserColor, getUserInitials } from '../utils/userColors';

const CommentPin = ({ 
  comment, 
  onEdit, 
  onDelete, 
  onUpdatePosition, 
  currentUser, 
  isExpanded, 
  onToggleExpand, 
  containerDimensions,
  isInputOpen 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(comment.text);

  // Get user color scheme
  const userColor = getUserColor(comment.author);
  const userInitials = getUserInitials(comment.author);

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

  // Post-it note colors - dynamic selection based on user
  const postItColors = {
    yellow: { main: '#FCD34D', shadow: '#D97706', fold: '#92400E' },
    blue: { main: '#93C5FD', shadow: '#2563EB', fold: '#1D4ED8' },
    green: { main: '#86EFAC', shadow: '#16A34A', fold: '#15803D' },
    pink: { main: '#F9A8D4', shadow: '#EC4899', fold: '#BE185D' },
    orange: { main: '#FDBA74', shadow: '#EA580C', fold: '#C2410C' },
    purple: { main: '#C4B5FD', shadow: '#7C3AED', fold: '#5B21B6' },
    red: { main: '#FCA5A5', shadow: '#DC2626', fold: '#991B1B' }
  };

  // Select color based on user name for consistency
  const colorKey = Object.keys(postItColors)[Math.abs(comment.author.charCodeAt(0)) % Object.keys(postItColors).length];
  const postItColor = postItColors[colorKey] || postItColors.yellow;

  // Pin size
  const pinSize = 40;

  // Format date to UK time in the requested format (e.g., "Sun 15 June 19:02")
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    // Convert to UK timezone (Europe/London handles BST/GMT automatically)
    const ukDate = new Date(date.toLocaleString("en-US", {timeZone: "Europe/London"}));
    
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = weekdays[ukDate.getDay()];
    const dayNum = ukDate.getDate();
    const monthName = months[ukDate.getMonth()];
    
    // Format time in 24-hour format for UK timezone
    const time = ukDate.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false,
      timeZone: 'Europe/London'
    });
    
    return `${dayName} ${dayNum} ${monthName} ${time}`;
  };

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
      className={`absolute cursor-pointer select-none comment-pin ${isDragging ? 'z-60' : isExpanded ? 'z-[100]' : 'z-50'}`}
      style={{ 
        left: pixelPosition.x, 
        top: pixelPosition.y,
        transform: 'translate(-50%, -50%)'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Post-it Note SVG Pin */}
      <div 
        className={`relative transition-all duration-200 ${
          isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab hover:scale-105'
        }`}
        style={{
          filter: isDragging ? 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.3))' : 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))'
        }}
        title={`${comment.author}: Click to expand, drag to move`}
      >
        <svg 
          width={pinSize} 
          height={pinSize} 
          viewBox={`0 0 ${pinSize} ${pinSize}`}
          className="transition-all duration-200"
        >
          {/* Main post-it note body with rounded corners */}
          <path 
            d={`M4 2 L${pinSize-2} 2 Q${pinSize-2} 2 ${pinSize-2} 4 L${pinSize-2} ${pinSize-12} L${pinSize-12} ${pinSize-2} Q2 ${pinSize-2} 2 ${pinSize-4} L2 4 Q2 2 4 2 Z`}
            fill={postItColor.main}
          />
          
          {/* Folded corner */}
          <path 
            d={`M${pinSize-12} ${pinSize-12} L${pinSize-2} ${pinSize-12} L${pinSize-12} ${pinSize-2} Z`}
            fill={postItColor.fold}
          />
          
          {/* User initial text directly on post-it */}
          <text 
            x={pinSize/2} 
            y={pinSize/2 + 3} 
            textAnchor="middle" 
            fontSize={pinSize/3.2} 
            fontWeight="700"
            fill={postItColor.fold}
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {userInitials}
          </text>
        </svg>
      </div>

      {/* Hover preview tooltip */}
      {!isExpanded && (
        <div className="absolute left-12 top-0 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-10">
          {comment.author}: {comment.text.substring(0, 50)}{comment.text.length > 50 ? '...' : ''}
        </div>
      )}

      {/* Expanded comment bubble - positioned relative to pin container */}
      {isExpanded && (
        <div 
          className="absolute bg-white rounded-lg shadow-xl comment-bubble"
          style={{
            left: '45px', // Adjusted from original 50px to move slightly closer to pin
            top: '2px', // Keep same vertical alignment
            width: '320px', // Fixed width to match input boxes
            zIndex: 1000,
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)'
          }}
        >
          {/* Header with author name and actions - exact match to input boxes */}
          <div className="flex justify-between items-center px-4 pt-4 pb-2">
            <div className="text-sm font-semibold text-gray-900">{comment.author}</div>
            <div className="flex gap-1">
              {canEdit && (
                <>
                  <button 
                    onClick={handleEdit}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Edit comment"
                  >
                    <PencilSimple size={16} />
                  </button>
                  <button 
                    onClick={() => onDelete(comment.id)}
                    className="p-1 hover:bg-red-50 rounded text-red-600 transition-colors"
                    title="Delete comment"
                  >
                    <Trash size={16} />
                  </button>
                </>
              )}
              <button 
                onClick={() => onToggleExpand(comment.id)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Close comment"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          
          {editMode ? (
            <div>
              {/* Edit mode with gray background input */}
              <div className="px-4 pb-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full text-sm border-0 rounded-lg px-3 py-2 resize-none bg-gray-100 focus:bg-gray-50 focus:outline-none transition-all"
                  style={{ 
                    minHeight: '36px',
                    height: 'auto',
                    overflow: 'hidden'
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  autoFocus
                />
              </div>
              
              {/* Bottom section with submit button */}
              <div className="flex justify-end px-4 pb-4">
                <button
                  onClick={handleEdit}
                  className="p-2 rounded-lg transition-all hover:opacity-90"
                  style={{ backgroundColor: '#A34696' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* View mode - just text and timestamp */}
              <div className="px-4 pb-2">
                <div className="text-sm text-gray-700 leading-relaxed">{comment.text}</div>
              </div>
              
              <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-500">{formatDate(comment.created_at)}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentPin;