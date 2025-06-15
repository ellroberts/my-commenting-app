// src/components/CommentingLayer.jsx
import React, { useState, useEffect, useRef } from 'react';
import CommentPin from './CommentPin';
import CommentInput from './CommentInput';
import FloatingToolbar from './FloatingToolbar';
import { commentService } from '../utils/commentService';
import { positionUtils } from '../utils/positionUtils';
import { getUserColor, getUserInitials } from '../utils/userColors';

export default function CommentingLayer() {
  const [comments, setComments] = useState([]);
  const [commentMode, setCommentMode] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [pendingComment, setPendingComment] = useState(null);
  const [expandedComment, setExpandedComment] = useState(null);
  const [currentUser, setCurrentUser] = useState('');
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [activeInputComment, setActiveInputComment] = useState(null);
  const containerRef = useRef(null);

  // Hardcoded prototype URL - change this for different prototypes
  const PROTOTYPE_URL = 'https://bi-directional-v3.vercel.app/';

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

  // Get or set user name
  useEffect(() => {
    let user = localStorage.getItem('commentUser');
    if (!user) {
      user = prompt('Enter your name for comments:') || 'Anonymous';
      localStorage.setItem('commentUser', user);
    }
    setCurrentUser(user);
  }, []);

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

        {/* Comment pins - only render if we have container dimensions */}
        {showComments && containerDimensions.width > 0 && comments.map(comment => (
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

        {/* Pending comment input - Figma style white pin with colored circle */}
        {pendingComment && (
          <>
            {/* Temporary Figma-style pin while typing */}
            <div
              className="absolute z-50"
              style={{ 
                left: pendingComment.x, 
                top: pendingComment.y,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div 
                className="relative"
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'white',
                  border: '2px solid #E5E7EB',
                  borderRadius: '50% 50% 50% 0',
                  transform: 'rotate(-45deg)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
              >
                {/* Colored circle in center with user initial */}
                <div 
                  className="absolute flex items-center justify-center text-xs font-medium rounded-full"
                  style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: getUserColor(currentUser).background,
                    color: getUserColor(currentUser).text,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(45deg)',
                  }}
                >
                  {getUserInitials(currentUser)}
                </div>
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
        onToggleCommentMode={() => setCommentMode(!commentMode)}
        showComments={showComments}
        onToggleShowComments={() => setShowComments(!showComments)}
        commentCount={comments.length}
      />
    </div>
  );
}