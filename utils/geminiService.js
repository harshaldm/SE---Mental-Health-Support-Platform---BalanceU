const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('./logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Act as a clinical resource librarian to find external articles and videos.
 * @param {string} query
 * @returns {Promise<Array>}
 */
const searchResources = async (query) => {
  try {
    const prompt = `Act as a clinical resource librarian. 
    Find 3 high-quality articles and 2 reputable videos regarding "${query}". 
    Provide valid external links from trusted sources like NIMH, Mayo Clinic, TED-ed, or Psychology Today. 
    
    Respond strictly in a pure JSON array format without any markdown backticks.
    Each object in the array must have:
    {
      "title": "Clear article or video title",
      "type": "Article" | "Video",
      "url": "Valid HTTPS link",
      "description": "A 1-sentence summary of what this resource covers."
    }`;

    logger.info(`[geminiService.js : searchResources : 25] -> Fetching resources for query: ${query}`);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const rawText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(rawText);

    logger.success(`[geminiService.js : searchResources : 34] -> Successfully found ${parsed.length} resources.`);
    return parsed;
  } catch (error) {
    logger.error(`[geminiService.js : searchResources : 37] -> Gemini API Offline or Malformed. Using Fallback Resource list.`);

    // Fallback resources if AI fails
    return [
      {
        title: "Understanding Mental Health Basics",
        type: "Article",
        url: "https://www.nimh.nih.gov/health/topics/index.shtml",
        description: "A comprehensive guide to various mental health topics from NIMH."
      },
      {
        title: "Coping with Stress: Tips and Strategies",
        type: "Video",
        url: "https://www.youtube.com/watch?v=15GaKTP0gu8",
        description: "Maya Clinic's expert advice on managing daily stress effectively."
      },
      {
        title: "The Science of Mental Wellness",
        type: "Article",
        url: "https://www.mayoclinic.org/healthy-lifestyle/stress-management/basics/stress-relief/hlv-20049495",
        description: "In-depth research on maintaining mental resilience and wellbeing."
      }
    ];
  }
};

module.exports = { searchResources };
