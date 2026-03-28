import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import { ethers } from "ethers";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = admin.initializeApp({
  projectId: firebaseConfig.projectId,
});
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

function makePlisioHash(payload: Record<string, any>, secretKey: string) {
  const sorted = Object.keys(payload)
    .sort()
    .map((k) => `${k}=${payload[k]}`)
    .join('&');

  return crypto
    .createHmac('sha256', secretKey)
    .update(sorted)
    .digest('hex');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Plisio Invoice Creation Endpoint
  app.post("/api/plisio/create-invoice", async (req, res) => {
    try {
      const { amount, currency, order_name, uid } = req.body;
      const secretKey = process.env.PLISIO_SECRET_KEY;
      const apiKey = process.env.PLISIO_API_KEY;

      if (!secretKey || !apiKey) {
        return res.status(500).json({ error: "Plisio configuration missing" });
      }

      const orderNumber = `${uid}_${Date.now()}`;
      const payload: Record<string, any> = {
        api_key: apiKey,
        currency: currency || "USDT_TRC20",
        order_number: orderNumber,
        order_name: order_name || "Tiggy Deposit",
        amount: amount.toString(),
        callback_url: `${process.env.APP_URL}/api/plisio/callback`,
        success_url: `${process.env.APP_URL}/deposit-success`,
      };

      const hash = makePlisioHash(payload, secretKey);
      
      const response = await fetch(`https://plisio.net/api/v1/operations/create?${new URLSearchParams({
        ...payload,
        hash
      })}`);

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Plisio Error:", error);
      res.status(500).json({ error: "Failed to create Plisio invoice" });
    }
  });

  // Plisio Payout Endpoint
  app.post("/api/plisio/payout", async (req, res) => {
    try {
      const { amount, to, currency, uid, method } = req.body;
      const secretKey = process.env.PLISIO_SECRET_KEY;
      const apiKey = process.env.PLISIO_API_KEY;

      if (!secretKey || !apiKey) {
        return res.status(500).json({ error: "Plisio configuration missing" });
      }

      const payload: Record<string, any> = {
        api_key: apiKey,
        currency: currency || "USDT_TRC20",
        amount: amount.toString(),
        to: to,
        type: 'cashout'
      };

      const hash = makePlisioHash(payload, secretKey);
      
      const response = await fetch(`https://plisio.net/api/v1/operations/withdraw?${new URLSearchParams({
        ...payload,
        hash
      })}`);

      const data = await response.json();
      
      if (data.status === 'success') {
        // Log transaction if successful
        if (uid) {
          await db.collection('transactions').add({
            uid,
            amount: -parseFloat(amount),
            type: 'withdrawal',
            status: 'completed',
            method: method || 'plisio',
            txHash: data.data.txn_id,
            timestamp: new Date().toISOString(),
            description: `${method === 'sticpay' ? 'STIC PAY' : 'Plisio'} Payout: ${payload.currency} ${payload.amount} to ${to}`
          });
        }
      }

      res.json(data);
    } catch (error) {
      console.error("Plisio Payout Error:", error);
      res.status(500).json({ error: "Failed to process Plisio payout" });
    }
  });

  // Plisio Callback Endpoint
  app.post("/api/plisio/callback", async (req, res) => {
    try {
      const payload = req.body;
      const receivedHash = req.headers['x-plisio-hash'] || payload.hash;
      const secretKey = process.env.PLISIO_SECRET_KEY;

      if (secretKey && receivedHash) {
        const { hash, ...dataToHash } = payload;
        const calculatedHash = makePlisioHash(dataToHash, secretKey);
        
        if (calculatedHash !== receivedHash) {
          console.error("Plisio Callback: Invalid hash");
          return res.status(400).send("Invalid hash");
        }
      }

      // Plisio status: completed, processing, error, mismatch, expired
      if (payload.status === 'completed') {
        const orderNumber = payload.order_number;
        const [uid] = orderNumber.split('_');
        const amount = parseFloat(payload.amount);

        if (uid) {
          console.log(`Plisio Callback: Processing payment for user ${uid}, amount ${amount}`);
          
          const userRef = db.collection('users').doc(uid);
          const userSnap = await userRef.get();

          if (userSnap.exists) {
            const userData = userSnap.data();
            const currentBalance = userData?.balance || 0;
            const newBalance = currentBalance + amount;

            // Update user balance
            await userRef.update({
              balance: newBalance
            });

            // Log transaction
            await db.collection('transactions').add({
              uid,
              amount,
              type: 'deposit',
              status: 'completed',
              method: 'plisio',
              txHash: payload.txn_id,
              timestamp: new Date().toISOString(),
              description: `Plisio Deposit: ${payload.currency} ${payload.amount}`
            });

            console.log(`Plisio Callback: Successfully updated balance for user ${uid}`);
          } else {
            console.error(`Plisio Callback: User ${uid} not found`);
          }
        }
      }
      
      res.status(200).send("OK");
    } catch (error) {
      console.error("Plisio Callback Error:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // On-Chain Deposit Endpoint (Option B: Backend-powered)
  app.post("/api/onchain/deposit", async (req, res) => {
    try {
      const { uid, amountCAD } = req.body;

      if (!uid || !amountCAD || amountCAD <= 0) {
        return res.status(400).json({ error: "Invalid request parameters" });
      }

      // 1. Validate user balance in Firestore
      const userRef = db.collection('users').doc(uid);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userSnap.data();
      const currentBalance = userData?.balance || 0;
      const userWalletAddress = userData?.walletAddress;

      if (!userWalletAddress) {
        return res.status(400).json({ error: "User has no wallet address linked" });
      }

      if (currentBalance < amountCAD) {
        return res.status(400).json({ error: "Insufficient TiggySavings balance" });
      }

      // 2. Deduct balance from Firestore (Atomic update)
      await userRef.update({
        balance: admin.firestore.FieldValue.increment(-amountCAD)
      });

      // 3. Convert CAD to MATIC
      // CAD -> USD -> MATIC
      const CAD_USD_RATE = 0.75;
      const MATIC_USD_RATE = 0.4;
      const maticAmount = (amountCAD * CAD_USD_RATE) / MATIC_USD_RATE;
      
      // 4. Call Polygon Smart Contract
      const rpcUrl = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";
      const privateKey = process.env.TREASURY_PRIVATE_KEY;

      if (!privateKey) {
        // Rollback balance if treasury key is missing (in a real app, use a transaction)
        await userRef.update({ balance: admin.firestore.FieldValue.increment(amountCAD) });
        return res.status(500).json({ error: "Treasury configuration missing" });
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);
      
      const contractAddress = process.env.TIGGY_BANK_MATIC_ADDRESS || "0xeeBA968CB319FBF3BfACcF9d941591C329Ef409B";
      const abi = [
        "function depositFor(address user) public payable",
        "function vaultBalance(address) public view returns (uint256)"
      ];
      
      const contract = new ethers.Contract(contractAddress, abi, wallet);

      // Send transaction
      const tx = await contract.depositFor(userWalletAddress, {
        value: ethers.parseEther(maticAmount.toFixed(18))
      });

      // 5. Wait for confirmation
      const receipt = await tx.wait();

      // 6. Update user's on-chain savings in Firestore (for tracking)
      // Note: The contract handles the 40/60 split, but we track the total CAD value routed
      const onChainSavingsIncrement = amountCAD * 0.4; // Only 40% goes to the user's vault in the contract
      await userRef.update({
        onChainSavings: admin.firestore.FieldValue.increment(onChainSavingsIncrement)
      });

      await db.collection('transactions').add({
        uid,
        amount: -amountCAD,
        type: 'onchain_deposit',
        status: 'completed',
        method: 'polygon',
        txHash: receipt.hash,
        timestamp: new Date().toISOString(),
        description: `Backend Deposit to Polygon: ${maticAmount.toFixed(4)} MATIC (40% to Vault)`
      });

      res.json({
        status: "success",
        txHash: receipt.hash,
        amountCAD,
        maticAmount: maticAmount.toFixed(4),
        newBalance: currentBalance - amountCAD,
        onChainSavingsAdded: onChainSavingsIncrement
      });

    } catch (error: any) {
      console.error("On-Chain Deposit Error:", error);
      res.status(500).json({ error: error.message || "Failed to process on-chain deposit" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
