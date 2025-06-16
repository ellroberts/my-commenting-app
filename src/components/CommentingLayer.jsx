// src/components/CommentingLayer.jsx
import React, { useState, useEffect, useRef } from 'react';
import CommentPin from './CommentPin';
import CommentInput from './CommentInput';
import FloatingToolbar from './FloatingToolbar';
import UserNameModal from './UserNameModal';
import { commentService } from '../utils/commentService';
import { positionUtils } from '../utils/positionUtils';
import { getUserColor, getUserInitials } from '../utils/userColors';

export default function CommentingLayer() {
  const [comments, setComments] = useState([]);
  const [commentMode, setCommentMode] = useState(false);
  const [pendingComment, setPendingComment] = useState(null);
  const [expandedComment, setExpandedComment] = useState(null);
  const [currentUser, setCurrentUser] = useState('');
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [activeInputComment, setActiveInputComment] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const containerRef = useRef(null);

  // Hardcoded prototype URL - change this for different prototypes
  const PROTOTYPE_URL = 'https://bi-directional-v3.vercel.app/';

  // Post-it note colors - same as in CommentPin for consistency
  const postItColors = {
    yellow: { main: '#FCD34D', shadow: '#D97706', fold: '#92400E' },
    blue: { main: '#93C5FD', shadow: '#2563EB', fold: '#1D4ED8' },
    green: { main: '#86EFAC', shadow: '#16A34A', fold: '#15803D' },
    pink: { main: '#F9A8D4', shadow: '#EC4899', fold: '#BE185D' },
    orange: { main: '#FDBA74', shadow: '#EA580C', fold: '#C2410C' },
    purple: { main: '#C4B5FD', shadow: '#7C3AED', fold: '#5B21B6' },
    red: { main: '#FCA5A5', shadow: '#DC2626', fold: '#991B1B' }
  };

  // Get post-it color for user (same logic as CommentPin)
  const getPostItColor = (userName) => {
    const colorKey = Object.keys(postItColors)[Math.abs(userName.charCodeAt(0)) % Object.keys(postItColors).length];
    return postItColors[colorKey] || postItColors.yellow;
  };

  // Track container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Check if user exists on mount (no modal on load)
  useEffect(() => {
    const user = localStorage.getItem('commentUser');
    if (user) {
      setCurrentUser(user);
    }
    // No modal shown here - only when comment mode is activated
  }, []);

  const handleNameSubmit = (name) => {
    const userName = name || 'Anonymous';
    localStorage.setItem('commentUser', userName);
    setCurrentUser(userName);
    setShowNameModal(false);
    // After setting name, enable comment mode
    setCommentMode(true);
  };

  const handleNameCancel = () => {
    setShowNameModal(false);
    // Don't enable comment mode if cancelled
    setCommentMode(false);
  };

  // Load comments on mount
  useEffect(() => {
    const loadComments = async () => {
      const { data, error } = await commentService.getComments();
      if (error) {
        console.error('Error loading comments:', error);
        return;
      }
      if (data) {
        // Filter comments for this specific prototype
        const prototypeComments = data.filter(comment => 
          comment.prototype === PROTOTYPE_URL
        );
        setComments(prototypeComments);
      }
    };
    loadComments();
  }, []);

  // Handle comment mode toggle - show modal if no user set
  const handleToggleCommentMode = () => {
    if (!commentMode) {
      // Turning comment mode ON
      const user = localStorage.getItem('commentUser');
      if (!user) {
        // No user set - show modal first
        setShowNameModal(true);
      } else {
        // User already set - enable comment mode directly
        setCurrentUser(user);
        setCommentMode(true);
      }
    } else {
      // Turning comment mode OFF
      setCommentMode(false);
      setPendingComment(null);
      setExpandedComment(null);
      setActiveInputComment(null);
    }
  };

  const handleCanvasClick = (e) => {
    if (!commentMode) return;
    
    // Don't add comment if clicking on interactive elements
    if (e.target.closest('button') || 
        e.target.closest('textarea') || 
        e.target.closest('input') ||
        e.target.closest('.comment-pin') ||
        e.target.closest('.comment-input')) {
      return;
    }
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setPendingComment({ x, y });
    setExpandedComment(null);
    setActiveInputComment('pending');
  };

  const handleSubmitComment = async (text) => {
    if (!pendingComment || !containerDimensions.width || !containerDimensions.height) {
      console.error('Missing required data for comment submission');
      return;
    }

    try {
      // Convert pixel coordinates to scale-aware percentages
      const scaledPosition = positionUtils.pixelsToScaledPercent(
        pendingComment.x,
        pendingComment.y,
        containerDimensions.width,
        containerDimensions.height
      );

      console.log('Submitting comment with scaled position:', scaledPosition);
      console.log('Container dimensions:', containerDimensions);
      console.log('Detected scale:', positionUtils.getIframeScale(containerDimensions.width, containerDimensions.height));

      const newComment = {
        text,
        author: currentUser,
        // Include both old pixel coordinates (required for NOT NULL database columns)
        x: pendingComment.x,
        y: pendingComment.y,
        // And new percentage coordinates (for scale-aware positioning)
        x_percent: scaledPosition.x,
        y_percent: scaledPosition.y,
        prototype: PROTOTYPE_URL
      };
      
      const { data, error } = await commentService.addComment(newComment);
      if (error) {
        console.error('Error adding comment:', error);
        alert('Failed to add comment. Please try again.');
        return;
      }
      if (data) {
        console.log('Comment added successfully:', data);
        setComments(prev => [...prev, data]);
      }
      
      setPendingComment(null);
      setActiveInputComment(null);
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Failed to add comment. Please try again.');
    }
  };

  const handleUpdateComment = async (id, newText) => {
    const { data, error } = await commentService.updateComment(id, { text: newText });
    if (error) {
      console.error('Error updating comment:', error);
      return;
    }
    if (data) {
      setComments(prev => prev.map(c => c.id === id ? data : c));
    }
  };

  const handleDeleteComment = async (id) => {
    const { data, error } = await commentService.deleteComment(id);
    if (error) {
      console.error('Error deleting comment:', error);
      return;
    }
    setComments(prev => prev.filter(c => c.id !== id));
    setExpandedComment(null);
  };

  const handleUpdatePosition = async (id, percentPosition) => {
    const { data, error } = await commentService.updateComment(id, percentPosition);
    if (error) {
      console.error('Error updating position:', error);
      return;
    }
    if (data) {
      setComments(prev => prev.map(c => c.id === id ? data : c));
    }
  };

  const handleToggleExpand = (id) => {
    setExpandedComment(expandedComment === id ? null : id);
  };

  return (
    <div className="relative w-full h-screen bg-gray-50 overflow-hidden">
      {/* User Name Modal */}
      <UserNameModal
        isOpen={showNameModal}
        onSubmit={handleNameSubmit}
        onCancel={handleNameCancel}
      />

      {/* Prototype iframe */}
      <div 
        ref={containerRef}
        className={`w-full h-full relative commenting-container ${commentMode ? 'comment-mode-cursor' : 'cursor-default'}`}
        onClick={handleCanvasClick}
      >
        <iframe
          src={PROTOTYPE_URL}
          className="w-full h-full border-0"
          title="Prototype"
          style={{ pointerEvents: commentMode ? 'none' : 'auto' }}
        />

        {/* Comment pins - only render if comment mode is on and we have container dimensions */}
        {commentMode && containerDimensions.width > 0 && comments.map(comment => (
          <CommentPin
            key={comment.id}
            comment={comment}
            onEdit={handleUpdateComment}
            onDelete={handleDeleteComment}
            onUpdatePosition={handleUpdatePosition}
            currentUser={currentUser}
            isExpanded={expandedComment === comment.id}
            onToggleExpand={handleToggleExpand}
            containerDimensions={containerDimensions}
            isInputOpen={activeInputComment === comment.id}
          />
        ))}

        {/* Pending comment input - Post-it style pin while typing */}
        {pendingComment && commentMode && (
          <>
            {/* Post-it pin for pending comment - using consistent colors */}
            <div
              className="absolute z-50"
              style={{ 
                left: pendingComment.x, 
                top: pendingComment.y,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div 
                className="relative transition-all duration-200"
                style={{
                  filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))'
                }}
              >
                <svg width="40" height="40" viewBox="0 0 40 40">
                  {/* Use post-it colors for consistency */}
                  <path 
                    d="M4 2 L38 2 Q38 2 38 4 L38 28 L28 38 Q2 38 2 36 L2 4 Q2 2 4 2 Z"
                    fill={getPostItColor(currentUser).main}
                  />
                  <path 
                    d="M28 28 L38 28 L28 38 Z"
                    fill={getPostItColor(currentUser).fold}
                  />
                  <text 
                    x="20" 
                    y="23" 
                    textAnchor="middle" 
                    fontSize="12.5" 
                    fontWeight="700"
                    fill={getPostItColor(currentUser).fold}
                    fontFamily="system-ui, -apple-system, sans-serif"
                  >
                    {getUserInitials(currentUser)}
                  </text>
                </svg>
              </div>
            </div>
            
            <CommentInput
              x={pendingComment.x}
              y={pendingComment.y}
              onSubmit={handleSubmitComment}
              onCancel={() => {
                setPendingComment(null);
                setActiveInputComment(null);
              }}
              author={currentUser}
            />
          </>
        )}
      </div>

      {/* Floating toolbar */}
      <FloatingToolbar
        commentMode={commentMode}
        onToggleCommentMode={handleToggleCommentMode}
        commentCount={comments.length}
      />
    </div>
  );
}