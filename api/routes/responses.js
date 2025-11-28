const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Save a response
router.post('/', async (req, res) => {
  try {
    const { form_id, question_id, session_id, answer_data, video_timestamp } = req.body;

    if (!form_id || !question_id || !session_id || !answer_data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // First, check if we already have a response record for this session and form
    let responseRecord;
    const { data: existingResponse, error: findError } = await supabase
      .from('responses')
      .select('id')
      .eq('form_id', form_id)
      .eq('session_id', session_id)
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw findError;
    }

    if (existingResponse) {
      // Use existing response record
      responseRecord = existingResponse;
    } else {
      // Create new response record
      const { data: newResponse, error: createError } = await supabase
        .from('responses')
        .insert([{
          form_id,
          session_id,
          viewer_metadata: {
            user_agent: req.headers['user-agent'],
            ip: req.ip,
            timestamp: new Date().toISOString()
          }
        }])
        .select()
        .single();

      if (createError) throw createError;
      responseRecord = newResponse;
    }

    // Save the individual answer
    const { data: answer, error: answerError } = await supabase
      .from('answers')
      .insert([{
        response_id: responseRecord.id,
        question_id,
        answer_data,
        video_timestamp
      }])
      .select()
      .single();

    if (answerError) throw answerError;

    res.json({ success: true, answer });
  } catch (error) {
    console.error('Save response error:', error);
    res.status(500).json({ error: 'Failed to save response' });
  }
});

// Get responses for a form (for form creators to view)
router.get('/form/:formId', async (req, res) => {
  try {
    const { formId } = req.params;

    const { data: responses, error } = await supabase
      .from('responses')
      .select(`
        id,
        session_id,
        viewer_metadata,
        created_at,
        answers (
          id,
          question_id,
          answer_data,
          video_timestamp,
          created_at,
          questions (
            timestamp_seconds,
            question_type,
            question_data
          )
        )
      `)
      .eq('form_id', formId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, responses: responses || [] });
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

module.exports = router;
