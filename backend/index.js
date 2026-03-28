require('dotenv').config();
const express = require("express")
const { userModel } = require("./models");
const { Keypair, Transaction, Connection, clusterApiUrl } = require("@solana/web3.js");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { z } = require("zod");
const bcrypt = require("bcrypt");


const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const app = express()
app.use(express.json())
app.use(cors())
const JWT_SECRET = process.env.JWT_SECRET;

const signupSchema = z.object({
    usernme: z.string().min(3),
    password: z.string().min(4),
});

app.post("/api/v1/signup", async (req, res) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: z.treeifyError(err), // OR parsed.error.flatten().fieldErrors
      });
    }

    const { username, password } = parsed.data;

    const existingUser = await userModel.findOne({
      username,
    });
    if (existingUser) {
      res.json({
        message: "Username already exists..!",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const keyPair = new Keypair();
    await userModel.create({
      username,
      password: hashedPassword,
      privateKey: Buffer.from(keyPair.secretKey).toString("base64"),
      publicKey: keyPair.publicKey.toBase58(),
    });
    res.json({
      message: "User created successfully",
      publicKey: keyPair.publicKey.toBase58(),
    });
  } catch (error) {
    console.log("Signup Error: ", error);
    res.status(500).json({
      error: "Internal Server Error..!",
    });
  }
});

app.post("/api/v1/signin", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const user = await userModel.findOne({
    username: username,
    password: password,
  });

  if (user) {
    const token = jwt.sign(
      {
        id: user,
      },
      JWT_SECRET
    );
    res.json({
      token,
    });
  } else {
    res.status(403).json({
      message: "Credentials are incorrect..!",
    });
  }
});

app.get("api/v1/txn/sign", async (req, res) => {
    try {
        const serializedTransaction = req.body.messsage;
        const username = req.body.username;

        const user = await userModel.findOne({ username });

        if (!user) {
            return res.status(404).json({
                error: "User not found"
            })
        }
        
        const secretBytes = Buffer.from(user.privateKey, "base64");
        const keyPair  = Keypair.fromSecretKey(secretBytes);

        const tx = Transaction.from(Buffer.from(serializedTransaction.data))
        

        const {blockhash} = await connection.getLatestBlockhash();
        tx.blockhash = blockhash;
        tx.feePayer = keyPair.publicKey;
        tx.sign(keyPair)


        const signature = await connection.sendTransaction(tx, [keyPair])
        console.log(signature)

        return res.json({
            message: "Transaction signed and submitted successfully",
            signature: signature,
        });

    } catch (error) {
        console.error("Transaction signing error", error);
        res.status(500).json({
            error: "Failed to sign transaction"
        })
    }
    
})

app.get("api/v1/txn", async (req, res) => {
    const signature = req.query.replace(/["']/g, "").trim();

    if (!signature) {
        return res.status(400).json({
            error: "Missing trasaction signature(id)",
        })
    }

    try {
        const { value } = await connection.getSignatureStatuses([signature]);
        const statusInfo = value[0];

        if (statusInfo) {
            let status;
            if (
                statusInfo.confirmationStatus == "finalized" &&
                statusInfo.err == null
            ) {
                status = "success"
            } else if (statusInfo.err) {
                status = "failed";
            } else {
                status = "processing"
            }

            return res.json({
                message: `Can check your Transaction on https://explorer.solana.com/tx/${signature}?cluster=devnet`, //remove cluster=devnet for mainnet..!
                signatures: [signature],
                status,
            });
        }

        const tx = await connection.getTransaction(signature, {
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0,
        })

        if (tx) {
            const err = tx.meta?.err;
            return res.json({
                message: `Can check your Transaction on https://explorer.solana.com/tx/${signature}?cluster=devnet`,
                signature: [signature],
                status: err ? "failed" : "success",
            })
        }

        return res.status(404).json({
            error: "Transaction not found",
        });
    } catch (error) {
        console.error("Error fetching transaction status:", error);
        res.status(500).json({
            error: "Failed to fetch transaction status",
        })
    }
});

app.listen(3000);