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
dotenv_1.default.config();
const enums_1 = require("./enums");
const supabase_js_1 = require("@supabase/supabase-js");
const token = process.env.TELEGRAM_TOKEN;
if (!token) {
    console.error('No token!');
}
const bot = new grammy_1.Bot(token);
let storage;
const app = (0, express_1.default)();
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
if (supabase.storage) {
    console.log(`Login successful.`);
}
else
    console.log('Fail on login');
const activeChats = [enums_1.People.Fede];
bot.command('start', (ctx) => {
    console.log('/start triggered');
    ctx.reply(enums_1.Messages.Intro, {
        parse_mode: 'HTML',
    });
});
bot.command('help', (ctx) => {
    console.log('/help triggered');
    ctx.reply(enums_1.Messages.Help, {
        parse_mode: 'HTML',
    });
});
bot.command('test', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('/test triggered');
    let sender = ctx.from.id;
    console.log('Sender: ', sender);
    const msg = yield buildBdaysMsg();
    bot.api.sendMessage(sender, msg, { parse_mode: 'HTML' });
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
        const rowDate = new Date();
        const day = rowDate.getDate().toString().padStart(2, '0');
        const month = (rowDate.getMonth() + 1).toString().padStart(2, '0');
        const today = `${day}/${month}`;
        let bdays = [];
        bdays = data.filter((row) => {
            const [rowYear, rowMonth, rowDay] = row.birthday.split('-');
            const rowDate = `${rowDay}/${rowMonth}`;
            console.log(`Testing ${row.name}: ${row.birthday} -> ${rowDate} vs ${today}: ${rowDate === today}`);
            return rowDate === today;
        });
        console.log('bdays: ', bdays);
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
if (process.env.NODE_ENV === 'production') {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use(logRequest);
    app.use((0, grammy_1.webhookCallback)(bot, 'express'));
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Bot listening on port ${PORT}}`);
    });
}
else {
    console.log(`Bot working on localhost`);
    bot.start();
}
