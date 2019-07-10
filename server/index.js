const express = require('express')
const app = express()
const morgan = require('morgan')
const helmet = require('helmet')
const bodyParser = require('body-parser')
const path = require('path')
const socketio = require('socket.io');

const server = app.listen(3000, function () {
    console.log('The server is listening on port 3000!');
});

// set up our socket control center
const io = socketio(server)
// io.on('connection', socket => {
// 	console.log(`A socket connection to the server has been made: ${socket.id}`)

// 	socket.on('disconnect', () => {
// 	  console.log(`Connection ${socket.id} has left the building`)
// 	})
// })

app.use(morgan('dev'))
app.use(helmet())
app.use(express.static(path.join(__dirname, '..', 'public')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// If API route not found...
// router.use(function(req, res, next) {
//   const err = new Error('Not found.')
//   err.status = 404
//   next(err)
// })

// default to index.html if API route not provided
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
})

// We messed up...
app.use(function(err, req, res, next) {
  console.error(err)
  console.error(err.stack)
  res.status(err.status || 500).send(err.message || 'Internal server error.')
})

// IO STUFF STARTS HERE
let board = null
const players = {'red': null, 'yellow': null}
let player = 'red'

function reset() {
  board = Array(6).fill(0).map(x => Array(8).fill('white'))
  players['red'] = null
  players['yellow'] = null
  player = 'red'
}

// function checkVictory(i, j) {
//   const c = board[i][j]

//   // Check horizontally
//   let count = 0
//   // count to the left
//   for (let k = 1; k < 4; ++k) {
//     if (j - k < 0) {
//       break
//     }
//     if (board[i][j - k] !== c) {
//       break
//     }
//     count++
//   }
//   // count to the right
//   for (let k = 1; k < 4; ++k) {
//     if (j + k > 7) {
//       break
//     }
//     if (board[i][j + k] !== c) {
//       break
//     }
//     count++
//   }

//   if (count > 2) {
//     return true
//   }


//   // Check vertically
//   count = 0
//   // count up
//   for (let k = 1; k < 4; ++k) {
//     if (i - k < 0) {
//       break
//     }
//     if (board[i - k][j] !== c) {
//       break
//     }
//     count++
//   }
//   // count down
//   for (let k = 1; k < 4; ++k) {
//     if (i + k > 5) {
//       break
//     }
//     if (board[i + k][j] !== c) {
//       break
//     }
//     count++
//   }

//   if (count > 2) {
//     return true
//   }

//   // Check diagonal top-left -> bottom-right
//   count = 0
//   // count to top-left
//   for (let k = 1; k < 4; ++k) {
//     if (i - k < 0 || j - k < 0) {
//       break
//     }
//     if (board[i - k][j - k] !== c) {
//       break
//     }
//     count++
//   }
//   // count to bottom-right
//   for (let k = 1; k < 4; ++k) {
//     if (i + k > 5 || j + k > 7) {
//       break
//     }
//     if (board[i + k][j + k] !== c) {
//       break
//     }
//     count++
//   }

//   if (count > 2) {
//     return true
//   }

//   // Check diagonal bottom-left -> top-right
//   count = 0
//   // count to bottom-left
//   for (let k = 1; k < 4; ++k) {
//     if (i + k > 5 || j - k < 0) {
//       break
//     }
//     if (board[i + k][j - k] !== c) {
//       break
//     }
//     count++
//   }
//   // count to top-right
//   for (let k = 1; k < 4; ++k) {
//     if (i - k < 0 || j + k > 7) {
//       break
//     }
//     if (board[i - k][j + k] !== c) {
//       break
//     }
//     count++
//   }

//   return count > 2
// }


io.on('connection', function (socket) {
	console.log(`A socket connection to the server has been made: ${socket.id}`)
  if (players['red'] == null) {
  	console.log("RED PLAYER HAS ARRIVED")
    players['red'] = socket.id
    socket.emit('color', 'red')
  } else if (players['yellow'] == null) {
  	console.log("YELLOW PLAYER HAS ARRIVED")
    players['yellow'] = socket.id
    socket.emit('color', 'yellow')
    io.emit('turn', 'red')
  } else {
    socket.disconnect()
  }

  socket.on('disconnect', function () {
  	console.log(`Connection ${socket.id} has left the building`)
    if (players['red'] === socket.id) {
    	console.log('RED left..........')
      players['red'] = null
    } else if (players['yellow'] === socket.id) {
    	console.log('YELLOW left..........')
      players['yellow'] = null
    }
  })
	console.log('MEET THE PLAYERS: RED ->> ', players['red'], ' vs yellow ->> ', players['yellow'])

  socket.on('click', function (column) {
  	console.log('THERE WAS A CLICK AHHHHHHHH')
    // Ignore players clicking when it's not their turn
    if (players[player] !== socket) {
      console.log('click from wrong player: ' + player === 'red' ? 'yellow' : 'red')
      return
    }

    // Ignore clicks on full columns
    if (board[0][column] !== 'white') {
      console.log('click on full column: ' + column)
      return
    }

    // Ignore clicks before both players are connected
    if ((players['red'] == null) || (players['yellow'] == null)) {
      console.log('click before all players are connected')
      return
    }

    // find first open spot in the column
    let row = -1
    for (row = 5; row >= 0; --row) {
      if (board[row][column] === 'white') {
        board[row][column] = player
        break
      }
    }

    io.emit('board', board)

    // // Check victory (only current player can win)
    // if (checkVictory(row, column)) {
    //   io.emit('victory', player)
    //   // Disconnect players
    //   players['red'].disconnect()
    //   players['yellow'].disconnect()
    //   reset()
    //   return
    // }

    // Toggle the player
    player = player === 'red' ? 'yellow' : 'red'
    io.emit('turn', player)
  })
})


// reset()
