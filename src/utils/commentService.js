// src/utils/commentService.js
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://gadpqoxttsdfohhphrvu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZHBxb3h0dHNkZm9oaHBocnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMjU4MTMsImV4cCI6MjA2NDkwMTgxM30.xZaGTzsqCqYAySE_d3bH5TFWuTEYev99Jiewlyr08U8';

const supabase = createClient(supabaseUrl, supabaseKey);

// Database functions - updated to handle both pixel and percentage positioning
export const commentService = {
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
        // Include both old pixel coordinates (required for NOT NULL columns)
        x: comment.x,
        y: comment.y,
        // And new percentage coordinates (for scale-aware positioning)
        x_percent: comment.x_percent,
        y_percent: comment.y_percent,
        prototype: comment.prototype || null,
        // Explicitly set the current timestamp
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Add comment error:', error);
    }
    
    return { data, error };
  },
  
  async updateComment(id, updates) {
    // Ensure percentages are numbers if they're being updated
    if (updates.x_percent !== undefined) updates.x_percent = Number(updates.x_percent);
    if (updates.y_percent !== undefined) updates.y_percent = Number(updates.y_percent);
    
    const { data, error } = await supabase
      .from('commenting')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase update error:', error);
    }
    
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