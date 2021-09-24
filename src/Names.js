// const fs = require("fs");

// const names = ["Aegir", "Aesir", "Alfheim", "Alfheimr", "Amleth", "Amlethus", "Amlóða", "Amlóði", "Amma", "Andhrimnir", "Andvari", "Angerbda", "ngrboda", "Asabru", "Asbru", "Asgaard", "Asgard", "Asgård", "Asgardr", "Ask", "Askr", "Astrild", "Audhumbla", "Audhumla", "Audhumla", "Auðumbla", "Auðumla", "Aurgelmir", "Aurvandil", "Aurvandill","Authumla","Álfheimr","Ægir", "Æsgard", "Æsir", "Besla", "Bestla", "Beyla", "Bifrost", "Bilfrost", "Billow Maidens", "Biort", "Bjort", "Blid", "Blith","Bor", "Borr", "Brage","Bragi", "Brono", "Brunhild", "Brunhilde", "Brunhilt", "Brunnhilde", "Brynhild", "Brynhildr", "Bur", "Búri", "Buri", "Byggvir", "Bylgia", "Bylgja","Disir", "Dísir", "Donar", "Dröfn", "Drofn","Eir", "Elder Mother", "Elder Woman", "Elli", "Embla","Fafnir", "Fenric", "Fenrir", "Fenris", "Fenrisulfr", "Fjorgyn", "Forseti", "Frey", "Freyja", "Fricco", "Frigga", "Frost Giants", "Fulla","Gangleri", "Garm", "Gefion", "Gefiun", "Gefjon", "Gefjun", "Geirölul", "Geirönul", "Geironul", "Geirrod", "Geirrönul","Geirskogul", "Geirskögul", "Geirskokul", "Gerd", "Gerda", "Gerdhr", "Gersemi", "Gerth", "Gertrude", "Gerutha", "Ginnungagap", "Gjalp", "Gladsheim", "Gladsheimr", "Glut", "Godheim", "Goðheimar", "Goðheimr", "Göll", "Goll", "Gondul", "Gotterdammerung", "Greip", "Grid", "Groa", "Guðr", "Guinn", "Gullintani", "Gullveig", "Gullweig", "Gunlod", "Gunn", "Gunnlöd", "Gunnlod", "Gunnlöð", "Gunnr", "Guthorm", "Guttorm", "Guttormr","Hamlet", "Har", "Hár", "Hardgreip", "Hardgrep", "Harðgreip", "Harðgreipr", "Harr", "Harthgrepa", "Hati", "Hávamál", "Havamal", "Heid", "Heidrun", "Heiðr",  "Heimdallr", , "Hela", "Helgardh", "Helheim", "Helheimr", "Hell", "Herfjoturr", "Hermod","Hermóðr", "Hermoth", "Hild", "Hilde", "Hildr", "Hildur", "Hladgunnr", "Hlaðguðr", "Hlin", "Hlodyn", "Hlökk", "Hlokk", "Hnoss", "Hnossa", "Hod", "Höd", "Hoder", "Hodur", "Höðr", "Hoenir","Hohnir", "Honir", "Hraesvelg", "Hræsvelg", "Hreidmar", "Hrim", "Hrimnir", "Hrist", "Hrungnir", "Hrym", "Hulder", "Huldra", "Hyldemoer", "Hyldequinde", "Hymir","Hyndla", "Hyrokkin", "Hyrrokkin","Ice Giants", "Idun", "Iduna", "Idunn","Jafenhar", "Jaffnhar", "Jafnhár", "Jafnhar", "Jafnharr","Jafnhárr", "Jarnsaaxa", "Járnsaxa", "Jarnsaxa", "Jord", "Jörð", "Jörmungand","Jormungand", "Jörmungandr", "Jormungandr", "Jörth", "Jotnar", "Jotunheim", "Jötunheimr", "Jötunn","Kara", "Kvasir","Laufey", "Líf", "Lif", "Lífthrasir", "Lifthrasir", "Liv", "Lofn", "Loke",  "Loki-Laufeyjarson", "Lokkju", "Lopter", "Lopti","Magni","Manheimr","Mani","Mannheim","Midgard","Miðgarðr","Mimir","Mist","Mjollner","Mjollnir","Mjolnir","Modgud","Módi","Modi","Móði","Mokerkialfi","Mokkerkalfe","Mokkurkaflir","Mokkurkalfi","Mökkurkálfi","Mothi","Muspelheim","Muspelheimr","Muspell","Muspellheim","Muspellsheimr","Mysterious Three","Nanna","Narfi","Nari","Narvi","Nehalennia","Nibelungs","Nidavellir","Nidhogg","Nídhögg","Nidhoggr","Nidhøg","Niðavellir","Níðhöggr","Niflheim","Niflheimr","Niflhel","Nine Worlds","Nithhogg","Níu-Heimar","Niu-Heimar","Njoerd","Njor","Njord","Njörðr","Njoror","Njorth","Nor","Nörfi","Norns","Nörr","Nott","Ód", "Óðr","Od", "Odinn", "Odr", "Odur", "Oller", "Othinn", "Otr", "Otter-2","Radgrid","Rádgrídr","Radgridr","Ráðgríðr","Ragnarok","Ragnarök","Ragnarøkr","Ragnorak","Rainbow-Bridge","Ran","Ratatosk","Ratatoskr","Regin","Rig","Rind","Rindr","Róta","Rota","Ruta","Såga", "Sága", "Saga", "Síbilja", "Sibilja", "Siegfried", "Sif", "Sigurd", "Sigyn", "Sjofn", "Skadi", "Skaði", "Skeggiöld", "Skeggjöld", "Skeggöld", "Skirnir", "Skogul", "Skoll", "Skuld", "Sleipner", "Sleipnir", "Snotra", "Sökkvabekk", "Sokkvabekk", "Sökkvabekkr", "Sól", "Sol", "Søkkvabekk", "Surt", "Surtr", "Suttung", "Suttungr", "Svartalfheim", "Svartalfheimr", "Svartálfheimr", "Swan Maidens", "Syn","Thialfi","Thiassi","Thjalfi","Thridi","Thrud","Thrudheim","Thunor","Týr","Ty","Ull","Uller","Ullr","Ullur","Urd","Urðr","Urth"   ,,"Vafthrudnir", "Vafthruthnir", "Vafþrúðnir", "Vaganhope", "Vagnhofde", "Vagnhofde", "Vagnhofdi", "Vagnhofᵭi", "Vak", "Valder", "Valhalla", "Vali",  "Valkyrja", "Valtam", "Vanaheim", "Vanaheimr", "Vanir", "Verdandi",  "Víðarr", "Vili", "Ville", "Vithar", "Völsung", "Volsung", "Vǫlsungr", "Vuldr","Wagnhoftus", "Walkyries", "Wave Maidens","Yggdrasil", "Yggdrasill", "Yngvi", "Yngvi-Freyr", "Þórr", "Þriðji", "Þunor"];
// const NamesLegendary = ["Odin", "Aasgard", "Thor", "Loki", "Baldur"]
// const NamesEpic = ["Freya", "Freyr", "Ymir", "Heimdall", "Frigg", "Hel", "Vidar", "Valkyrie", "Vel"]

