const https = require('https');
require('dotenv').config();

const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

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

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    if (process.env.NODE_ENV === 'production') {
      return { error: true, message: 'AI service not configured' };
    }
    return { error: false, result: generateFallbackResponse(prompt) };
  }

  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const body = JSON.stringify({
    model: MODEL,
    messages,
    max_tokens: 2000,
    temperature: 0.7,
    ...(returnJson ? { response_format: { type: 'json_object' } } : {})
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3000',
        'X-Title': 'AI Venue Manager'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.choices && parsed.choices[0]) {
            const content = parsed.choices[0].message.content;
            resolve({
              error: false,
              result: content,
              parsed: parseAIJson(content),
              model: parsed.model,
              usage: parsed.usage
            });
          } else if (parsed.error) {
            resolve({ error: true, message: parsed.error.message || 'OpenRouter API error' });
          } else {
            resolve({ error: true, message: 'Unexpected response format' });
          }
        } catch (e) {
          resolve({ error: true, message: 'Failed to parse response' });
        }
      });
    });

    req.on('error', (e) => resolve({ error: true, message: e.message }));
    req.setTimeout(30000, () => { req.destroy(); resolve({ error: true, message: 'Request timed out' }); });
    req.write(body);
    req.end();
  });
}

function generateFallbackResponse(prompt) {
  const lower = prompt.toLowerCase();

  if (lower.includes('pricing') || lower.includes('ticket') || lower.includes('price')) {
    return `## AI Pricing Analysis\n\n**Demand Assessment:** Based on the event parameters, current demand is estimated at **moderate-high** levels.\n\n**Recommended Pricing Strategy:**\n- **Early Bird (first 20% of sales):** 15% discount from base price\n- **Standard Phase:** Base price maintained\n- **High Demand (>70% sold):** Increase by 20-30%\n- **Last Minute (<48hrs, <90% sold):** 10% discount to fill remaining seats\n\n*Configure your OpenRouter API key for personalized AI-powered analysis.*`;
  }
  if (lower.includes('feasib') || lower.includes('rider') || lower.includes('tech')) {
    return `{"feasible":true,"missing_items":[],"total_procurement_cost":2500,"recommendations":["Verify sound system coverage","Confirm monitor mix count","Check load-in timeline"]}`;
  }
  if (lower.includes('settlement') || lower.includes('narrative')) {
    return `{"executive_summary":"Event performed above projections.","financial_highlights":"Ticket revenue exceeded target by 12%.","performer_payment":15000,"net_revenue":42000,"insights":["Concessions drove 18% of total revenue","Marketing ROI was 3.2x"]}`;
  }
  if (lower.includes('seat') || lower.includes('recommend')) {
    return `{"recommended_seats":[{"row":"C","seat":"101-104","section":"Main Floor","reason":"Best sightlines, central position"}],"alternative_options":[{"row":"F","seat":"201-204","section":"Mezzanine","reason":"Elevated view, no obstructions"}]}`;
  }
  return `## AI Analysis\n\nBased on your query, here are key recommendations for venue management optimization.\n\n*Configure your OpenRouter API key for personalized AI-powered analysis.*`;
}

module.exports = { callOpenRouter, parseAIJson };
