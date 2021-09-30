import React, { useEffect, useState } from 'react'
import axios from '../axios-nft';

const Challenges = ({userCards}) => {

    const [challenges, setChallenges] = useState(null); //the main challenge
    const [keys, setKeys] = useState(); //keys for firebase
    const [battle, setBattle] = useState(); //battle challenge
    const [number, setNumber] = useState(); //key for database
    const [winner, setWinner] = useState(); //winner

    useEffect(() => {
        axios.get('./users-challenge-active.json')
            .then(res =>{
                console.log(res.data)
                setKeys(Object.keys(res.data))
                setChallenges(res.data)
            })
            .catch(err => console.log(err))
    }, [])

    const battlePreparationsHandler = (challenge, key) => {
        setBattle(challenge);
        setNumber(key);
        console.log(key);
    }

    const battleHandler = () => {
        setTimeout(() => {}, 2000)
        if(battle.score > userCards.score) setWinner(battle.user)
        else setWinner(userCards.user)
        axios.delete(`/users-challenge-active/${number}.json`)
            .then(res => console.log(res))
            .catch(err => console.log(err))
    }

    return (
        <>
        <div style={{alignItems : "center"}}>
            <br />
            {
                challenges && userCards ?(
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
                :
                (<h1></h1>)
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
            
                <h1> Winner is {winner} </h1>
                <br />
            </div>
        )
        }
        </>
    )
}

export default Challenges