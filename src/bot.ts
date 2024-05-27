import { Bot, session, webhookCallback } from "grammy";
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
import { Database } from "./schema";

dotenv.config();

// TELEGRAM BOT INIT
const token = process.env.TELEGRAM_TOKEN;
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

// API calls from cyclic
/* const onRequest = async (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'POST' && req.path === Requests.bdays) {
        await onBirthDaysOfTheDay();
        res.status(200);
        res.send('done');
    } else if (req.method === 'POST' && req.path === Requests.test) {
        await onTestCron();
        res.status(200);
        res.send('done');
    }
    next();
}; */

/**
 * TODO:
 * - i18n
 */

//deploy
/* if (process.env.NODE_ENV === 'production') {
    const app = express();
    app.use(express.json());
    app.use(onRequest);
    app.use(webhookCallback(bot, 'express'));
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Bot listening on port ${PORT}`);
    });
} else {
    console.log(`Bot working on localhost`);
    bot.start();
} */
