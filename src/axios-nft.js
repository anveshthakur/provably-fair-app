import axios from 'axios';

const instance = axios.create({
    baseURL: 'https://nft-game-e9370-default-rtdb.asia-southeast1.firebasedatabase.app/'
});

export default instance;