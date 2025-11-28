const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Get all forms
router.get('/', async (req, res) => {
  try {
    const { data: forms, error } = await supabase
      .from('forms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ forms: forms || [] });
  } catch (error) {
    console.error('Forms error:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

// Get a specific form with its questions
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get form details
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', id)
      .single();

    if (formError) throw formError;
    if (!form) return res.status(404).json({ error: 'Form not found' });

    // Get questions for this form
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('form_id', id)
      .order('timestamp_seconds', { ascending: true });

    if (questionsError) throw questionsError;

    res.json({
      form: {
        ...form,
        questions: questions || []
      }
    });
  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});

// Create a new form
router.post('/', async (req, res) => {
  try {
    const { title, youtube_video_id, is_published } = req.body;

    if (!title || !youtube_video_id) {
      return res.status(400).json({ error: 'Title and YouTube video ID are required' });
    }

    const { data: form, error } = await supabase
      .from('forms')
      .insert([{
        title,
        youtube_video_id,
        is_published: is_published || false
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, form });
  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({ error: 'Failed to create form' });
  }
});

// Update a form
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, youtube_video_id, is_published } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (youtube_video_id !== undefined) updateData.youtube_video_id = youtube_video_id;
    if (is_published !== undefined) updateData.is_published = is_published;
    updateData.updated_at = new Date().toISOString();

    const { data: form, error } = await supabase
      .from('forms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!form) return res.status(404).json({ error: 'Form not found' });

    res.json({ success: true, form });
  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

// Delete a form
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

// Add a question to a form
router.post('/:id/questions', async (req, res) => {
  try {
    const { id: form_id } = req.params;
    const { timestamp_seconds, question_type, question_data, display_order } = req.body;

    if (!timestamp_seconds || !question_type || !question_data) {
      return res.status(400).json({ error: 'Timestamp, question type, and question data are required' });
    }

    const { data: question, error } = await supabase
      .from('questions')
      .insert([{
        form_id,
        timestamp_seconds,
        question_type,
        question_data,
        display_order: display_order || 0
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, question });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// Update a question
router.put('/:formId/questions/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const { timestamp_seconds, question_type, question_data, display_order } = req.body;

    const updateData = {};
    if (timestamp_seconds !== undefined) updateData.timestamp_seconds = timestamp_seconds;
    if (question_type !== undefined) updateData.question_type = question_type;
    if (question_data !== undefined) updateData.question_data = question_data;
    if (display_order !== undefined) updateData.display_order = display_order;

    const { data: question, error } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', questionId)
      .select()
      .single();

    if (error) throw error;
    if (!question) return res.status(404).json({ error: 'Question not found' });

    res.json({ success: true, question });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Delete a question
router.delete('/:formId/questions/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId);

    if (error) throw error;

    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

module.exports = router;
