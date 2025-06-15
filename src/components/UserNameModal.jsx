// src/components/UserNameModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { User, X } from 'lucide-react';

// Generate random user names
const generateRandomName = () => {
  const adjectives = [
    'Creative', 'Smart', 'Helpful', 'Bright', 'Quick', 'Fresh', 'Bold', 'Cool', 
    'Swift', 'Sharp', 'Keen', 'Wise', 'Clear', 'Fast', 'Strong', 'Calm'
  ];
  const nouns = [
    'Designer', 'Reviewer', 'Tester', 'User', 'Collaborator', 'Teammate', 
    'Critic', 'Expert', 'Analyst', 'Observer', 'Evaluator', 'Participant'
  ];
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 999) + 1;
  
  return `${randomAdjective}${randomNoun}${randomNumber}`;
};

export default function UserNameModal({ isOpen, onSubmit, onCancel }) {
  const [name, setName] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Focus the input after the animation starts
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName) {
      setIsAnimating(false);
      setTimeout(() => onSubmit(trimmedName), 150);
    }
  };

  const handleCancel = () => {
    setIsAnimating(false);
    setTimeout(() => onCancel(), 150);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen && isAnimating 
          ? 'bg-black bg-opacity-50 backdrop-blur-sm' 
          : 'bg-black bg-opacity-0'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 ${
          isOpen && isAnimating 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
        onKeyDown={handleKeyDown}
      >
        {/* Close button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#E8C5E3' }}>
            <User className="w-6 h-6" style={{ color: '#A34696' }} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Comment Mode
          </h2>
          <p className="text-sm text-gray-600">
            Let's collaborate to refine this prototype!
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          <div className="mb-6">
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              ref={inputRef}
              id="userName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Johnson"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-base"
              autoComplete="name"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                const randomName = generateRandomName();
                setIsAnimating(false);
                setTimeout(() => onSubmit(randomName), 150);
              }}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 focus:outline-none transition-colors font-medium"
            >
              Use Random Name
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-3 text-white rounded-lg hover:opacity-90 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#A34696' }}
            >
              Continue
            </button>
          </div>
        </form>

        {/* Footer hint */}
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-500 text-center">
            ...
          </p>
        </div>
      </div>
    </div>
  );
}