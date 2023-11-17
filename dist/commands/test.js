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
exports.onTest = void 0;
const bot_1 = require("../bot");
const enums_1 = require("../enums");
const utils_1 = require("../utils");
function onTest(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('/test triggered');
        const sender = ctx.from.id;
        if (!(0, utils_1.isAdmin)(sender)) {
            yield bot_1.bot.api.sendMessage(sender, enums_1.Messages.Unauthorized);
        }
        else {
            console.log(`Your language is ${ctx.from.language_code}`);
            yield ctx.reply(`Your language is ${ctx.from.language_code}`);
        }
    });
}
exports.onTest = onTest;
