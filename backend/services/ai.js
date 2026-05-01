// ====================================================
// RIZQARA EXTRACTION — AI Insight Generator
// ====================================================

const OpenAI = require('openai').default;

async function generateAIInsight(lead, apiKey) {
  if (!apiKey) return null;
  try {
    const openai = new OpenAI({ apiKey });
    const summary = buildLeadSummary(lead);

    const chat = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      max_tokens: 120,
      messages: [
        {
          role: 'system',
          content: 'You are a sales intelligence assistant. Given a business lead profile, write a 1-2 sentence insight on why they need digital services and what to pitch. Be specific and concise.'
        },
        {
          role: 'user',
          content: `Business: ${summary}`
        }
      ]
    });

    return chat.choices[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('AI insight error:', err.message);
    return null;
  }
}

function buildLeadSummary(lead) {
  const parts = [];
  if (lead.name) parts.push(`Name: ${lead.name}`);
  if (lead.category) parts.push(`Category: ${lead.category}`);
  if (lead.rating) parts.push(`Rating: ${lead.rating}`);
  if (lead.website) parts.push('Has website');
  else parts.push('No website');
  if (lead.email) parts.push('Has email');
  if (lead.facebook || lead.instagram) parts.push('Has social media');
  if (lead.techStack) parts.push(`Tech: ${lead.techStack}`);
  if (lead.mobileIssue) parts.push('No mobile optimization');
  if (lead.sslIssue) parts.push('No SSL');
  return parts.join(', ');
}

module.exports = { generateAIInsight };
