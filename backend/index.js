const express = require("express")
const { userModel } = require("./models");
const { Keypair } = require("@solana/web3.js");
const jwt = require("jsonwebtoken");

const app = express()
app.use(express.json())
const JWT_SECRET = process.env.JWT_SECRET;

app.post("api/v1/signup", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    // validate the inputs using zod, check if the user already exists, hash the password

    const keypair = new Keypair();
    await userModel.create({
        username,
        password,
        publicKey: keypair.publicKey.toString(),
        privateKey: keypair.secretKey.toString()

    })
    res.json({
        message: keypair.publicKey.toString()
    })
})

app.post("api/v1/signin", async (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    const user = await userModel.findOne({
        username: username,
        password: password
    })

    if (user) {
        const token = jwt.sign({
            id: user
        })
        res.json({
            token
        }, JWT_SECRET)
    } else {
        res.status(403).json({
            message: 'Creds are incorrect'

        })
    }
    
})

app.post("api/v1/txn/sign", (rrq, res) => {
    res.json({
        message: "Sign txn"
    })
})

app.post("api/v1/txn", (req, res) => {
    res.json({
        message: "blahhhh"
    })
})

app.listen(3000);