import express from "express";
import http from "http"
import Server from "socket.io"
import {v4 as uuid} from "uuid"
import {initializeGame, gameLoop, getUpdatedVelocity} from "./game.js"

const app = express()
// app.use(cors())
const server = http.Server(app)
const io = new Server(server, {
    cors: {
        origin: '*',
      }
})
const PORT = 5000
const FRAM_RATE = 10


const globalState = {}
const clientRooms = {}

function startGameInterval(roomName) {
    const intervalId = setInterval(()=>{
        const winner = gameLoop(globalState[roomName])
        if(!winner){
            emitGameState(roomName, globalState[roomName])
        }else{
            emitGameOver(roomName, winner);
            globalState[roomName] = null
            clearInterval(intervalId)
        }
    }, 1000 / FRAM_RATE)
}

function emitGameState(room, gameState) {
    io.sockets.in(room).emit("gameState", JSON.stringify(gameState))
}
function emitGameOver(room, winner) {
    io.sockets.in(room).emit("gameOver", JSON.stringify({winner}))
}

io.on("connection", (client)=>{
    client.on("keydown", handleKeyDown)
    client.on("newGame", handleNewGame)
    client.on("joinGame", handleJoinGame)

    function handleJoinGame(roomName) {
        const room = io.sockets.adapter.rooms[roomName];

        let allUsers;
        if(room){
            allUsers = room.sockets;
        }

        let noOfPlayers = 0

        if(allUsers){
            noOfPlayers = Object.keys(allUsers).length
        }

        if(noOfPlayers === 0){
            client.emit("unknownCode")
        }else if(noOfPlayers > 1){
            client.emit("tooManyPlayers");
            return
        }

        clientRooms[client.id] = roomName
        client.join(roomName)
        client.number = 2
        client.emit("init", 2);
        startGameInterval(roomName)
    }

    function handleNewGame() {
        let roomName = uuid();

        clientRooms[client.id] = roomName
        client.emit("gameCode", roomName)

        globalState[roomName] = initializeGame();

        client.join(roomName)
        client.number = 1
        client.emit("init", 1)
    }

    function handleKeyDown(keyCode) {
        const roomName = clientRooms[client.id]

        if(!roomName){
            return
        }

        try {
            keyCode = parseInt(keyCode)
        } catch (error) {
            console.log(error);
            return
        }
        const velocity = getUpdatedVelocity(keyCode)

        if(velocity){
            globalState[roomName].players[client.number - 1].velocity = velocity
        }
    }
})

app.get("/", (req, res)=>{
    res.send("Server is running")
})

server.listen(PORT, ()=>{
    console.log('Server is running http://localhost:5000');
})
