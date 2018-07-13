"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const routing_controllers_1 = require("routing-controllers");
const entity_1 = require("../users/entity");
const entities_1 = require("./entities");
const index_1 = require("../index");
const emptyRow = [null, null, null, null, null];
const randomRow = [['⛵', null, null, null, null],
    [null, '⛵', null, null, null],
    [null, null, '⛵', null, null],
    [null, null, null, '⛵', null],
    [null, null, null, null, '⛵']];
const startingBoatRow = randomRow[Math.floor(Math.random() * randomRow.length)];
const randomBoatLocation = [[startingBoatRow, emptyRow, emptyRow, emptyRow, emptyRow],
    [emptyRow, startingBoatRow, emptyRow, emptyRow, emptyRow],
    [emptyRow, emptyRow, startingBoatRow, emptyRow, emptyRow],
    [emptyRow, emptyRow, emptyRow, startingBoatRow, emptyRow],
    [emptyRow, emptyRow, emptyRow, emptyRow, startingBoatRow]];
let defaultBoatLocation1 = randomBoatLocation[Math.floor(Math.random() * randomBoatLocation.length)];
let defaultBoatLocation2 = randomBoatLocation[Math.floor(Math.random() * randomBoatLocation.length)];
let GameController = class GameController {
    async createGame(user) {
        const entity = await entities_1.Game.create().save();
        await entities_1.Player.create({
            game: entity,
            user,
            symbol: 'x',
            boatLocation: defaultBoatLocation1,
            currentUser: user.id
        }).save();
        const game = await entities_1.Game.findOneById(entity.id);
        index_1.io.emit('action', {
            type: 'ADD_GAME',
            payload: game
        });
        return game;
    }
    async joinGame(user, gameId) {
        const game = await entities_1.Game.findOneById(gameId);
        if (!game)
            throw new routing_controllers_1.BadRequestError(`Game does not exist`);
        if (game.status !== 'pending')
            throw new routing_controllers_1.BadRequestError(`Game is already started`);
        game.status = 'started';
        await game.save();
        const player = await entities_1.Player.create({
            game,
            user,
            symbol: 'o',
            boatLocation: defaultBoatLocation2,
            currentUser: user.id
        }).save();
        index_1.io.emit('action', {
            type: 'UPDATE_GAME',
            payload: await entities_1.Game.findOneById(game.id)
        });
        return player;
    }
    async updateGame(user, gameId, update) {
        const game = await entities_1.Game.findOneById(gameId);
        if (!game)
            throw new routing_controllers_1.NotFoundError(`Game does not exist`);
        const player = await entities_1.Player.findOne({ user, game });
        if (!player)
            throw new routing_controllers_1.ForbiddenError(`You are not part of this game`);
        if (game.status !== 'started')
            throw new routing_controllers_1.BadRequestError(`The game is not started yet`);
        if (player.symbol !== game.turn)
            throw new routing_controllers_1.BadRequestError(`It's not your turn`);
        if (update.winner) {
            game.winner = update.winner;
            game.status = 'finished';
        }
        game.turn = player.symbol === 'x' ? 'o' : 'x';
        await game.save();
        player.myBoard = update.board;
        await player.save();
        game.players.filter(x => { return x.currentUser === player.currentUser; })[0].myBoard = player.myBoard;
        index_1.io.emit('action', {
            type: 'UPDATE_GAME',
            payload: game
        });
        return { game, player };
    }
    getGame(id) {
        return entities_1.Game.findOneById(id);
    }
    getGames() {
        return entities_1.Game.find();
    }
};
__decorate([
    routing_controllers_1.Authorized(),
    routing_controllers_1.Post('/games'),
    routing_controllers_1.HttpCode(201),
    __param(0, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [entity_1.default]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "createGame", null);
__decorate([
    routing_controllers_1.Authorized(),
    routing_controllers_1.Post('/games/:id([0-9]+)/players'),
    routing_controllers_1.HttpCode(201),
    __param(0, routing_controllers_1.CurrentUser()),
    __param(1, routing_controllers_1.Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [entity_1.default, Number]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "joinGame", null);
__decorate([
    routing_controllers_1.Authorized(),
    routing_controllers_1.Patch('/games/:id([0-9]+)'),
    __param(0, routing_controllers_1.CurrentUser()),
    __param(1, routing_controllers_1.Param('id')),
    __param(2, routing_controllers_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [entity_1.default, Number, Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "updateGame", null);
__decorate([
    routing_controllers_1.Authorized(),
    routing_controllers_1.Get('/games/:id([0-9]+)'),
    __param(0, routing_controllers_1.Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "getGame", null);
__decorate([
    routing_controllers_1.Authorized(),
    routing_controllers_1.Get('/games'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GameController.prototype, "getGames", null);
GameController = __decorate([
    routing_controllers_1.JsonController()
], GameController);
exports.default = GameController;
//# sourceMappingURL=controller.js.map