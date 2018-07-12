import { 
  JsonController, Authorized, CurrentUser, Post, Param, BadRequestError, HttpCode, NotFoundError, ForbiddenError, Get, 
  Body, Patch 
} from 'routing-controllers'
import User from '../users/entity'
import { Game, Player, Board, Row } from './entities'
// import {IsBoard, isValidTransition, calculateWinner, finished, calculateHit} from './logic'
// import { Validate } from 'class-validator'
import {io} from '../index'


const emptyRow: Row = [null, null, null, null, null]

const randomRow: Row[] = [ ['b', null, null, null, null],
                    [null , 'b', null, null, null],
                    [null, null, 'b', null, null],
                    [null, null, null, 'b', null], 
                    [null, null, null, null, 'b'] ]

const startingBoatRow: Row = randomRow[Math.floor(Math.random() * randomRow.length)]

const randomBoatLocation: Board[] = [[ startingBoatRow, emptyRow, emptyRow, emptyRow, emptyRow ],
                                  [ emptyRow, startingBoatRow, emptyRow, emptyRow, emptyRow ],
                                  [ emptyRow, emptyRow, startingBoatRow, emptyRow, emptyRow ],
                                  [ emptyRow, emptyRow, emptyRow, startingBoatRow, emptyRow ],
                                  [ emptyRow, emptyRow, emptyRow, emptyRow, startingBoatRow ]]

let defaultBoatLocation1: Board = randomBoatLocation[Math.floor(Math.random() * randomBoatLocation.length)]
let defaultBoatLocation2: Board = randomBoatLocation[Math.floor(Math.random() * randomBoatLocation.length)]

@JsonController()
export default class GameController {

  @Authorized()
  @Post('/games')
  @HttpCode(201)
  async createGame(
    @CurrentUser() user: User
  ) {
    const entity = await Game.create().save()

    await Player.create({
      game: entity, 
      user,
      symbol: 'x',
      boatLocation: defaultBoatLocation1,
      currentUser: user.id
    }).save()

    const game = await Game.findOneById(entity.id)

    io.emit('action', {
      type: 'ADD_GAME',
      payload: game
    })

    return game
  }

  @Authorized()
  @Post('/games/:id([0-9]+)/players')
  @HttpCode(201)
  async joinGame(
    @CurrentUser() user: User,
    @Param('id') gameId: number
  ) {
    const game = await Game.findOneById(gameId)
    if (!game) throw new BadRequestError(`Game does not exist`)
    if (game.status !== 'pending') throw new BadRequestError(`Game is already started`)

    game.status = 'started'
    await game.save()

    const player = await Player.create({
      game, 
      user,
      symbol: 'o',
      boatLocation: defaultBoatLocation2,
      currentUser: user.id
    }).save()

    io.emit('action', {
      type: 'UPDATE_GAME',
      payload: await Game.findOneById(game.id)
    })

    return player
  }

  @Authorized()
  // the reason that we're using patch here is because this request is not idempotent
  // http://restcookbook.com/HTTP%20Methods/idempotency/
  // try to fire the same requests twice, see what happens
  @Patch('/games/:id([0-9]+)')
  async updateGame(
    @CurrentUser() user: User,
    @Param('id') gameId: number,
    @Body() update
  ) {

    console.log("This is the beginning of the patch")

    const game = await Game.findOneById(gameId)
    if (!game) throw new NotFoundError(`Game does not exist`)

    const player = await Player.findOne({ user, game })

    if (!player) throw new ForbiddenError(`You are not part of this game`)
    if (game.status !== 'started') throw new BadRequestError(`The game is not started yet`)
    if (player.symbol !== game.turn) throw new BadRequestError(`It's not your turn`)

    if (update.winner) {
      game.winner = update.winner
      game.status = 'finished'
    }

    game.turn = player.symbol === 'x' ? 'o' : 'x'

    await game.save()

    player.myBoard = update.board

    await player.save()

    game.players.filter(x => {return x.currentUser === player.id})[0].myBoard = player.myBoard

    console.log('THIS PLAYER',player)
    console.log('UPDATE',update)
    console.log('GAME',game)

    io.emit('action', {
      type: 'UPDATE_GAME',
      payload: game
    })
    
    return {game, player}
  }

  @Authorized()
  @Get('/games/:id([0-9]+)')
  getGame(
    @Param('id') id: number
  ) {
    return Game.findOneById(id)
  }

  @Authorized()
  @Get('/games')
  getGames() {
    return Game.find()
  }
}

