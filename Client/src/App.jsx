import { useEffect, useState } from 'react'
import './App.css'
import Square from './Square/Square'

const renderFrom = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
]

function App() {

  const [gameState, setGameState] = useState(renderFrom);
  const [currentPlayer, setCurrentPlayer] = useState('circle');
  const [finishedState, setFinishedState] = useState(false);
  const [finishedArrayState, setFinishedArrayState] = useState([]); //? For winning bg-color

  const checkWinner = () => {
    //? row wise winning logic
    for (let row = 0; row < gameState.length; row++) {
      if (gameState[row][0] === gameState[row][1] && gameState[row][1] === gameState[row][2]) {
        setFinishedArrayState([row * 3 + 0, row * 3 + 1, row * 3 + 2])
        return gameState[row][0];
      }
    }

    //? column wise winning logic
    for (let col = 0; col < gameState.length; col++) {
      if (gameState[0][col] === gameState[1][col] && gameState[1][col] === gameState[2][col]) {
        setFinishedArrayState([0 * 3 + col, 1 * 3 + col, 2 * 3 + col])
        return gameState[0][col];
      }
    }

    //?cross wise winning logic
    if (gameState[0][0] === gameState[1][1] && gameState[1][1] === gameState[2][2]) {
      return gameState[0][0];
    }
    if (gameState[0][2] === gameState[1][1] && gameState[1][1] === gameState[2][0]) {
      return gameState[0][2];
    }

    //? Match draw 
    const isDrawMatch = gameState.flat().every((e) => {
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


  return (
    <>
      <div className='main-div'>
        <div>
          <div className="move-detection">
            <div className='left'>Yourself</div>
            <div className="right">Opponent</div>
          </div>
          <h1 className='game-heading water-background'>Tic Tac Toe</h1>
          <div className='square-wrapper'>
            {gameState.map((arr, rowIndex) => {
              return arr.map((elem, colIndex) => {
                return <Square
                  finishedArrayState={finishedArrayState}
                  finishedState={finishedState}
                  currentPlayer={currentPlayer}
                  setCurrentPlayer={setCurrentPlayer}
                  setGameState={setGameState}
                  key={rowIndex * 3 + colIndex}
                  id={rowIndex * 3 + colIndex} />;
              })
            }
            )}
          </div>
          {finishedState && finishedState === "draw" &&
            (<h3 className='finished-state'>It's a Draw</h3>)
          }
          {finishedState && finishedState !== "draw" &&
            (<h3 className='finished-state'>{finishedState} won the game</h3>)
          }
        </div>
      </div>
    </>
  )
}

export default App
