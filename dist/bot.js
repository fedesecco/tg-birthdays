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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = exports.bot = void 0;
const grammy_1 = require("grammy");
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const enums_1 = require("./enums");
const supabase_js_1 = require("@supabase/supabase-js");
const add_1 = require("./commands/add");
const delete_1 = require("./commands/delete");
const conversations_1 = require("@grammyjs/conversations");
const test_1 = require("./commands/test");
const subscribe_1 = require("./commands/subscribe");
const unsubscribe_1 = require("./commands/unsubscribe");
const testCron_1 = require("./requests/testCron");
const bdaysOfTheDay_1 = require("./requests/bdaysOfTheDay");
const today_1 = require("./commands/today");
const search_1 = require("./commands/search");
const sync_1 = require("./commands/sync");
const google_1 = require("./google");
dotenv_1.default.config();
const isProduction = process.env.NODE_ENV === "production";
const token = isProduction ? process.env.TELEGRAM_TOKEN : (_a = process.env.TELEGRAM_DEV_BOT_TOKEN) !== null && _a !== void 0 ? _a : process.env.TELEGRAM_TOKEN;
if (!token) {
    console.error("No token!");
}
exports.bot = new grammy_1.Bot(token);
exports.bot.use((0, grammy_1.session)({ initial: () => ({}) }));
exports.bot.use((0, conversations_1.conversations)());
exports.bot.use((0, conversations_1.createConversation)(add_1.addConversation));
exports.bot.use((0, conversations_1.createConversation)(delete_1.deleteConversation));
exports.bot.use((0, conversations_1.createConversation)(search_1.searchConversation));
let storage;
exports.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    auth: { persistSession: false },
});
if (exports.supabase.storage) {
    console.log(`Login successful.`);
}
else
    console.log("Fail on login");
exports.bot.command(enums_1.Commands.start, (ctx) => {
    console.log("/start triggered");
    (0, add_1.onAdd)(ctx);
});
exports.bot.command(enums_1.Commands.triggerBdays, today_1.onToday);
exports.bot.command(enums_1.Commands.test, test_1.onTest);
exports.bot.command(enums_1.Commands.add, add_1.onAdd);
exports.bot.command(enums_1.Commands.delete, delete_1.onDelete);
exports.bot.command(enums_1.Commands.subscribe, subscribe_1.onSubscribe);
exports.bot.command(enums_1.Commands.unsubscribe, unsubscribe_1.onUnsubscribe);
exports.bot.command(enums_1.Commands.search, search_1.onSearch);
exports.bot.command(enums_1.Commands.sync, sync_1.onSync);
const onRequest = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.method === "POST" && req.path === enums_1.Requests.bdays) {
            yield (0, bdaysOfTheDay_1.onBirthDaysOfTheDay)();
            res.status(200).send("done");
            return;
        }
        else if (req.method === "POST" && req.path === enums_1.Requests.test) {
            yield (0, testCron_1.onTestCron)();
            res.status(200).send("done");
            return;
        }
        else if (req.method === "GET" && req.path === enums_1.Requests.googleOAuthCallback) {
            const code = typeof req.query.code === "string" ? req.query.code : undefined;
            const state = typeof req.query.state === "string" ? req.query.state : undefined;
            if (!code) {
                res.status(400).send("Missing OAuth code");
                return;
            }
            const userId = (0, google_1.verifyGoogleAuthState)(state);
            yield (0, google_1.completeGoogleAuthAndSync)(code, userId);
            res.status(200).send("Google account connected. Puoi tornare su Telegram.");
            return;
        }
        next();
    }
    catch (error) {
        console.error("Error in onRequest:", error);
        res.status(500).send("Internal Server Error");
    }
});
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(onRequest);
if (isProduction) {
    app.use((0, grammy_1.webhookCallback)(exports.bot, "express"));
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Bot listening on port ${PORT}`);
    });
}
else {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`OAuth callback listening on port ${PORT}`);
    });
    console.log(`Bot working on localhost`);
    exports.bot.start();
}
