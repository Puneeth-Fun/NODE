import { db } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { data, apiKey } = req.body;
    if (!apiKey || !apiKey.trim().startsWith('AIza')) {
      return res.status(400).json({ error: 'Please enter a valid Gemini API key first' });
    }
    const prompt = `Fix this malformed data to make it valid JSON or CSV format. Return ONLY the corrected data, no explanations:\n\n${data}`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, topK: 1, topP: 0.8, maxOutputTokens: 8192 }
        })
      }
    );
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    const result = await response.json();
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }
    // Remove all triple backticks (```), not just at start/end, and trim
    let correctedData = result.candidates[0].content.parts[0].text;
    // Remove all leading/trailing code blocks (``` or ```json, etc.) and trim whitespace
    correctedData = correctedData.replace(/^```[\w]*\s*([\r\n])?/i, '')
                                 .replace(/([\r\n])?```\s*$/i, '')
                                 .trim();
    // If still wrapped in code block (sometimes AI returns double code blocks), remove again
    correctedData = correctedData.replace(/^```[\w]*\s*([\r\n])?/i, '').replace(/([\r\n])?```\s*$/i, '').trim();
    // Try to parse the corrected data to check for errors
    let parseError = null;
    try {
      JSON.parse(correctedData);
    } catch (err) {
      parseError = err.message;
    }
    if (parseError) {
      // Store error and data in Turso DB (fix_errors)
      try {
        await db.execute(
          'INSERT INTO fix_errors (data, error) VALUES (?, ?)',
          [data, parseError]
        );
      } catch (dbErr) {
        console.error('Turso DB error:', dbErr);
      }
    }
    return res.json({ correctedData });
  } catch (error) {
    // Store error and data in Turso DB (api_errors)
    try {
      await db.execute(
        'INSERT INTO api_errors (data, error, endpoint) VALUES (?, ?, ?)',
        [req.body.data || '', error.message, '/api/fix']
      );
    } catch (dbErr) {
      console.error('Turso DB error:', dbErr);
    }
    return res.status(400).json({ error: error.message });
  }
}
