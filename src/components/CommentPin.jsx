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
      {/* Figma-style pin: White teardrop base with colored circle */}
      <div 
        className={`relative transition-all duration-200 ${
          isExpanded ? 'ring-2 ring-opacity-50' : ''
        } ${isDragging ? 'cursor-grabbing scale-110 shadow-xl' : 'cursor-grab hover:scale-105'}`}
        style={{
          width: '32px',
          height: '32px',
          backgroundColor: 'white',
          border: isExpanded ? `2px solid ${userColor.background}` : '2px solid #E5E7EB',
          borderRadius: '50% 50% 50% 0',
          transform: 'rotate(-45deg)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          '--tw-ring-color': userColor.background
        }}
        title={`${comment.author}: Click to expand, drag to move`}
      >
        {/* Colored circle in center with user initial */}
        <div 
          className="absolute flex items-center justify-center text-xs font-medium rounded-full"
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: userColor.background,
            color: userColor.text,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(45deg)',
          }}
        >
          {userInitials}
        </div>
      </div>

      {/* Hover preview tooltip */}
      {!isExpanded && (
        <div className="absolute left-8 top-0 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-10">
          {comment.author}: {comment.text.substring(0, 50)}{comment.text.length > 50 ? '...' : ''}
        </div>
      )}

      {/* Expanded comment bubble - simple consistent positioning with higher z-index */}
      {isExpanded && (
        <div 
          className="absolute bg-white border border-gray-200 rounded-lg shadow-xl p-3 min-w-64 max-w-80 comment-bubble"
          style={{
            left: '40px',
            top: '-20px',
            zIndex: 1000
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              {/* User avatar in comment header */}
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                style={{
                  backgroundColor: userColor.background,
                  color: userColor.text
                }}
              >
                {userInitials}
              </div>
              <div className="text-sm font-medium text-gray-900">{comment.author}</div>
            </div>
            <div className="flex gap-1">
              {canEdit && (
                <>
                  <button 
                    onClick={handleEdit}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Edit comment"
                  >
                    <PencilSimple size={14} />
                  </button>
                  <button 
                    onClick={() => onDelete(comment.id)}
                    className="p-1 hover:bg-gray-100 rounded text-red-600"
                    title="Delete comment"
                  >
                    <Trash size={14} />
                  </button>
                </>
              )}
              <button 
                onClick={() => onToggleExpand(comment.id)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Close comment"
              >
                <X size={14} />
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
            {formatDate(comment.created_at)}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentPin;