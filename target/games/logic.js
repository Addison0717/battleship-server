"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
let IsBoard = class IsBoard {
    validate(board) {
        const symbols = ['x', 'o', null];
        return board.length === 5 &&
            board.every(row => row.length === 5 &&
                row.every(symbol => symbols.includes(symbol)));
    }
};
IsBoard = __decorate([
    class_validator_1.ValidatorConstraint()
], IsBoard);
exports.IsBoard = IsBoard;
exports.isValidTransition = (playerSymbol, from, to) => {
    const changes = from
        .map((row, rowIndex) => row.map((symbol, columnIndex) => ({
        from: symbol,
        to: to[rowIndex][columnIndex]
    })))
        .reduce((a, b) => a.concat(b))
        .filter(change => change.from !== change.to);
    return changes.length === 1 &&
        changes[0].to === playerSymbol &&
        changes[0].from === null;
};
exports.calculateWinner = (board) => board
    .concat([0, 1, 2].map(n => board.map(row => row[n])))
    .concat([
    [0, 1, 2].map(n => board[n][n]),
    [0, 1, 2].map(n => board[2 - n][n])
])
    .filter(row => row[0] && row.every(symbol => symbol === row[0]))
    .map(row => row[0])[0] || null;
exports.calculateHit = (board) => {
    if (board) {
        return false;
    }
};
exports.finished = (board) => board
    .reduce((a, b) => a.concat(b))
    .every(symbol => symbol !== null);
//# sourceMappingURL=logic.js.map