import { Bot, session, webhookCallback } from "grammy";
import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { Commands, MyContext, Requests } from "./enums";
import { createClient } from "@supabase/supabase-js";
import { addConversation, onAdd } from "./commands/add";
import { deleteConversation, onDelete } from "./commands/delete";
import { conversations, createConversation } from "@grammyjs/conversations";
import { onTest } from "./commands/test";
import { onSubscribe } from "./commands/subscribe";
import { onUnsubscribe } from "./commands/unsubscribe";
import { onTestCron } from "./requests/testCron";
import { onBirthDaysOfTheDay } from "./requests/bdaysOfTheDay";
import { onToday } from "./commands/today";
import { onSearch, searchConversation } from "./commands/search";
import { onSync } from "./commands/sync";
import { Database } from "./schema";
import { completeGoogleAuthAndSync, verifyGoogleAuthState } from "./google";

dotenv.config();

// TELEGRAM BOT INIT
const isProduction = process.env.NODE_ENV === "production";
const token = isProduction ? process.env.TELEGRAM_TOKEN : process.env.TELEGRAM_DEV_BOT_TOKEN ?? process.env.TELEGRAM_TOKEN;
if (!token) {
    console.error("No token!");
}
export const bot = new Bot<MyContext>(token);
/** conversations */
bot.use(session({ initial: () => ({}) }));
bot.use(conversations());
bot.use(createConversation(addConversation));
bot.use(createConversation(deleteConversation));
bot.use(createConversation(searchConversation));

// SUPABASE DATABASE INIT
let storage: any;
export const supabase = createClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    auth: { persistSession: false },
});
if (supabase.storage) {
    console.log(`Login successful.`);
} else console.log("Fail on login");

// start
bot.command(Commands.start, (ctx) => {
    console.log("/start triggered");
    onAdd(ctx);
});

bot.command(Commands.triggerBdays, onToday);
bot.command(Commands.test, onTest);
bot.command(Commands.add, onAdd);
bot.command(Commands.delete, onDelete);
bot.command(Commands.subscribe, onSubscribe);
bot.command(Commands.unsubscribe, onUnsubscribe);
bot.command(Commands.search, onSearch);
bot.command(Commands.sync, onSync);

// API calls from cyclic
const onRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.method === "POST" && req.path === Requests.bdays) {
            await onBirthDaysOfTheDay();
            res.status(200).send("done");
            return;
        } else if (req.method === "POST" && req.path === Requests.test) {
            await onTestCron();
            res.status(200).send("done");
            return;
        } else if (req.method === "GET" && req.path === Requests.googleOAuthCallback) {
            const code = typeof req.query.code === "string" ? req.query.code : undefined;
            const state = typeof req.query.state === "string" ? req.query.state : undefined;
            if (!code) {
                res.status(400).send("Missing OAuth code");
                return;
            }

            const userId = verifyGoogleAuthState(state);
            await completeGoogleAuthAndSync(code, userId);
            res.status(200).send("Google account connected. Puoi tornare su Telegram.");
            return;
        }
        next();
    } catch (error) {
        console.error("Error in onRequest:", error);
        res.status(500).send("Internal Server Error");
    }
};

/**
 * TODO:
 * - i18n
 */

const app = express();
app.use(express.json());
app.use(onRequest);

//deploy
if (isProduction) {
    app.use(webhookCallback(bot, "express"));
    /** listen */
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Bot listening on port ${PORT}`);
    });
} else {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`OAuth callback listening on port ${PORT}`);
    });
    console.log(`Bot working on localhost`);
    bot.start();
}
