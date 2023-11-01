import { Bot, webhookCallback } from 'grammy';
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { Messages, Commands, BdayRow, UserRow, UserStatus } from './enums';
import { createClient } from '@supabase/supabase-js';
import { buildBdaysMsg, isAdmin } from './utils';
import { onAdd } from './commands/add';

dotenv.config();

// TELEGRAM BOT INIT
const token = process.env.TELEGRAM_TOKEN;
if (!token) {
    console.error('No token!');
}
export const bot = new Bot(token);
let storage: any;

// SUPABASE DATABASE INIT
const app = express();
export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
if (supabase.storage) {
    console.log(`Login successful.`);
} else console.log('Fail on login');

// start
bot.command(Commands.start, (ctx) => {
    console.log('/start triggered');
    /* ctx.reply(Messages.Intro, {
        parse_mode: 'HTML',
    }); */
});

// help
bot.command(Commands.help, (ctx) => {
    console.log('/help triggered');
    ctx.reply(Messages.Help, {
        parse_mode: 'HTML',
    });
});

// test
bot.command(Commands.test, async (ctx) => {
    console.log('/test triggered');
    let sender = ctx.from.id;
    const msg = isAdmin(sender) ? await buildBdaysMsg(sender) : Messages.Unauthorized;
    bot.api.sendMessage(sender, msg, { parse_mode: 'HTML' });
});

// add
bot.command(Commands.add, onAdd);

// API calls from cyclic
const onRequest = async (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'POST' && req.path === `/${Commands.bdays}`) {
        console.log(`${Commands.bdays} triggered`);

        let { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('status', UserStatus.SUBSCRIBED);
        if (error) console.log('Error on supabase.from(users).select(): ', error);
        console.log('First row of users: ', data[0]);

        const subscribedUsers: UserRow[] = data;
        const chats = subscribedUsers.map((user) => user.id);
        chats.forEach(async (subscriber) => {
            const msg = await buildBdaysMsg(subscriber);
            console.log(`Mi accingo ad inviare a ${subscriber} questo messaggio: `, msg);
            bot.api.sendMessage(subscriber, msg, { parse_mode: 'HTML' });
        });
    }
    next();
};

//deploy
if (process.env.NODE_ENV === 'production') {
    // Use Webhooks for the production server
    const app = express();
    app.use(express.json());
    app.use(onRequest);
    app.use(webhookCallback(bot, 'express'));
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Bot listening on port ${PORT}`);
    });
} else {
    // Use Long Polling for development
    console.log(`Bot working on localhost`);
    bot.start();
}
