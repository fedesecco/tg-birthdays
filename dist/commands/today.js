"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onToday = void 0;
const enums_1 = require("../enums");
const utils_1 = require("../utils");
function onToday(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`${enums_1.Commands.triggerBdays} triggered`);
        const sender = ctx.from.id;
        const msg = yield (0, utils_1.buildBdaysMsg)(sender);
        if (msg) {
            yield ctx.reply(msg);
        }
        else {
            yield ctx.reply('Non ci sono compleanni oggi');
        }
    });
}
exports.onToday = onToday;
