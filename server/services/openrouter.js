require('dotenv').config();

function parseAIJson(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch (_) {}
  try {
    const stripped = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(stripped);
  } catch (_) {}
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch (_) {}
  return null;
}

async function callOpenRouter(prompt, systemPrompt = '', returnJson = false) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseUrl = (process.env.OPENROUTER_BASE_URL || '').replace(/\/$/, '');
  if (baseUrl !== 'https://openrouter.ai/api/v1') throw new Error('OPENROUTER_BASE_URL must be https://openrouter.ai/api/v1');
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') throw new Error('OPENROUTER_API_KEY is required');
  if (!process.env.OPENROUTER_MODEL) throw new Error('OPENROUTER_MODEL is required');

  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const body = JSON.stringify({
    model: process.env.OPENROUTER_MODEL,
    messages,
    max_tokens: 2000,
    temperature: 0.7,
    ...(returnJson ? { response_format: { type: 'json_object' } } : {})
  });

  const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3000',
        'X-Title': 'AI Venue Manager'
      },
      body,
      signal: AbortSignal.timeout(60000)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error?.message || `OpenRouter request failed (${response.status})`);
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error('OpenRouter returned an empty response');
  return { error: false, result: content, parsed: parseAIJson(content), model: data.model, usage: data.usage };
}

module.exports = { callOpenRouter, parseAIJson };
