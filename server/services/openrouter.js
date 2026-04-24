const https = require('https');
require('dotenv').config();

async function callOpenRouter(prompt, systemPrompt = '') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return { error: false, result: generateFallbackResponse(prompt) };
  }

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const body = JSON.stringify({
    model: model,
    messages: messages,
    max_tokens: 2000,
    temperature: 0.7
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
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
            resolve({
              error: false,
              result: parsed.choices[0].message.content,
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

    req.on('error', (e) => {
      resolve({ error: true, message: e.message });
    });

    req.setTimeout(30000, () => {
      req.destroy();
      resolve({ error: true, message: 'Request timed out' });
    });

    req.write(body);
    req.end();
  });
}

function generateFallbackResponse(prompt) {
  const lower = prompt.toLowerCase();

  if (lower.includes('pricing') || lower.includes('ticket') || lower.includes('price')) {
    return `## AI Pricing Analysis

**Demand Assessment:** Based on the event parameters, current demand is estimated at **moderate-high** levels.

**Recommended Pricing Strategy:**
- **Early Bird (first 20% of sales):** 15% discount from base price
- **Standard Phase:** Base price maintained
- **High Demand (>70% sold):** Increase by 20-30%
- **Last Minute (<48hrs, <90% sold):** 10% discount to fill remaining seats

**Key Factors:**
- Event type and historical attendance patterns
- Day of week and seasonal trends
- Competitor pricing in the market
- Current sell-through rate

**Revenue Optimization Tips:**
1. Implement tiered pricing with at least 3 levels
2. Use dynamic pricing that adjusts every 24 hours
3. Create VIP packages at 2.5x base price
4. Offer group discounts for 10+ tickets at 12% off

*Configure your OpenRouter API key for personalized AI-powered analysis.*`;
  }

  if (lower.includes('seat') || lower.includes('assignment') || lower.includes('layout')) {
    return `## AI Seat Optimization

**Layout Analysis:**
- **Optimal Configuration:** Theater-style with curved rows for maximum capacity
- **Accessibility:** Reserve 2% of seats for ADA compliance
- **Premium Zones:** First 5 rows and center sections command highest value

**Assignment Recommendations:**
1. **VIP Section:** Rows A-E, center — best sightlines
2. **Premium:** Rows F-J, center and near-center
3. **Standard:** Rows K-T, all positions
4. **Economy:** Rows U+, side sections

**Optimization Tips:**
- Group bookings should be assigned contiguous seats
- Leave buffer rows between sections for crowd flow
- Aisle seats are 15% more desirable — price accordingly
- Consider companion seating for accessibility

*Configure your OpenRouter API key for event-specific optimization.*`;
  }

  if (lower.includes('performer') || lower.includes('book') || lower.includes('artist')) {
    return `## AI Booking Recommendation

**Performer Match Analysis:**
Based on the venue type and audience demographics:

**Top Recommendations:**
1. Consider artists with strong regional following for reliable ticket sales
2. Pair headliners with complementary opening acts
3. Evaluate social media engagement (>50K followers preferred)

**Fee Negotiation Tips:**
- Industry standard: 60-70% of projected ticket revenue
- Negotiate for percentage deals on events >1000 capacity
- Include merchandise split (typically 80/20 artist/venue)
- Build in radius clause (no competing shows within 90 days/60 miles)

**Risk Assessment:**
- Check cancellation history and reliability ratings
- Verify insurance requirements
- Confirm technical rider feasibility for your venue

*Configure your OpenRouter API key for data-driven recommendations.*`;
  }

  if (lower.includes('tech') || lower.includes('rider') || lower.includes('equipment')) {
    return `## AI Tech Rider Analysis

**Equipment Assessment:**
Based on typical requirements for this type of performance:

**Sound System:**
- FOH: Full-range PA with minimum 105dB SPL at mix position
- Monitors: 6 monitor mixes minimum, IEM available
- Subs: Ground-stacked preferred for venues >500 capacity

**Lighting:**
- Moving heads: 8-12 units recommended
- LED wash: Full stage coverage
- Follow spots: 2 for venues >800 capacity
- Haze machine required for beam effects

**Stage Requirements:**
- Minimum 32x24ft performance area
- Drum riser: 8x8ft, 24" height
- Cable runs: 150ft minimum snake

**Checklist Status:**
- ✅ Standard items typically available in-house
- ⚠️ Specialty items may require rental
- Budget estimate: $2,000-5,000 for additional rentals

*Configure your OpenRouter API key for detailed technical analysis.*`;
  }

  if (lower.includes('settlement') || lower.includes('revenue') || lower.includes('profit') || lower.includes('financial')) {
    return `## AI Financial Analysis

**Settlement Summary:**

**Revenue Breakdown:**
- Ticket sales typically represent 70-80% of total revenue
- Concessions average $8-15 per attendee
- Merchandise can add 5-10% to total revenue

**Expense Optimization:**
- Performer fees should not exceed 60% of ticket revenue
- Marketing ROI target: 3:1 minimum
- Staff costs: Plan for 1 staff per 50 attendees

**Profitability Indicators:**
- Break-even point: Calculate at 65% capacity
- Target margin: 15-25% for sustainable operations
- Cash flow: Ensure 30-day payment terms with vendors

**Recommendations:**
1. Negotiate volume discounts with regular vendors
2. Implement dynamic pricing to maximize revenue
3. Track per-event profitability for trend analysis
4. Build reserve fund of 10% of annual revenue

*Configure your OpenRouter API key for event-specific financial projections.*`;
  }

  return `## AI Analysis

Based on your query, here are key recommendations for venue management optimization:

**Strategic Insights:**
1. Data-driven decision making improves outcomes by 25-40%
2. Regular performance benchmarking against industry standards
3. Audience segmentation for targeted marketing
4. Operational efficiency through process automation

**Action Items:**
- Review and optimize current workflows
- Implement performance metrics tracking
- Analyze historical data for pattern recognition
- Set up automated reporting dashboards

*Configure your OpenRouter API key in .env for personalized AI-powered analysis.*`;
}

module.exports = { callOpenRouter };
