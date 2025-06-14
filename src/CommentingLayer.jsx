import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Eye, EyeOff, Edit3, Trash2, Send, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://gadpqoxttsdfohhphrvu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZHBxb3h0dHNkZm9oaHBocnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMjU4MTMsImV4cCI6MjA2NDkwMTgxM30.xZaGTzsqCqYAySE_d3bH5TFWuTEYev99Jiewlyr08U8';

const supabase = createClient(supabaseUrl, supabaseKey);

// Database functions
const commentService = {
  async getComments() {
    const { data, error } = await supabase
      .from('commenting')
      .select('*')
      .order('created_at', { ascending: true });
    
    return { data, error };
  },
  
  async addComment(comment) {
    const { data, error } = await supabase
      .from('commenting')
      .insert([{
        text: comment.text,
        author: comment.author,
        x: comment.x,
        y: comment.y,
        prototype: comment.prototype || null
      }])
      .select()
      .single();
    
    return { data, error };
  },
  
  async updateComment(id, updates) {
    const { data, error } = await supabase
      .from('commenting')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },
  
  async deleteComment(id) {
    const { data, error } = await supabase
      .from('commenting')
      .delete()
      .eq('id', id);
    
    return { data, error };
  }
};

const CommentPin = ({ comment, onEdit, onDelete, onUpdatePosition, currentUser, isExpanded, onToggleExpand }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(comment.text);

  const handleMouseDown = (e) => {
    if (e.target.closest('.comment-bubble')) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    // Get position relative to the container, not the pin
    const containerRect = document.querySelector('.commenting-container').getBoundingClientRect();
    setDragOffset({
      x: e.clientX - containerRect.left - comment.x,
      y: e.clientY - containerRect.top - comment.y
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      const containerRect = document.querySelector('.commenting-container').getBoundingClientRect();
      const newX = e.clientX - containerRect.left - dragOffset.x;
      const newY = e.clientY - containerRect.top - dragOffset.y;
      onUpdatePosition(comment.id, { x: newX, y: newY });
    }
  }, [isDragging, dragOffset.x, dragOffset.y, comment.id, onUpdatePosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
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
        left: comment.x, 
        top: comment.y,
        transform: 'translate(-50%, -50%)'
      }}
      onMouseDown={handleMouseDown}
    >
      <div 
        className={`w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg hover:bg-blue-600 transition-colors ${
          isExpanded ? 'ring-2 ring-blue-300' : ''
        } ${isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab hover:scale-105'}`}
        onClick={(e) => {
          e.stopPropagation();
          if (!isDragging) {
            onToggleExpand(comment.id);
          }
        }}
        title="Drag to move, click to expand"
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>

      {!isExpanded && (
        <div className="absolute left-8 top-0 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          {comment.author}: {comment.text.substring(0, 50)}{comment.text.length > 50 ? '...' : ''}
        </div>
      )}

      {isExpanded && (
        <div className="absolute left-8 top-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-64 max-w-80 comment-bubble">
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
        top: y,
        transform: y > window.innerHeight - 200 ? 'translateY(-100%)' : 'none'
      }}
    >
      <div className="text-sm font-medium text-gray-900 mb-2">{author}</div>
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
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={12} className="inline mr-1" />
          Comment
        </button>
      </div>
    </div>
  );
};

const FloatingToolbar = ({ commentMode, onToggleCommentMode, showComments, onToggleShowComments, commentCount }) => {
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

export default function CommentingLayer() {
  const [comments, setComments] = useState([]);
  const [commentMode, setCommentMode] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [pendingComment, setPendingComment] = useState(null);
  const [expandedComment, setExpandedComment] = useState(null);
  const [currentUser, setCurrentUser] = useState('');
  const containerRef = useRef(null);

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
        setComments(data);
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
  };

  const handleSubmitComment = async (text) => {
    if (!pendingComment) return;

    const newComment = {
      text,
      author: currentUser,
      x: pendingComment.x,
      y: pendingComment.y,
      prototype: 'comment-layer' // You can change this or make it dynamic
    };
    
    const { data, error } = await commentService.addComment(newComment);
    if (error) {
      console.error('Error adding comment:', error);
      return;
    }
    if (data) {
      setComments(prev => [...prev, data]);
    }
    
    setPendingComment(null);
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

  const handleUpdatePosition = async (id, position) => {
    const { data, error } = await commentService.updateComment(id, position);
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
    <div className="relative w-full h-screen bg-gray-50">
      {/* Demo content area */}
      <div 
        ref={containerRef}
        className={`w-full h-full relative commenting-container ${commentMode ? 'cursor-crosshair' : 'cursor-default'}`}
        onClick={handleCanvasClick}
      >
        {/* Demo content */}
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Demo Prototype</h1>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-3">Sample Content</h2>
            <p className="text-gray-600 mb-4">
              This is a demo prototype. Toggle comment mode and click anywhere to leave comments!
              The commenting system works like Figma - you can drag pins around, expand comments,
              and edit/delete your own comments.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-100 p-4 rounded">
                <h3 className="font-medium">Feature A</h3>
                <p className="text-sm text-gray-600">Click here to comment on this feature</p>
              </div>
              <div className="bg-green-100 p-4 rounded">
                <h3 className="font-medium">Feature B</h3>
                <p className="text-sm text-gray-600">Or comment on this section</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-3">Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Click "Comment Mode" to enable commenting</li>
              <li>Click anywhere on the canvas to place a comment pin</li>
              <li>Click on pins to expand/collapse comments</li>
              <li>Drag pins to reposition them</li>
              <li>Edit or delete your own comments</li>
              <li>Toggle visibility to show/hide all comments</li>
            </ol>
          </div>
        </div>

        {/* Comment pins */}
        {showComments && comments.map(comment => (
          <CommentPin
            key={comment.id}
            comment={comment}
            onEdit={handleUpdateComment}
            onDelete={handleDeleteComment}
            onUpdatePosition={handleUpdatePosition}
            currentUser={currentUser}
            isExpanded={expandedComment === comment.id}
            onToggleExpand={handleToggleExpand}
          />
        ))}

        {/* Pending comment input */}
        {pendingComment && (
          <CommentInput
            x={pendingComment.x}
            y={pendingComment.y}
            onSubmit={handleSubmitComment}
            onCancel={() => setPendingComment(null)}
            author={currentUser}
          />
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

      {/* Comment mode indicator */}
      {commentMode && (
        <div className="fixed bottom-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <MessageCircle size={16} className="inline mr-2" />
          Comment mode active - click anywhere to add a comment
        </div>
      )}
    </div>
  );
}