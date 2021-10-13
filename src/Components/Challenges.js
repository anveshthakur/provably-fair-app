import { clusterApiUrl, Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from '@solana/web3.js';
import React, { useEffect, useState } from 'react'
import axios from '../axios-nft';

const Challenges = ({userCards}) => {

    const [challenges, setChallenges] = useState(null); //the main challenge
    const [keys, setKeys] = useState(); //keys for firebase
    const [battle, setBattle] = useState(); //battle challenge
    const [number, setNumber] = useState(); //key for database
    const [winner, setWinner] = useState(); //winner

    //secret key
    const secretKey = [117,100,11,230,238,248,239,156,101,16,209,129,156,20,229,235,81,201,168,58,171,54,223,92,52,188,151,60,35,53,150,197,37,79,29,180,143,83,104,100,81,6,176,113,11,243,198,194,104,141,149,169,47,85,45,213,137,84,165,151,179,216,46,148]
    const secret = Uint8Array.from(secretKey);
    const key = Keypair.fromSecretKey(secret);

    //connection
    const con = new Connection(
        clusterApiUrl('devnet'),
        'confirmed',
    );

    useEffect(() => {
        axios.get('./users-challenge-active.json')
            .then(res =>{
                console.log(res.data)
                setKeys(Object.keys(res.data))
                setChallenges(res.data)
            })
            .catch(err => console.log(err))
    }, [])


    //1 nft to challenger's temp account
    const battlePreparationsHandler = (challenge, key) => {
        setBattle(challenge);
        setNumber(key);
        console.log(key);
    }

    const sendReward = async(winner) => {
        let winPubKey = new PublicKey(winner);
        console.log(winPubKey)
        let transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: key.publicKey,
                toPubkey: winPubKey,
                lamports: 200000000,
        }));
        console.log(transaction);
        const sign = await sendAndConfirmTransaction(
            con,
            transaction,
            [key],
            {commitment: 'confirmed'},
        );

        console.log(sign);
    }


    //temp account to winner's account
    const battleHandler = () => {
        setTimeout(() => {}, 2000)
        if(battle.score > userCards.score) setWinner(battle.user)
        else setWinner(userCards.user);
        axios.delete(`/users-challenge-active/${number}.json`)
            .then(res => console.log(res))
            .catch(err => console.log(err))
    }

    return (
        <>
        <div style={{alignItems : "center"}}>
            <br />
            {
                challenges && userCards &&(
                <>
                    <h1>Challenges: </h1>
                    <br />
                    <ul style={{display: '', listStyle: 'none'}} >            
                        {Object.values(challenges).map((challenge, key) => (
                        challenge.challenge === "active" &&
                        (   
                            <li onClick = {() => battlePreparationsHandler(challenge, keys[key])} key = {key}>
                                {challenge.user}
                            </li>
                        )
                        ))}
                    </ul>
                </>
                )
            }
        </div>
        <br />
        <br />
        {battle && userCards &&(
            <div style = {{textAlign : "center"}}>
                <h1> BATTLE ARENA </h1>
                <h1>Battle Between</h1>
                <h3>Player 1: {battle.user}</h3>
                <h3>Player 2:{userCards.user}</h3>
                <button onClick={battleHandler}> Fight!! </button>
                <br />
                <br />
                <button onClick={() => sendReward(winner)}>Claim Rewards</button>
                <br />
                <br />
                    <h1> Winner is {winner} </h1>
                <br />
            </div>
        )
        }
        </>
    )
}

export default Challenges