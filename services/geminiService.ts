
import { GoogleGenAI, Type } from "@google/genai";
import { MarketOracleResponse } from "../types";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLevel = async (level: number): Promise<MarketOracleResponse> => {
  try {
    const prompt = `Generate a crypto-themed breakout game level for LEVEL ${level}. 
    Context:
    - Level 1: Standard market.
    - Level 2: Volatility increases (BTC/ETH blocks will move in game logic).
    - Level 3+: High volatility (SOL blocks also move).
    
    Based on imaginary market sentiment for Level ${level}:
    1. Create a 10 columns by 8 rows grid (80 items total). Use 0 (empty), 1 (BTC), 2 (ETH), 3 (SOL), 4 (USDT).
    2. Determine a 'targetTimeSeconds' (integer between 60 and 300) which is a challenging but achievable time to clear the level. Harder levels or denser grids should have more time.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            levelName: {
              type: Type.STRING,
              description: `A creative name for Level ${level} market condition (e.g. 'The Flippening', 'Whale Alert')`,
            },
            marketAnalysis: {
              type: Type.STRING,
              description: "A short, witty description of the market vibe (max 1 sentence).",
            },
            marketSentiment: {
              type: Type.STRING,
              enum: ["BULLISH", "BEARISH", "VOLATILE"],
              description: "The overall sentiment affecting game physics.",
            },
            grid: {
              type: Type.ARRAY,
              items: {
                type: Type.INTEGER,
              },
              description: "A flat array of exactly 80 integers representing the 10x8 grid. Values 0-4.",
            },
            targetTimeSeconds: {
              type: Type.INTEGER,
              description: "The par time in seconds to complete this level for bonus points.",
            }
          },
          required: ["levelName", "marketAnalysis", "marketSentiment", "grid", "targetTimeSeconds"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as MarketOracleResponse;
    }
    throw new Error("No response from Oracle");
  } catch (error) {
    console.error("Gemini generation error:", error);
    // Fallback level
    return {
      levelName: `Offline Genesis Block L${level}`,
      marketAnalysis: "Network disconnected. Using local genesis block.",
      marketSentiment: "VOLATILE",
      grid: Array(80).fill(0).map((_, i) => (i % 2 === 0 ? 1 : 4)),
      targetTimeSeconds: 120
    };
  }
};
