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
exports.buildBdaysMsg = exports.isAdmin = exports.randomNumber = void 0;
const bot_1 = require("./bot");
const enums_1 = require("./enums");
function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
exports.randomNumber = randomNumber;
function isAdmin(texter) {
    return enums_1.admins.includes(texter);
}
exports.isAdmin = isAdmin;
function buildBdaysMsg(owner) {
    return __awaiter(this, void 0, void 0, function* () {
        let { data, error } = yield bot_1.supabase.from('birthdays').select('*').eq('owner', owner);
        if (error)
            console.log('Error on supabase.from(birthdays).select(): ', error);
        let typedData = data;
        const rowDate = new Date();
        const day = rowDate.getDate().toString().padStart(2, '0');
        const month = (rowDate.getMonth() + 1).toString().padStart(2, '0');
        const today = `${day}/${month}`;
        let bdays = [];
        bdays = typedData.filter((row) => {
            return row.birthday === today;
        });
        let msg = '';
        if (bdays.length === 0) {
            msg = 'Non ci sono compleanni oggi';
        }
        else if (bdays.length === 1) {
            msg = `Oggi compie gli anni ${bdays[0].name}`;
        }
        else if (bdays.length > 1) {
            msg = 'Oggi compiono gli anni';
            bdays.forEach((bday, i) => {
                msg += ` ${bday.name}`;
                i < bdays.length ? (msg += ', ') : (msg += '.');
            });
        }
        else {
            msg = `error, bdays length is ${bdays.length}`;
        }
        return msg;
    });
}
exports.buildBdaysMsg = buildBdaysMsg;
