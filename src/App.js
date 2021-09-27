import './App.css';
import { useState } from 'react';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import idl from './idl.json';
import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import norse from './Norse-Data.json';
import { initializeApp } from 'firebase/app';

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

//program id for the idl
const programID = new PublicKey(idl.metadata.address);

//network devnet
const network = clusterApiUrl("devnet");


//firebase
// const firebaseConfig = {

// }

// const App = initializeApp(firebaseConfig);


function App() {

  //state for value , DataList, input 
  const [value, setValue] = useState('');
  const [dataList, setDataList] = useState([]);
  const [input, setInput] = useState('');

  //user's wallet
  const wallet = useWallet();

  async function getProvider() {
    /* create the provider and return it to the caller */
    /* network set to local network for now */
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
      /* interact with the program via rpc */
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
    
    await program.rpc.update(input, {
      accounts: {
        baseAccount: baseAccount.publicKey
      }
    });

    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    console.log('account: ', account);
    setValue(account.data.toString());
    setDataList(account.dataList);
    setInput('');
  }


  //Making the NORSE GODS and Minting the 
  const norseGodHandler = async() => {
    if(dataList.length < 3){
      await update();
    }
    else{
      console.log("Already Have 3 Cards it's time to play")
    }
  }


  // Creating the Combat Cards and Calculating the Scores.
  //FIREBASE - POST - 1
  const createCombatCards = async() => {
    if(dataList < 3) console.log("You Should Make Some Cards First");
    let total_Score = (norse[dataList[0]].HP + norse[dataList[0]].Strength + norse[dataList[1]].HP + norse[dataList[1]].Strength + norse[dataList[2]].HP + norse[dataList[2]].Strength);
    let userCardsObject = {
      user: wallet.publicKey.toString(),
      cards: [
        norse[dataList[0]],
        norse[dataList[1]],
        norse[dataList[2]],
        total_Score,
      ]
    }
    console.log(userCardsObject);
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
      <div className="App">
        <div>
          {
            !value && (<button onClick={initialize}>Initialize</button>)
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
              </ul>
            </h4>
            )
          }
        </div>
      </div>
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