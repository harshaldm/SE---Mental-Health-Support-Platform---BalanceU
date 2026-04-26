const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('./logger');

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

    const prompt = `You are a clinical psychology assistant analyzing a student's mental health assessment (GAD-7 or PHQ-9).
    
    Analyze these ${textResponses.length} responses for:
    1. Emotional tone and cognitive distortions.
    2. Potential clinical patterns (e.g., "Signs of Burnout", "Consistent with Social Anxiety", "Adjustment Stress").
    3. Specific triggers or stressors mentioned.

    Student responses:
    ${formattedResponses}

    Respond strictly in pure JSON without markdown backticks, using the following structure:
    {
      "summary": "3-sentence empathetic and professional observation for the student.",
      "riskLevel": "Low, Medium, or High (based on text severity)",
      "potentialPattern": "A short 2-4 word clinical observation badge (e.g., 'Anxious Patterns')",
      "disclaimer": "This is an AI-generated observation, not a medical diagnosis."
    }`;

    logger.info(`[geminiAnalysis.js : analyzeResponses : 43] -> Sending prompt to Gemini...`);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    let result;
    try {
      result = await model.generateContent(prompt);
      logger.success(`[geminiAnalysis.js : analyzeResponses : 49] -> Gemini call successful.`);
    } catch (apiErr) {
      logger.error(`[geminiAnalysis.js : analyzeResponses : 51] -> WARNING: Gemini API failed. Injecting Offline Fallback.`);
      return {
        summary: "AI Analysis Offline. Your counselor will review your detailed responses manually to provide the best support.",
        riskLevel: "Manual Review Required",
        potentialPattern: "Assessment Pending",
        disclaimer: "AI observation is temporarily unavailable. Data has been securely saved for professional review."
      };
    }

    // Parse the JSON string
    const responseText = result.response.text();
    const rawText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsed = JSON.parse(rawText);
      return parsed;
    } catch (parseErr) {
      logger.error(`[geminiAnalysis.js : analyzeResponses : 65] -> JSON Parsing Error. Injecting Offline Fallback.`);
      return {
        summary: "AI Analysis Offline. Your counselor will review your detailed responses manually to provide the best support.",
        riskLevel: "Manual Review Required",
        potentialPattern: "Assessment Pending",
        disclaimer: "AI observation is temporarily unavailable. Data has been securely saved for professional review."
      };
    }
  } catch (error) {
    logger.error(`[geminiAnalysis.js : analyzeResponses : 74] -> Fatal Error: ${error.message}`);
    return {
      summary: "AI Analysis Offline. Your counselor will review your detailed responses manually to provide the best support.",
      riskLevel: "Manual Review Required",
      potentialPattern: "Assessment Pending",
      disclaimer: "AI observation is temporarily unavailable. Data has been securely saved for professional review."
    };
  }
};

module.exports = { analyzeResponses };
