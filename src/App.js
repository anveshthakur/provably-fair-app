import './App.css';
import { useState, useEffect } from 'react';

//Smart Contract
import { clusterApiUrl, Connection, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Program, Provider, web3 } from '@project-serum/anchor';
import idl from './idl.json';
import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';


//Associated Account
import { getOrCreateAssociatedAccount } from './utilities/getOrCreateAssociatedAccounts';

//axios
import axios from './axios-nft';

//components
import Challenges from './Components/Challenges';
import { sendTxUsingExternalSignature } from './utilities/ExternalWallet';

//Wallets
const wallets = [ getPhantomWallet() ]
//System Program and Keypair
const { SystemProgram, Keypair } = web3;
//Base Account in which all the game transactions will take place.
const baseAccount = Keypair.generate();
//options with Commitment = "processed"
const opts = {
  preflightCommitment: "processed"
}

//secret key
const secretKey = [117,100,11,230,238,248,239,156,101,16,209,129,156,20,229,235,81,201,168,58,171,54,223,92,52,188,151,60,35,53,150,197,37,79,29,180,143,83,104,100,81,6,176,113,11,243,198,194,104,141,149,169,47,85,45,213,137,84,165,151,179,216,46,148]
const secret = Uint8Array.from(secretKey);
const key = Keypair.fromSecretKey(secret);

//program id for the idl
const programID = new PublicKey(idl.metadata.address);

//network devnet
const network = clusterApiUrl("devnet");

//connection
const con = new Connection(
      clusterApiUrl('devnet'),
      'confirmed',
);

