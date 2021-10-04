import './App.css';
import { useState, useEffect } from 'react';

//Smart Contract
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import idl from './idl.json';
import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';


//minting
import { mintNFT } from '../../actions';


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
  const [nft, setNft] = useState();


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

  const mint = async (name, creator, image, strength, rarity, HP, speed ) => {
    const metadata = {
      name: name,
      creators: creator,
      description: "Valhalla NFT-CARD",
      image: image,
      attributes:[
    {
        "trait_type": "Strength",
        "value": strength.toString()
    },
    {
      "trait_type": "Rairity",
      "value": rarity,
    },
    {
        "trait_type": "HP",
        "value": HP.toString()
    },
    {
        "trait_type": "Speed",
        "value": speed.toString()
    }
  ],
      external_url: "https://phantom.app/",
      properties: {
      "files": [
        {
        "uri": "image.png",
        "type": "image/png"
        }
      ],
      "category": "image",
      "creators": [
        {
        "address": creator,
        "share": 1
        }
    ]
    }
    };


    try {
      const _nft = await mintNFT(
        connection,
        wallet,
        env,
        // files,
        metadata,
        1,
      );

      if (_nft) setNft(_nft);
    } catch(e) {
      console.log(e.message);
    }
  };


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

      //We get the whole card list here we can mint here.
      //below is how we are accessing the card
      console.log(norse[dataList[0]])

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