const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyze free-text quiz responses using Google Gemini.
 * Returns a 3-sentence counselor-oriented summary.
 *
 * @param {Array<{question: string, text: string}>} responses
 * @returns {Promise<string|null>} AI summary or null if no text / API fails
 */
const analyzeResponses = async (responses) => {
  try {
    // Filter to only responses that have free-text content
    const textResponses = responses.filter(r => r.text && r.text.trim());

    if (textResponses.length === 0) {
      return null; // No text to analyze
    }

    const formattedResponses = textResponses
      .map((r, i) => `Q${i + 1}: "${r.question}"\nResponse: "${r.text}"`)
      .join('\n\n');

    const prompt = `You are a clinical psychology assistant helping a licensed counselor review a student's mental health assessment responses.

Analyze these ${textResponses.length} responses for:
1. Emotional tone (e.g., hopeless, anxious, neutral)
2. Cognitive distortions (e.g., catastrophizing, all-or-nothing thinking)
3. Specific triggers or stressors mentioned

Student responses:
${formattedResponses}

Provide a 3-sentence summary for a counselor. Be professional, empathetic, and concise.
Also, assign a calculated risk level. The string riskLevel must be exactly one of: "No Risk", "Low", "Medium", or "High Risk".

Respond strictly in pure JSON without markdown backticks, using the following structure:
{
  "summary": "...",
  "riskLevel": "..."
}`;

    console.log('─── 📤 Sending Prompt to Gemini ───');
    console.log(prompt);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);

    // Parse the JSON string
    const responseText = result.response.text();
    console.log('─── 📥 Raw Response from Gemini ───');
    console.log(responseText);

    const rawText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(rawText);

    console.log('─── ⚙️ Parsed AI JSON ───');
    console.log(JSON.stringify(parsed, null, 2));

    return parsed;
  } catch (error) {
    console.error('❌ Gemini analysis failed:', error.message);
    // Throw error if it's a parsing issue or serious API failure to let controller handle it
    if (error instanceof SyntaxError) {
      console.error('JSON Parsing Error in AI Response');
    }
    return null; // Non-blocking fallback
  }
};

module.exports = { analyzeResponses };
