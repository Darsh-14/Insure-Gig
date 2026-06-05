import { GoogleGenerativeAI } from "@google/generative-ai";

// Use the Vite environment variable instead of hardcoding
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the AI with a safety check to prevent app crashes
let genAI: GoogleGenerativeAI | null = null;
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
} else {
  console.error("VITE_GEMINI_API_KEY is missing from your .env file!");
}

const SYSTEM_INSTRUCTIONS = `
You are the InsureGig AI Assistant. Your goal is to help gig workers understand parametric insurance.
Key InsureGig Facts:
- We provide "Parametric Insurance": claims are paid automatically based on data (weather/server status), not paperwork.
- Target Audience: Delivery partners (Zomato/Swiggy), ride-share drivers, and freelancers.
- Triggers: Heavy rain (5mm+/hr), extreme heat (45°C+), or platform server outages.
- Payouts: Instant transfer to wallet once the weather threshold is met.
- Premiums: Start at ₹20 per week.
- Tone: Helpful, simple, and supportive. Always respond in English unless the user explicitly asks for another language.
Keep answers short and focused on insurance or weather risks.
`;

export async function getGeminiResponse(userPrompt: string) {
  if (!genAI) {
    return "The AI assistant is currently offline. Please check your configuration.";
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_INSTRUCTIONS 
    });

    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting to my brain. Please try again later!";
  }
}