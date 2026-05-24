import { webhookCallback } from "grammy";
import express, { Request, Response, NextFunction } from "express";
import { Commands, MyContext, Requests } from "./enums";
import { addConversation, onAdd } from "./commands/add";
import { deleteConversation, onDelete } from "./commands/delete";
import { onTest } from "./commands/test";
import { onSubscribe } from "./commands/subscribe";
import { onUnsubscribe } from "./commands/unsubscribe";
import { onTestCron } from "./requests/testCron";
import { onBirthDaysOfTheDay } from "./requests/bdaysOfTheDay";
import { onToday } from "./commands/today";
import { onSearch, searchConversation } from "./commands/search";
import { onSync } from "./commands/sync";
import { completeGoogleAuthAndSync, verifyGoogleAuthState } from "./google";
import { bot, isProduction } from "./platform";
import { registerApiRoutes } from "./web-api";

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

// Internal HTTP routes for scheduled tasks and OAuth callbacks
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
registerApiRoutes(app);

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
