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
const secretKey = [94,59,125,86,165,37,107,111,37,75,107,84,244,63,24,194,189,144,57,88,4,169,176,93,14,167,250,92,225,141,204,165,8,21,245,181,119,215,0,172,12,184,117,148,31,83,45,64,114,156,233,10,250,229,60,17,182,182,44,226,187,197,41,185]
const secret = Uint8Array.from(secretKey);
const key = Keypair.fromSecretKey(secret);


//program id for the idl
const programID = new PublicKey(idl.metadata.address);
//network devnet
const network = clusterApiUrl("devnet");
function App() {
  //state for value , DataList, input 
  const [value, setValue] = useState('');
  const [dataList, setDataList] = useState([]);
  const [input, setInput] = useState('');
  const [norse, setNorse] = useState();
  const [cards, setCards] = useState();
  // const [AssociatedTokenAddress ,setAssociatedTokenAddress] = useState(''); 

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

    const ss = new Keypair();
    const randomseed = ss.publicKey.toString()
    
    await program.rpc.update(input.concat(randomseed) , {
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


  //Making the NORSE GODS and Minting the 
  const norseGodHandler = async() => {
  let tokenDestAssociatedAddress = "";

  const con = new Connection(
      clusterApiUrl('devnet'),
      'confirmed',
  );

    if(dataList.length < 3){
    let card = await update();
    let mintAddress = norse[card[card.length - 1] % 4 ].Mint
    // let associatedfromAddress = norse[card[card.length - 1] % 4 ].Address

    //Associated Account
    
    // tokenDestAssociatedAddress = await getOrCreateAssociatedAccount(
    //       wallet.publicKey.toString(),
    //       mintAddress,
    //       wallet.publicKey.toString()
    // )
    
    
    tokenDestAssociatedAddress = await getOrCreateAssociatedAccount(
          wallet.publicKey.toString(),
          mintAddress,
          wallet.publicKey.toString()
    )

    let associatedfromAddress = await getOrCreateAssociatedAccount(
          key.publicKey.toString(),
          mintAddress,
          wallet.publicKey.toString()
    )

    // tokenDestAssociatedAddress = tokenDestAssociatedAddress.toString();
    // associatedfromAddress = associatedfromAddress.toString();

    // console.log(tokenDestAssociatedAddress, '***toAccount');
    // console.log(associatedfromAddress, '***fromAccount');
    // console.log(key.publicKey.toString(), '***innerWallet');
    // console.log(mintAddress, "***mint");

    const transaction = new Transaction().add(
    Token.createTransferInstruction(
      TOKEN_PROGRAM_ID,
      associatedfromAddress,      //src
      tokenDestAssociatedAddress, //dest
      key.publicKey,//owner
      [],//multi
      1,//amount
    ),
    )

    const signature = await sendAndConfirmTransaction(
      con,
      transaction,
      [key],
      {commitment: 'confirmed'},
    );

    console.log('SIGNATURE', signature);
    // console.log(transaction, "***transaction");
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
          norse[dataList[0] % 4 ],
          norse[dataList[1] % 4 ],
          norse[dataList[2] % 4 ],
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
          norse[dataList[0] % 4 ],
          norse[dataList[1] % 4 ],
          norse[dataList[2] % 4 ],
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
                <li>Name: {norse[d % 4].name}</li> 
                <li>Level: {norse[d % 4].Rarity}</li>
                <li>Hp: {norse[d % 4].HP}</li>
                <li>Strength: {norse[d % 4].Strength}</li>
                <li>Speed: {norse[d % 4].Speed}</li>
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