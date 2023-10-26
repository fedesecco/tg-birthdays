"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.randomNumber = void 0;
const enums_1 = require("./enums");
function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
exports.randomNumber = randomNumber;
function isAdmin(texter) {
    return enums_1.admins.includes(texter);
}
exports.isAdmin = isAdmin;
