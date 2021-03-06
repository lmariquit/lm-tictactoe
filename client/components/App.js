import React, {Component} from 'react'
import InfoBar from './InfoBar'
import Board from './Board'
import openSocket from 'socket.io-client';


class App extends Component {
  constructor(props) {
    super(props)
    this.onColumnClick = this.onColumnClick.bind(this)

    this.state = {
      board: Array(6).fill(0).map(x => Array(8).fill('white')),
      socket: openSocket('http://localhost:3000'),
      message: 'Waiting for another player...',
      yourTurn: false
    }

    let self = this
    console.log("SELF!! ", self)
    this.state.socket.on('board', board => {
      this.setState(...self.state, {board: board})
    });
    this.state.socket.on('color', color => {
      this.setState(...self.state, {color: color})
    });
    this.state.socket.on('turn', player => {
      if (player === this.state.color) {
        this.setState(...self.state, {message: "You're up. What's your move?", yourTurn: true})
      } else {
        this.setState(...self.state, {message: player + ' is thinking...', yourTurn: false})
      }
    });

    this.state.socket.on('victory', player => {
      let newState = {yourTurn: false}
      if (player === this.state.color) {
        newState['message'] = 'You win!'
      } else {
        newState['message'] = 'You lose!'
      }
      this.setState(...self.state, newState)
    });
  }

	onColumnClick(column) {
		console.log("I SENSE A CLICK EVENT IN CLIENT....")
		this.state.socket.emit('click', column);
	} 

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Connect Four</h1>
        </header>
        <InfoBar color={this.state.color} message={this.state.message} />
        <Board board={this.state.board} onColumnClick={this.onColumnClick} yourTurn={this.state.yourTurn}/>
      </div>
    )
  }
}

export default App
