const { createServer } = require("http");
const { Server } = require("socket.io");

//? Creation of a new web socket server 
const httpServer = createServer();
const io = new Server(httpServer, {
    cors: "http://localhost:5173/",
});

const allUsers = {}; //? store all the users information that are connected to the server 
const allRooms = [];

//* Trigger whenever a client successfully connects to web socket server
//? socket represents the socket connection between client and server
io.on("connection", (socket) => {

    //? socket.id -> Unique Identity for all users that joined the server

    //? for each socket.id , it's storing the coresponding socket connection and online state to true.
    allUsers[socket.id] = {
        socket: socket,
        online: true,
        playing: false //! Important : It was creating the bug of more than two player getting connected to one game
    }

    socket.on("request_to_play", (data) => {
        const currentUser = allUsers[socket.id]; //? get the socket of newly connected player
        currentUser.playerName = data.playerName; //? add the playername that came from modal 

        let opponentPlayer;

        //? Selection of the opponent player
        for (const key in allUsers) {
            const user = allUsers[key];
            if (user.online && !user.playing && socket.id !== key) { //? checking three things 1. if the opponent online, 2. if the opponent is already playing or not, 3. If the id is not similar to currentUser
                opponentPlayer = user;
                break;
            }
        }

        if (opponentPlayer) {

            currentUser.playing = true;
            opponentPlayer.playing = true;

            allRooms.push({
                player1: opponentPlayer,
                player2: currentUser
            });

            currentUser.socket.emit("OpponentFound", {
                opponentName: opponentPlayer.playerName,
                playingAs: "circle"
            })
            opponentPlayer.socket.emit("OpponentFound", {
                opponentName: currentUser.playerName,
                playingAs: "cross"
            });

            //?gamestate passing
            currentUser.socket.on("playerMoveFromClient", (data) => {
                opponentPlayer.socket.emit("playerMoveFromServer", {
                    ...data,
                })
            })
            opponentPlayer.socket.on("playerMoveFromClient", (data) => {
                currentUser.socket.emit("playerMoveFromServer", {
                    ...data,
                })
            })

        } else {
            currentUser.socket.emit("OpponetNotFound");
        }

    })

    socket.on("disconnect", function () {
        const currentUser = allUsers[socket.id];
        currentUser.online = false;
        currentUser.playing = false;

        for (let index = 0; index < allRooms.length; index++) {
            const { player1, player2 } = allRooms[index];

            if (player1.socket.id === socket.id) {
                player2.socket.emit("opponentLeftMatch");
                break;
            }

            if (player2.socket.id === socket.id) {
                player1.socket.emit("opponentLeftMatch");
                break;
            }

        }
    });
});

httpServer.listen(3000);