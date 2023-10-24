import { Bot, webhookCallback } from 'grammy';
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
dotenv.config();
import { Messages, Commands, People, Database } from './enums';
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
} else console.log('Fail on login');

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
    const msg = await buildBdaysMsg();
    bot.api.sendMessage(sender, msg, { parse_mode: 'HTML' });
});

const logRequest = async (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'POST' && req.path === `/${Commands.bdays}`) {
        console.log(`${Commands.bdays} triggered`);
        const msg = await buildBdaysMsg();
        for (const chat of activeChats) {
            bot.api.sendMessage(chat, msg, { parse_mode: 'HTML' });
        }
    }
    next();
};

async function buildBdaysMsg() {
    let { data, error } = await supabase.from('birthdays').select('*');
    if (error) console.log('Error on supabase.from(birthdays).select(): ', error);

    const rowDate = new Date();
    const day = rowDate.getDate().toString().padStart(2, '0');
    const month = (rowDate.getMonth() + 1).toString().padStart(2, '0');
    const today = `${day}/${month}`;

    let bdays: { name: string; birthday: string }[] = [];
    bdays = data.filter((row: { name: string; birthday: string }) => {
        console.log(`Filtering ${row.birthday} (${row.name})`);
        row.birthday.startsWith(today);
    });

    let msg = '';
    if (bdays.length === 0) {
        msg = 'Non ci sono compleanni oggi';
    } else if (bdays.length === 1) {
        msg = `Oggi compie gli anni ${bdays[0].name}`;
    } else if (bdays.length > 1) {
        msg = 'Oggi compiono gli anni';
        bdays.forEach((bday, i) => {
            msg += ` ${bday.name}`;
            i < bdays.length ? (msg += ', ') : (msg += '.');
        });
    } else {
        msg = `error, bdays length is ${bdays.length}`;
    }

    return msg;
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
