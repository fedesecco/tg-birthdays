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
exports.getNamesTable = exports.buildBdaysMsg = exports.isAdmin = exports.randomNumber = void 0;
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
        if (owner == null) {
            return null;
        }
        const rawDate = new Date();
        const day = rawDate.getDate();
        const month = rawDate.getMonth() + 1;
        let { data, error } = yield bot_1.supabase
            .from("birthdays")
            .select("*")
            .eq("birth_day", day)
            .eq("birth_month", month)
            .eq("user_id", owner);
        if (error)
            console.log("Error on supabase.from(birthdays).select(): ", error);
        const rows = data !== null && data !== void 0 ? data : [];
        let msg = "";
        if (rows.length === 0) {
            msg = null;
        }
        else if (rows.length === 1) {
            msg = `Oggi compie gli anni ${rows[0].display_name}`;
        }
        else if (rows.length > 1) {
            msg = "Oggi compiono gli anni";
            rows.forEach((bday, i) => {
                msg += ` ${bday.display_name}`;
                i < rows.length - 1 ? (msg += ", ") : (msg += ".");
            });
        }
        else {
            msg = `error, data length is ${rows.length}`;
        }
        return msg;
    });
}
exports.buildBdaysMsg = buildBdaysMsg;
function getNamesTable(user) {
    return __awaiter(this, void 0, void 0, function* () {
        if (user == null) {
            return { keyboard: [], rawData: [] };
        }
        let { data, error } = yield bot_1.supabase.from("birthdays").select("*").eq("user_id", user);
        if (error)
            console.log("Error on supabase.from(birthdays).select(): ", error);
        const rows = data !== null && data !== void 0 ? data : [];
        let names = rows.map((row) => {
            return row.display_name;
        });
        let keyboard = [];
        names.forEach((name) => {
            keyboard.push([{ text: name }]);
        });
        keyboard.sort((a, b) => {
            const textA = a[0].text.toUpperCase();
            const textB = b[0].text.toUpperCase();
            if (textA < textB) {
                return -1;
            }
            else if (textA > textB) {
                return 1;
            }
            else
                return 0;
        });
        return { keyboard: keyboard, rawData: rows };
    });
}
exports.getNamesTable = getNamesTable;
