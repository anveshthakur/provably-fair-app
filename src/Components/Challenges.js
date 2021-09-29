import React, { useEffect, useState } from 'react'
import axios from '../axios-nft';


const Challenges = ({userCards}) => {

    const [challenges, setChallenges] = useState(null);
    const [keys, setKeys] = useState();
    const [battle, setBattle] = useState();
    const [number, setNumber] = useState()

    useEffect(() => {
        axios.get('./users-challenge-active.json')
            .then(res =>{
                console.log(res.data)
                setKeys(Object.keys(res.data))
                setChallenges(res.data)
            })
            .catch(err => console.log(err)) 
    }, [])

    
    //FIREBASE - DELETE - 1
    const battleHandler = (challenge, key) => {
        setBattle(challenge);
        setNumber(key);
        console.log(battle);
        console.log(number);
    }

    return (
        <>
        <div style={{alignItems : "center"}}>
            <br />
            {
                challenges ?(
                <>
                    <h1>Challenges: </h1>
                    <br />
                    <ul style={{display: '', listStyle: 'none'}} >            
                        {Object.values(challenges).map((challenge, key) => (
                        challenge.challenge === "active" &&
                        (   
                            <li onClick = {() => battleHandler(challenge, keys[key])} key = {key}>
                                {challenge.user}
                            </li>
                        )
                        ))}
                    </ul>
                </>
                )
                :
                (<h1>Loading..</h1>)
            }
        </div>
        <br />
        <br />
        {/* <h1> BATTLE AREA </h1>
        <div style = {{textAlign : "center"}}>
           {
           battle && userCards ? (
               <h3>loaded</h3>
           ):
           (
               <h3>loading...</h3>
           )
        } 
        </div> */}
        </>
    )
}

export default Challenges
