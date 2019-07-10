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
io.on('connection', socket => {
	console.log(`A socket connection to the server has been made: ${socket.id}`)

	socket.on('disconnect', () => {
	  console.log(`Connection ${socket.id} has left the building`)
	})
})

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

//IO STUFF STARTS HERE
// let board = null
// const players = {'red': null, 'yellow': null}
// let player = 'red'

// function reset() {
//   board = Array(6).fill(0).map(x => Array(8).fill('white'))
//   players['red'] = null
//   players['yellow'] = null
//   player = 'red'
// }

// reset()