// let Data = [];

// function shuffleArr(array) {
//   let currentIndex = array.length,  randomIndex;

//   // While there remain elements to shuffle...
//   while (currentIndex != 0) {

//     // Pick a remaining element...
//     randomIndex = Math.floor(Math.random() * currentIndex);
//     currentIndex--;

//     // And swap it with the current element.
//     [array[currentIndex], array[randomIndex]] = [
//       array[randomIndex], array[currentIndex]];
//   }

//   return array;
// }

// const getRandomInt = (max) => {
//     return Math.floor(Math.random() * max);
// }

// const rarityGen = (level) => {
//     let rarity = ["Common", "Rare"]
//     return rarity[level];
// }

// names.forEach(name => {
//     const obj = {
//         "name": name,
//         "Level": rarityGen(getRandomInt(2)),
//         "HP": getRandomInt(50) + 20,
//         "Strength": getRandomInt(50) + 10,
//     }
//     Data.push(obj);
// });

// NamesEpic.forEach(name => {
    
//     const obj = {
//         "name": name,
//         "Level": "Epic",
//         "HP": getRandomInt(80) + 10,
//         "Strength": getRandomInt(80) + 10,
//     }

//     Data.push(obj);
// })

// NamesLegendary.forEach(name => {    
    
//     const obj = {
//         "name": name,
//         "Level": "Legendary",
//         "HP": getRandomInt(90) + 10,
//         "Strength": getRandomInt(90) + 5,
//     }

//     Data.push(obj);
// })

// Data = shuffleArr(Data);

// fs.writeFile('Data.json', JSON.stringify(Data), (err) => {
//     if(err) throw err;
// })



/////////////////////////////////////////////////////////////////////////////////////////











