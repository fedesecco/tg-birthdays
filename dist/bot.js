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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const grammy_1 = require("grammy");
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const enums_1 = require("./enums");
const supabase_js_1 = require("@supabase/supabase-js");
dotenv_1.default.config();
const token = process.env.TELEGRAM_TOKEN;
if (!token) {
    console.error('No token!');
}
const bot = new grammy_1.Bot(token);
let storage;
const app = (0, express_1.default)();
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    auth: { persistSession: false },
});
if (supabase.storage) {
    console.log(`Login successful.`);
}
else
    console.log('Fail on login');
const activeChats = [enums_1.People.Fede];
const admins = [enums_1.People.Fede];
bot.command(enums_1.Commands.start, (ctx) => {
    console.log('/start triggered');
    ctx.reply(enums_1.Messages.Intro, {
        parse_mode: 'HTML',
    });
});
bot.command(enums_1.Commands.help, (ctx) => {
    console.log('/help triggered');
    ctx.reply(enums_1.Messages.Help, {
        parse_mode: 'HTML',
    });
});
bot.command(enums_1.Commands.test, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('/test triggered');
    let sender = ctx.from.id;
    const msg = isAdmin(sender) ? yield buildBdaysMsg() : enums_1.Messages.Unauthorized;
    bot.api.sendMessage(sender, msg, { parse_mode: 'HTML' });
}));
bot.command(enums_1.Commands.add, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`${enums_1.Commands.add} triggered`);
    const sender = ctx.from.id;
    const inputText = ctx.message.text.substring(5);
    if (isAdmin(sender)) {
        const inputDate = inputText.slice(0, 5);
        const inputDay0 = inputText.slice(0, 1);
        const inputDay1 = inputText.slice(1, 2);
        const inputDivider = inputText.slice(2, 3);
        const inputMonth0 = inputText.slice(3, 4);
        const inputMonth1 = inputText.slice(4, 5);
        const inputName = inputText.slice(5);
        if (inputText.length > 26) {
            bot.api.sendMessage(sender, enums_1.Messages.WrongFormat + enums_1.Messages.TextTooLong);
        }
        else if (!['0,', '1', '2', '3'].includes(inputDay0) ||
            !['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(inputDay1) ||
            !['0', '1'].includes(inputMonth0) ||
            !['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(inputMonth1) ||
            inputDivider != '/') {
            bot.api.sendMessage(sender, enums_1.Messages.WrongFormat);
        }
        else {
            try {
                yield supabase.from('birthdays').insert([{ name: inputName, birthday: inputDate }]);
                bot.api.sendMessage(sender, `Aggiunto ${inputName} con compleanno il ${inputDate}`);
            }
            catch (error) {
                console.log("Error on supabase.from('birthdays').insert: ", error);
                bot.api.sendMessage(sender, enums_1.Messages.ErrorOnInsert);
            }
        }
    }
    else {
        bot.api.sendMessage(sender, enums_1.Messages.Unauthorized);
    }
}));
const logRequest = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.method === 'POST' && req.path === `/${enums_1.Commands.bdays}`) {
        console.log(`${enums_1.Commands.bdays} triggered`);
        const msg = yield buildBdaysMsg();
        for (const chat of activeChats) {
            bot.api.sendMessage(chat, msg, { parse_mode: 'HTML' });
        }
    }
    next();
});
function buildBdaysMsg() {
    return __awaiter(this, void 0, void 0, function* () {
        let { data, error } = yield supabase.from('birthdays').select('*');
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
function isAdmin(texter) {
    return admins.includes(texter);
}
if (process.env.NODE_ENV === 'production') {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use(logRequest);
    app.use((0, grammy_1.webhookCallback)(bot, 'express'));
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Bot listening on port ${PORT}`);
    });
}
else {
    console.log(`Bot working on localhost`);
    bot.start();
}