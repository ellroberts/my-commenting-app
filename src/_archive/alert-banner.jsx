{/* Comment mode indicator */}
      {commentMode && (
        <div className="fixed bottom-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <MessageCircle size={16} className="inline mr-2" />
          Comment mode active - click anywhere to add a comment
        </div>
      )}