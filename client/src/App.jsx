import './App.css'
import axios from "axios"
import {Transaction, Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL} from "@solana/web3.js"

const connection  = new Connection("https://solana-devnet.g.alchemy.com/v2/rjOaDuhdBO1Uim1Sp3bFe")
const fromPubkey = new PublicKey("HYXEcmXPXkVP9b6aASiVPjbutc9DLaU6BLoG8CBFGhv")

function App() {
  
  async function sendSol() {
    const ix = SystemProgram.transfer({
      fromPubkey: fromPubkey,
      toPubkey: new PublicKey
      ("7Sxw9mxyUVcHGBQaU5CaTcdZ2pMiBXD4th32VVdonSGW"),
      lamports: 0.001 * LAMPORTS_PER_SOL
    })
    const tx = new Transaction().add(ix);

    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash
    tx.feePayer = fromPubkey
    
    //convert the txn to a bunch of bytes
    const serializedTx = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    }).toString('base64')

    console.log(serializedTx)

    await axios.post("http://localhost:3000/api/v1/txn/sign", {
      message: serializedTx,
      retry: false
    })

    
  }

  return <div>
    <input type="text" placeholder='Amount'></input>
    <input type="text" placeholder="Address"></input>
    <button onClick={sendSol}>Submit</button>
  </div>
}

export default App
