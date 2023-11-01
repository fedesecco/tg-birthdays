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
exports.supabase = exports.bot = void 0;
const grammy_1 = require("grammy");
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const enums_1 = require("./enums");
const supabase_js_1 = require("@supabase/supabase-js");
const utils_1 = require("./utils");
const add_1 = require("./commands/add");
const delete_1 = require("./commands/delete");
dotenv_1.default.config();
const token = process.env.TELEGRAM_TOKEN;
if (!token) {
    console.error('No token!');
}
exports.bot = new grammy_1.Bot(token);
let storage;
const app = (0, express_1.default)();
exports.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
if (exports.supabase.storage) {
    console.log(`Login successful.`);
}
else
    console.log('Fail on login');
exports.bot.command(enums_1.Commands.start, (ctx) => {
    console.log('/start triggered');
});
exports.bot.command(enums_1.Commands.help, (ctx) => {
    console.log('/help triggered');
    ctx.reply(enums_1.Messages.Help, {
        parse_mode: 'HTML',
    });
});
exports.bot.command(enums_1.Commands.test, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('/test triggered');
    let sender = ctx.from.id;
    const msg = (0, utils_1.isAdmin)(sender) ? yield (0, utils_1.buildBdaysMsg)(sender) : enums_1.Messages.Unauthorized;
    exports.bot.api.sendMessage(sender, msg, { parse_mode: 'HTML' });
}));
exports.bot.command(enums_1.Commands.add, add_1.onAdd);
exports.bot.command(enums_1.Commands.delete, delete_1.onDelete);
const onRequest = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.method === 'POST' && req.path === `/${enums_1.Commands.bdays}`) {
        console.log(`${enums_1.Commands.bdays} triggered`);
        let { data, error } = yield exports.supabase
            .from('users')
            .select('*')
            .eq('status', enums_1.UserStatus.SUBSCRIBED);
        if (error)
            console.log('Error on supabase.from(users).select(): ', error);
        console.log('First row of users: ', data[0]);
        const subscribedUsers = data;
        const chats = subscribedUsers.map((user) => user.id);
        chats.forEach((subscriber) => __awaiter(void 0, void 0, void 0, function* () {
            const msg = yield (0, utils_1.buildBdaysMsg)(subscriber);
            console.log(`Mi accingo ad inviare a ${subscriber} questo messaggio: `, msg);
            exports.bot.api.sendMessage(subscriber, msg, { parse_mode: 'HTML' });
        }));
    }
    next();
});
if (process.env.NODE_ENV === 'production') {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use(onRequest);
    app.use((0, grammy_1.webhookCallback)(exports.bot, 'express'));
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Bot listening on port ${PORT}`);
    });
}
else {
    console.log(`Bot working on localhost`);
    exports.bot.start();
}
