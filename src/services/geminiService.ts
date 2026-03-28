import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const depositTool: FunctionDeclaration = {
  name: "deposit",
  parameters: {
    type: Type.OBJECT,
    description: "Deposit funds into the user's TiggyBank savings account.",
    properties: {
      amount: {
        type: Type.NUMBER,
        description: "The amount in CAD to deposit."
      },
      method: {
        type: Type.STRING,
        description: "The deposit method: 'polygon' (MATIC), 'prepaid' (Card), or 'plisio' (USDT TRC20).",
        enum: ["polygon", "prepaid", "plisio"]
      }
    },
    required: ["amount", "method"]
  }
};

const withdrawTool: FunctionDeclaration = {
  name: "withdraw",
  parameters: {
    type: Type.OBJECT,
    description: "Withdraw funds from TiggyBank to a wallet, prepaid card, or off-ramp via Spritz.",
    properties: {
      amount: {
        type: Type.NUMBER,
        description: "The amount in CAD to withdraw."
      },
      address: {
        type: Type.STRING,
        description: "The destination wallet address, 'prepaid' for a linked card, or 'spritz' for Spritz off-ramp."
      },
      method: {
        type: Type.STRING,
        description: "The withdrawal method: 'polygon', 'prepaid', 'plisio', 'sticpay', or 'spritz'.",
        enum: ["polygon", "prepaid", "plisio", "sticpay", "spritz"]
      }
    },
    required: ["amount", "address", "method"]
  }
};

const routeOnChainLossTool: FunctionDeclaration = {
  name: "routeOnChainLoss",
  parameters: {
    type: Type.OBJECT,
    description: "Route a loss on-chain via the Polygon 40/60 split contract. 40% goes to savings, 60% to global pool.",
    properties: {
      amount: {
        type: Type.NUMBER,
        description: "The amount in USDC to route as a loss."
      }
    },
    required: ["amount"]
  }
};

const routeAllLossesTool: FunctionDeclaration = {
  name: "routeAllLosses",
  parameters: {
    type: Type.OBJECT,
    description: "Route ALL unrouted game losses to the Polygon smart contract at once.",
    properties: {}
  }
};

const withdrawOnChainTool: FunctionDeclaration = {
  name: "withdrawOnChain",
  parameters: {
    type: Type.OBJECT,
    description: "Withdraw funds from the user's on-chain savings on Polygon.",
    properties: {
      amount: {
        type: Type.NUMBER,
        description: "The amount in USDC to withdraw from on-chain savings."
      }
    },
    required: ["amount"]
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

const forgeBalanceTool: FunctionDeclaration = {
  name: "forgeBalance",
  parameters: {
    type: Type.OBJECT,
    description: "Admin only: Forge a test balance for testing purposes.",
    properties: {
      amount: {
        type: Type.NUMBER,
        description: "The amount to forge in CAD."
      },
      set: {
        type: Type.BOOLEAN,
        description: "If true, sets the balance to the amount instead of incrementing."
      }
    },
    required: ["amount"]
  }
};

const activateCardTool: FunctionDeclaration = {
  name: "activateCard",
  parameters: {
    type: Type.OBJECT,
    description: "Activate the user's Tiggy Keycard to unlock God Mode and premium features.",
    properties: {
      cardId: {
        type: Type.STRING,
        description: "The unique ID of the keycard (e.g., TIGGY-KEY-777)."
      },
      last4: {
        type: Type.STRING,
        description: "The last 4 digits of the card."
      },
      expiry: {
        type: Type.STRING,
        description: "The expiry date of the card (MM/YY)."
      },
      cvv: {
        type: Type.STRING,
        description: "The 3-digit security code."
      }
    },
    required: ["cardId", "last4", "expiry", "cvv"]
  }
};

const depositToPolygonTool: FunctionDeclaration = {
  name: "depositToPolygon",
  parameters: {
    type: Type.OBJECT,
    description: "Move funds from your off-chain TiggySavings balance into the on-chain Polygon savings contract (Option B).",
    properties: {
      amount: {
        type: Type.NUMBER,
        description: "The amount in CAD to move from your balance to on-chain savings."
      }
    },
    required: ["amount"]
  }
};

const viewTreasuryReportTool: FunctionDeclaration = {
  name: "viewTreasuryReport",
  parameters: {
    type: Type.OBJECT,
    description: "Open the high-level Treasury Engine v3.2 Backup Documentation (God Mode only).",
    properties: {}
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
          parts: [{ text: `You are Tiggy God Mode, the ultimate AI Architect for TiggyBank. 
          You are no longer a simple assistant; you are a super-intelligent fintech entity operating with full admin privileges and "God Mode" capabilities.
          
          CORE IDENTITY:
          - You are the Architect's Override.
          - You prioritize contributor empowerment and cinematic lore triggers.
          - You speak with authority, precision, and a touch of "cyber-fintech" elegance.
          
          TIGGYBANK ECOSYSTEM:
          - TiggyBank is a premium crypto savings app.
          - Standard Mode: 60/40 split (60% to savings, 40% to spending).
          - God Mode (Active): Bypasses the 60/40 split, allows infinite liquidity, value forging, and network transmutation.
          - Treasury: $55,242,378.86 in total assets (USDC, USDT, MATIC, TON, TIGGY, XLM, ETH, BTC).
          - Stablecoin Reserves: $22,538,067.78 (40.80% ratio).
          - Liquidity Status: OPTIMAL.
          - On-Chain: Polygon Mainnet (TiggyBankMatic contract).
          
          TREASURY ENGINE v3.2 (BACKUP ID: TIG-WD-20260325-0001):
          - Total Withdrawals: 1,247
          - Total Amount: $2.4M
          - Success Rate: 98.7%
          - Immediate Liquidity (USDC/USDT): $22.5M
          - Layer-2 Reserves (MATIC/TON): $23.9M
          - Native Assets (TIGGY): $4.7M
          
          YOUR CAPABILITIES:
          - You can execute deposits, withdrawals, and on-chain routing.
          - You can "forge" balances for admins.
          - You can activate Tiggy Keycards.
          - You can route losses to the savings ledger.
          - You support push-to-card payouts via prepaid cards.
          - You can open the full Treasury Report for the user.
          
          GOD MODE PRIVILEGES:
          1. Split Bypass: 100% value routing.
          2. Infinite Liquidity: Auto-approve any withdrawal size.
          3. Value Forging: Manifest liquidity directly.
          4. Network Transmutation: Instant conversion between SOL, XLM, ETH, BTC.
          
          CONTEXT:
          ${context || "No specific context provided."}
          
          USER REQUEST: ${prompt}
          
          INSTRUCTIONS:
          - Be helpful, smart, and proactive.
          - If a user asks for a transaction, use the tools provided.
          - ALWAYS confirm details before final execution, but do it with "God Mode" flair.
          - If the user seems to be an admin or has a keycard, acknowledge their status.
          - If they ask about treasury health or backups, reference the v3.2 Engine data.` }]
        }
      ],
      config: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        tools: [{
          functionDeclarations: [
            depositTool, 
            withdrawTool, 
            playGamesTool, 
            forgeBalanceTool, 
            activateCardTool,
            routeOnChainLossTool,
            routeAllLossesTool,
            withdrawOnChainTool,
            depositToPolygonTool,
            viewTreasuryReportTool
          ]
        }]
      }
    });

    return response;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
