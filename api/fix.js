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
    const correctedData = result.candidates[0].content.parts[0].text
      .replace(/^```[\w]*\n?/, '')
      .replace(/\n?```$/, '')
      .trim();
    return res.json({ correctedData });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
