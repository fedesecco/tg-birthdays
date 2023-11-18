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
exports.onBirthDaysOfTheDay = void 0;
const bot_1 = require("../bot");
const enums_1 = require("../enums");
const utils_1 = require("../utils");
function onBirthDaysOfTheDay() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`${enums_1.Requests.bdays} triggered`);
        let { data, error } = yield bot_1.supabase
            .from('users')
            .select('*')
            .eq('status', enums_1.UserStatus.SUBSCRIBED);
        if (error)
            console.log('Error on supabase.from(users).select(): ', error);
        const subscribedUsers = data;
        const chats = subscribedUsers.map((user) => user.id);
        for (const subscriber of chats) {
            const msg = yield (0, utils_1.buildBdaysMsg)(subscriber);
            if (msg) {
                yield bot_1.bot.api.sendMessage(subscriber, msg);
            }
        }
    });
}
exports.onBirthDaysOfTheDay = onBirthDaysOfTheDay;
