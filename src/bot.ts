import { Bot, session, webhookCallback } from 'grammy';
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { Commands, UserRow, UserStatus, MyContext, People } from './enums';
import { createClient } from '@supabase/supabase-js';
import { buildBdaysMsg } from './utils';
import { addConversation, onAdd } from './commands/add';
import { onDelete } from './commands/delete';
import { conversations, createConversation } from '@grammyjs/conversations';
import { onTest } from './commands/test';
import { onSubscribe } from './commands/subscribe';
import { onUnsubscribe } from './commands/unsubscribe';

dotenv.config();

// TELEGRAM BOT INIT
const token = process.env.TELEGRAM_TOKEN;
if (!token) {
    console.error('No token!');
}
export const bot = new Bot<MyContext>(token);
/** conversations */
bot.use(session({ initial: () => ({}) }));
bot.use(conversations());
bot.use(createConversation(addConversation));

// SUPABASE DATABASE INIT
let storage: any;
const app = express();
export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
if (supabase.storage) {
    console.log(`Login successful.`);
} else console.log('Fail on login');

// start
bot.command(Commands.start, (ctx) => {
    console.log('/start triggered');
    onAdd(ctx);
});

// today (manda i compleanni del giorno)
bot.command(Commands.triggerBdays, async (ctx) => {
    console.log('/today triggered');
    const sender = ctx.from.id;
    const msg = await buildBdaysMsg(sender);
    await bot.api.sendMessage(sender, msg, { parse_mode: 'HTML' });
});

// test
bot.command(Commands.test, onTest);
bot.command(Commands.add, onAdd);
bot.command(Commands.delete, onDelete);
bot.command(Commands.subscribe, onSubscribe);
bot.command(Commands.unsubscribe, onUnsubscribe);

// API calls from cyclic
const onRequest = async (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'POST' && req.path === `/${Commands.bdays}`) {
        console.log(`${Commands.bdays} triggered`);
        let { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('status', UserStatus.SUBSCRIBED);
        if (error) console.log('Error on supabase.from(users).select(): ', error);

        const subscribedUsers: UserRow[] = data;
        const chats = subscribedUsers.map((user) => user.id);
        for (const subscriber of chats) {
            const msg = await buildBdaysMsg(subscriber);
            await bot.api.sendMessage(subscriber, msg);
        }
    }
    next();
};

/**
 * TODO:
 * - i18n
 * - remove guidato
 * - controlla compleanno da lista nomi
 * - forza messaggio compleanno del giorno
 */

//deploy
if (process.env.NODE_ENV === 'production') {
    const app = express();
    app.use(express.json());
    app.use(onRequest);
    app.use(webhookCallback(bot, 'express'));
    /** listen */
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Bot listening on port ${PORT}`);
    });
} else {
    console.log(`Bot working on localhost`);
    bot.start();
}
