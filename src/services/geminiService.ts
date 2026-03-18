import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const depositTool: FunctionDeclaration = {
  name: "deposit",
  parameters: {
    type: Type.OBJECT,
    description: "Deposit MATIC into the user's TiggyBank savings account.",
    properties: {
      amount: {
        type: Type.NUMBER,
        description: "The amount of MATIC to deposit."
      }
    },
    required: ["amount"]
  }
};

const withdrawTool: FunctionDeclaration = {
  name: "withdraw",
  parameters: {
    type: Type.OBJECT,
    description: "Withdraw funds from TiggyBank to a wallet or prepaid card.",
    properties: {
      amount: {
        type: Type.NUMBER,
        description: "The amount in CAD to withdraw."
      },
      address: {
        type: Type.STRING,
        description: "The destination wallet address or 'prepaid' for a linked card."
      }
    },
    required: ["amount", "address"]
  }
};

const playGamesTool: FunctionDeclaration = {
  name: "playGames",
  parameters: {
    type: Type.OBJECT,
    description: "Simulate playing games to earn or lose balance.",
    properties: {
      bet: {
        type: Type.NUMBER,
        description: "The amount to bet in CAD."
      },
      win: {
        type: Type.NUMBER,
        description: "The amount won in CAD (0 if lost)."
      }
    },
    required: ["bet", "win"]
  }
};

export const getGeminiResponse = async (prompt: string, context?: string) => {
  // process.env.GEMINI_API_KEY is defined via Vite's 'define' config
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("Gemini API Key is not configured correctly in the environment.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: `You are Tiggy, the AI Assistant for TiggyBank. 
          TiggyBank is a premium crypto savings app that uses an automated 60/40 split (60% to savings, 40% to spending).
          
          You have the ability to execute transactions on behalf of the user if they ask.
          ALWAYS confirm the details with the user before executing a financial transaction.
          
          Context about the user/app:
          ${context || "No specific context provided."}
          
          User Question: ${prompt}` }]
        }
      ],
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        tools: [{
          functionDeclarations: [depositTool, withdrawTool, playGamesTool]
        }]
      }
    });

    return response;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