function App() {
  //state for value , DataList, input 
  const [value, setValue] = useState('');
  const [dataList, setDataList] = useState([]);
  const [input, setInput] = useState('');
  const [norse, setNorse] = useState([]);
  const [cards, setCards] = useState();

  useEffect(() => {
    axios.get("https://nft-game-e9370-default-rtdb.asia-southeast1.firebasedatabase.app/Norse-god.json")
      .then(response => {
        console.log(response.data);
        setNorse(response.data);
      })
      .catch(err => console.log(err))
  }, [])
    
  //user's wallet
  const wallet = useWallet();

  //getting the provider  
  async function getProvider() {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, wallet, opts.preflightCommitment,
    );
    return provider;
  }

  // Game initialize instructions
  async function initialize() {    
    const provider = await getProvider();

    /* create the program interface combining the idl, program ID, and provider */
    const program = new Program(idl, programID, provider);


    //taking a 0.1 SOL from the user as fee
    const ix = SystemProgram.transfer({
          fromPubkey: provider.wallet.publicKey,
          toPubkey: key.publicKey,
          lamports: 100000000,
      });

    await sendTxUsingExternalSignature([ix], con, null, [], provider.wallet.publicKey);

    try {
      await program.rpc.initialize("Hello World", {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
    });

      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      console.log('account: ', account);
      setValue(account.data.toString());
      setDataList(account.dataList);
    } catch (err) {
      console.log("Transaction error: ", err);
    }
  }

  //Update instruction for adding a new card.
  async function update() {
    if (!input) return
    const provider = await getProvider();    
    const program = new Program(idl, programID, provider);
    
    // const ss = new Keypair();
    // const randomseed = ss.publicKey.toString();
    
    await program.rpc.update(input,{
      accounts: {
        baseAccount: baseAccount.publicKey
      }
    });
    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    console.log('account: ', account);
    setValue(account.data.toString());
    setDataList(account.dataList);
    setInput('');
    return account.dataList;
  }
  const signTransaction = async(transaction) => {
    return await sendAndConfirmTransaction(
      con,
      transaction,
      [key],
      {commitment: 'confirmed'},
    );

  }

  //Making the NORSE GODS and Minting the 
  const norseGodHandler = async() => {
  let tokenDestAssociatedAddress = "";
    if(dataList.length < 3){
    let card = await update();
    // let name = norse[card[card.length - 1]].name;
    let mintAddress = norse[card[card.length - 1]].Mint

    //Associated Account
    tokenDestAssociatedAddress = await getOrCreateAssociatedAccount(
          wallet.publicKey.toString(),
          mintAddress,
          wallet.publicKey.toString()
    ).catch(err => console.log(err))

    let associatedfromAddress = await getOrCreateAssociatedAccount(
          key.publicKey.toString(),
          mintAddress,
          wallet.publicKey.toString()
    ).catch(err => console.log(err))

    // console.log(tokenDestAssociatedAddress.toString(), '***toAccount');
    // console.log(associatedfromAddress.toString(), '***fromAccount');
    // console.log(key.publicKey.toString(), '***innerWallet');
    // console.log(mintAddress, "***mint");
    // console.log(name, "***name");

    const transaction = new Transaction().add(
        Token.createTransferInstruction(
          TOKEN_PROGRAM_ID,
          new PublicKey(associatedfromAddress.toString()),  // associatedfromAddress,      //src
          new PublicKey(tokenDestAssociatedAddress.toString()),  // tokenDestAssociatedAddress, //dest
          key.publicKey,    //owner
          [],    //multi
          1,     //amount
      ),
    
    
    )

    await setTimeout(async() => {
      let sign = await signTransaction(transaction);
      console.log(sign, "***SIGNATURE");
      
      // let norseBack = norse; 
      // norseBack.splice(card[card.length - 1], 1);
      
      // console.log(norseBack);

      // axios.put("/Norse-god.json", norse)
      // .then(response => console.log(response))
      // .catch(err => console.log(err))  
    
    }, 5000);
  }  
  else{
      console.log("Already Have 3 Cards it's time to play")
    }
  }

  // Creating the Combat Cards and Calculating the Scores.
  //FIREBASE - POST - 1
  const createCombatCards = async() => {
    if(dataList < 3) console.log("You Should Make Some Cards First");    
    else{
      
      let total_Score = (norse[dataList[0]].HP + norse[dataList[0]].Strength + norse[dataList[1]].HP + norse[dataList[1]].Strength + norse[dataList[2]].HP + norse[dataList[2]].Strength);
      let userCardsObject = {
        user: wallet.publicKey.toString(),
        cards: [
          norse[dataList[0]],
          norse[dataList[1]],
          norse[dataList[2]],
        ],
        score: total_Score 
      }
      
      setCards(userCardsObject);
      console.log(userCardsObject);
    }
  }

  //FIREBASE - POST - 2
  //temp account --> backend --> challenger ki ekk nft transfer
  const createChallenge = async() => {
    if(dataList < 3) console.log("You Should Make Some Cards First");
    else{
    let total_Score = (norse[dataList[0]].HP + norse[dataList[0]].Strength + norse[dataList[0]].Speed + norse[dataList[1]].HP + norse[dataList[1]].Strength + norse[dataList[1]].Speed + norse[dataList[2]].HP + norse[dataList[2]].Strength + norse[dataList[2]].Speed);
    let userCardsObject = {
        user: wallet.publicKey.toString(),
        cards: [
          norse[dataList[0]],
          norse[dataList[1]],
          norse[dataList[2]],
        ], 
        score: total_Score,
        challenge: "active",
      }
      
      console.log(userCardsObject);

    axios.post('/users-challenge-active.json', userCardsObject)
        .then(response => console.log(response))
        .catch(error => console.log(error));

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }

  if (!wallet.connected) {  
    return (
      <>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop:'100px' }}>
        <WalletMultiButton />
      </div>
      </>
    )

  } else {    
    return (
      <>
      <div className="App">
        <div>
          {
            !value && (
              <>
              <button onClick={initialize}>Initialize</button>
              </>
            )
          }
          {
            value ? (
              <div>
                <input
                  placeholder="Your Random User Seed"
                  onChange={e => setInput(e.target.value)}
                  value={input}
                />
                <br />
                <br />
                <button onClick={norseGodHandler}>Pick NFT</button>
                <br />
                <br />
                <button onClick={createCombatCards}>Create Combat Cards</button>
                <br />
                <br />
                <button onClick={createChallenge}>Post a Challenge!!</button>
              </div>
            
            ) : (
              <h3>Please Initialize.</h3>
            )
          }
          <br />
          {
            dataList.map((d, i) => 
            <h4 key={i}> 
              <ul style = {{listStyle: 'none'}}>
                <li>Name: {norse[d].name}</li> 
                <li>Level: {norse[d].Rarity}</li>
                <li>Hp: {norse[d].HP}</li>
                <li>Strength: {norse[d].Strength}</li>
                <li>Speed: {norse[d].Speed}</li>
              </ul>
            </h4>
            )          
          }        
        </div>
      </div>
      <br />
        <Challenges userCards = {cards} />
      </>
    );
  }
}

const AppWithProvider = () => (
  <ConnectionProvider endpoint={network}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)

export default AppWithProvider;
// 0.00268 + 0.00001