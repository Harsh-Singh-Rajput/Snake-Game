const BACKGROUND_COLOR = "#659DBD"
const PLAYER_ONE_COLOR = "#8DB741"
const PLAYER_TWO_COLOR = "#FC4445"
const FOOD_COLOR = "#FBEEC1"

const socket = io("http://127.0.0.1:5000/", {
    extraHeader:{
        "Access-Control-Allow-Origin":"http://127.0.0.1:5500"
    }
})

socket.on("init", handleInit);
socket.on("gameState", handleGameState)
socket.on("gameOver", handleGameOver)
socket.on("unknownCode", handleUnknownCode)
socket.on("gameCode", handleGameCode)
socket.on("tooManyPlayers", handleTooManyPlayers)

const gameScreen = document.getElementById("gameScreen");
const initialScreen = document.getElementById("initialScreen");
const newGameBtn = document.getElementById("newGameButton");
const joinGameBtn = document.getElementById("joinGameButton");
const gameCodeInput = document.getElementById("gameCodeInput");
const gameCodeDisplay = document.getElementById("gameCodeDisplay");

newGameBtn.addEventListener("click", newGame)
joinGameBtn.addEventListener("click", joinGame)

function newGame() {
    socket.emit("newGame")
    startGame()
}

function joinGame() {
    const code = gameCodeInput.value
    socket.emit("joinGame", code)
    startGame()
}

let canvas, canvasContext;
let playerNumber;
let gameActive = false

function startGame() {
    initialScreen.style.display = 'none'
    gameScreen.style.display = 'block'

    canvas = document.getElementById("canvas")
    canvasContext = canvas.getContext("2d");

    canvas.width = canvas.height = 600

    canvasContext.fillStyle = BACKGROUND_COLOR
    canvasContext.fillRect(0, 0, canvas.width, canvas.height)

    document.addEventListener("keydown", keydown);
    gameActive = true


}

function keydown(e) {
    socket.emit("keydown", e.keyCode)
}

function paintGame(state) {
    canvasContext.fillStyle = BACKGROUND_COLOR
    canvasContext.fillRect(0, 0, canvas.width, canvas.height)

    const food = state.food
    gridSize = state.gridSize
    const size = canvas.width / gridSize

    canvasContext.fillStyle = FOOD_COLOR
    canvasContext.fillRect(food.x * size, food.y * size, size, size)

    paintPlayer(state.players[0], size, PLAYER_ONE_COLOR)
    paintPlayer(state.players[1], size, PLAYER_TWO_COLOR)
}

function paintPlayer(playerState, size, color) {
    const snake = playerState.snake
    canvasContext.fillStyle = color
    for (let cell of snake){
        canvasContext.fillRect(cell.x * size, cell.y * size, size, size)
    }
}

function handleInit(num) {
    playerNumber = num
}

function handleGameState(gameState) {
    if(!gameActive){
        return
    }
    gameState = JSON.parse(gameState);
    requestAnimationFrame(() => paintGame(gameState))
}

function handleGameOver(data) {
    if(!gameActive){
        return
    }

    data = JSON.parse(data)
    gameActive = false

    if(data.winner === playerNumber){
        alert("You Win")
    }else{
        alert("You Lost")
    }
    setTimeout(() => {
        reset()
        
    }, 1000);
}

function handleGameCode(gameCode) {
    gameCodeDisplay.innerText = gameCode
}

function handleUnknownCode() {
    reset();
    alert("Unkwon Code")
}

function handleTooManyPlayers() {
    reset();
    alert("Too Many Players")
}

function reset() {
    playerNumber = null
    gameCodeDisplay.value = ''
    initialScreen.style.display = "block"
    gameScreen.style.display = "none"
}