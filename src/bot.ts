import { Bot, webhookCallback } from 'grammy';
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
dotenv.config();
import { Messages, Chats, Commands, People } from './enums';
import { createClient } from '@supabase/supabase-js';

// TELEGRAM BOT INIT
const token = process.env.TELEGRAM_TOKEN;
if (!token) {
    console.error('No token!');
}
const bot = new Bot(token);
let storage: any;

// SUPABASE DATABASE INIT
const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
if (supabase.storage) {
    console.log(`Login successful.`);
}

const activeChats: number[] = [People.Fede];

// start
bot.command('start', (ctx) => {
    console.log('/start triggered');
    ctx.reply(Messages.Intro, {
        parse_mode: 'HTML',
    });
});
// help
bot.command('help', (ctx) => {
    console.log('/help triggered');
    ctx.reply(Messages.Help, {
        parse_mode: 'HTML',
    });
});
// test
bot.command('test', async (ctx) => {
    console.log('/test triggered');
    let sender = ctx.from.id;
    console.log('Sender: ', sender);
    let { data, error } = await supabase.from('birthdays').select();
    await sendBdayMessage(Chats.GruppoTest);
});

const logRequest = async (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'POST' && req.path === `/${Commands.bdays}`) {
        console.log(`${Commands.bdays} triggered`);
        for (const chat of activeChats) {
            await sendBdayMessage(chat);
        }
    }
    next();
};

async function sendBdayMessage(chat: number) {
    let msg = '';
    if (users.length === 0) {
        msg =
            'Buongiono! Oggi non compie gli anni nessuno! Ma che merda!<br>Se mi sono dimenticato di qualcuno, potete per favore aggiungerlo';
    }
    msg += `Buongiorno! oggi ${users.length > 1 ? 'compiono' : 'compie'} gli anni ${
        users.length > 1 ? users.length + ' persone!' : 'una persona!'
    }`;
    msg += '<br> Sapreste indovinare chi? (se lo sapete già ';
}

//deploy
if (process.env.NODE_ENV === 'production') {
    // Use Webhooks for the production server
    const app = express();
    app.use(express.json());
    app.use(logRequest);
    app.use(webhookCallback(bot, 'express'));
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Bot listening on port ${PORT}}`);
    });
} else {
    // Use Long Polling for development
    console.log(`Bot working on localhost`);
    bot.start();
}
