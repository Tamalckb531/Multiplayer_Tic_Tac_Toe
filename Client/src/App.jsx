import { useEffect, useState } from 'react'
import './App.css'
import Square from './Square/Square'
import { io } from 'socket.io-client'
import Swal from 'sweetalert2'

const renderFrom = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
]

function App() {

  const [gameState, setGameState] = useState(renderFrom); //?Array of index of the game
  const [currentPlayer, setCurrentPlayer] = useState('circle'); //? First player get the circle
  const [finishedState, setFinishedState] = useState(false); //? decide game is finished or not
  const [finishedArrayState, setFinishedArrayState] = useState([]); //? For winning bg-color
  const [playOnline, setPlayOnline] = useState(false); //?
  const [socket, setSocket] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [opponentName, setOpponentName] = useState(null);
  const [playingAs, setPlayingAs] = useState(null);

  console.log(gameState.length);

  const checkWinner = () => {
    //? row wise winning logic
    for (let row = 0; row < gameState.length; row++) {
      if (gameState[row][0] === gameState[row][1] && gameState[row][1] === gameState[row][2]) { //? All column of a row is matched
        setFinishedArrayState([row * 3 + 0, row * 3 + 1, row * 3 + 2]); //? row*3 -> define the winning row, +0/1/2 -> define all column of that row. (do color change)
        return gameState[row][0];
      }
    }

    //? column wise winning logic
    for (let col = 0; col < gameState.length; col++) {
      if (gameState[0][col] === gameState[1][col] && gameState[1][col] === gameState[2][col]) { //? All row of a column is matched
        setFinishedArrayState([0 * 3 + col, 1 * 3 + col, 2 * 3 + col]); //? row(0/1/2)*3+col -> take all the row than multiply with 3 with wining column makes the wining column identified (do color change)
        return gameState[0][col];
      }
    }

    //?cross wise winning logic
    if (gameState[0][0] === gameState[1][1] && gameState[1][1] === gameState[2][2]) { //? Left cross logic
      setFinishedArrayState([0, 4, 8]);
      return gameState[0][0];
    }
    if (gameState[0][2] === gameState[1][1] && gameState[1][1] === gameState[2][0]) { //? Right cross logic
      setFinishedArrayState([2, 4, 6]);
      return gameState[0][2];
    }

    //* returning gamestate means -> returing the wining icon : 'circle'/'cross'/'draw'

    //? Match draw 
    const isDrawMatch = gameState.flat().every((e) => { //? Make sure every element has either circle or cross
      if (e === 'circle' || e === 'cross') {
        return true;
      }
    });

    if (isDrawMatch) {
      return "draw";
    }

    return null;
  }

  useEffect(() => {
    const winner = checkWinner();

    if (winner) {
      setFinishedState(winner);
    }
  }, [gameState]);

  const takePlayerName = async () => {
    const result = await Swal.fire({
      title: "Player Name",
      input: "text",
      inputLabel: "Enter your Name : ",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "Without name game can't be start!";
        }
      }
    });

    return result;
  }

  socket?.on("opponentLeftMatch", () => {
    setFinishedState("opponentLeftMatch");
  })

  socket?.on("playerMoveFromServer", (data) => {
    const id = data.state.id;
    setGameState((prevState) => {
      let newState = [...prevState];
      const rowIndex = Math.floor(id / 3);
      const colIndex = id % 3;
      newState[rowIndex][colIndex] = data.state.sign;
      return newState;
    });

    setCurrentPlayer(data.state.sign === "circle" ? "cross" : "circle");
  })

  socket?.on("connect", function () {
    setPlayOnline(true);
  });

  socket?.on("OpponentNotFound", function () {
    setOpponentName(false);
  });

  socket?.on("OpponentFound", function (data) {
    setPlayingAs(data.playingAs);
    setOpponentName(data.opponentName);
  });

  async function playOnlineClick() {

    const result = await takePlayerName();

    if (!result.isConfirmed) {
      return;
    }

    const username = result.value;
    setPlayerName(username);

    const newSocket = io("http://localhost:3000", {
      autoConnect: true,
    });

    newSocket?.emit("request_to_play", {
      playerName: username,
    })

    setSocket(newSocket);
  }

  if (!playOnline) {
    return <div className='main-div'>
      <button onClick={playOnlineClick} className='playOnline'>Play Online</button>
    </div>
  }

  if (playOnline && !opponentName) {
    return <div className='waiting'>
      <p>Waiting for Opponent.....</p>
    </div>
  }

  const playerMoveClass = currentPlayer === playingAs ? "current-move-" + currentPlayer : "";
  const opponentMoveClass = currentPlayer !== playingAs ? "current-move-" + currentPlayer : "";
  const winning = finishedState ? "You won!" : ""; //! Bug


  return (
    <>
      <div className='main-div'>
        <div>
          <div className="move-detection">
            <div className={`left ${playerMoveClass}`}>{playerName}</div>
            <div className={`right ${opponentMoveClass}`}>{opponentName}</div>
          </div>
          <h1 className='game-heading water-background'>Tic Tac Toe</h1>
          <div className='square-wrapper'>
            {gameState.map((arr, rowIndex) => {
              return arr.map((elem, colIndex) => {
                return <Square
                  gameState={gameState}
                  socket={socket}
                  playingAs={playingAs}
                  finishedArrayState={finishedArrayState}
                  finishedState={finishedState}
                  currentPlayer={currentPlayer}
                  setCurrentPlayer={setCurrentPlayer}
                  setGameState={setGameState}
                  key={rowIndex * 3 + colIndex}
                  id={rowIndex * 3 + colIndex}
                  currentElement={elem} />;
              })
            }
            )}
          </div>
          {finishedState && finishedState !== "opponentLeftMatch" && finishedState === "draw" &&
            (<h3 className='finished-state'>It's a Draw</h3>)
          }
          {finishedState && finishedState !== "opponentLeftMatch" && finishedState !== "draw" &&
            (<h3 className='finished-state'>{finishedState === playingAs ? "You " : opponentName} won the game</h3>)
          }
        </div>
      </div>
      {finishedState && finishedState === "opponentLeftMatch" &&
        (<h3 className='finished-state'>
          {winning} Opponent Left The Match. {/*//! Bug: After game over, if opponent left, still gonna show the "You win!" */}
        </h3>)
      }
      {!finishedState && opponentName &&
        (<h3 className='finished-state pt-5'>You are playing against {opponentName}</h3>)
      }
    </>
  )
}

export default App


//! Bug on random player mode : There is no separation within players. Three players getting connected with each other and creating a total mess 