import { Bot, webhookCallback } from 'grammy';
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { Messages, Commands, BdayRow, UserRow, UserStatus } from './enums';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from './utils';

dotenv.config();

// TELEGRAM BOT INIT
const token = process.env.TELEGRAM_TOKEN;
if (!token) {
    console.error('No token!');
}
const bot = new Bot(token);
let storage: any;

// SUPABASE DATABASE INIT
const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    auth: { persistSession: false },
});
if (supabase.storage) {
    console.log(`Login successful.`);
} else console.log('Fail on login');

// start
bot.command(Commands.start, (ctx) => {
    console.log('/start triggered');
    ctx.reply(Messages.Intro, {
        parse_mode: 'HTML',
    });
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

// add someone
bot.command(Commands.add, async (ctx) => {
    console.log(`${Commands.add} triggered`);
    const sender = ctx.from.id;

    let { data, error } = await supabase.from('users').select('*');
    if (error) console.log('Error on supabase.from(birthdays).select(): ', error);

    const userRows: UserRow[] = data;
    const users = userRows.map((userRow) => userRow.id);
    if (!users.includes(sender)) {
        try {
            await supabase.from('users').insert<UserRow[]>([{ id: sender }]);
        } catch (error) {
            console.log("Error on supabase.from('users').insert: ", error);
            bot.api.sendMessage(sender, Messages.ErrorOnInsert);
        }
    }

    // "/add 05/34 Mario" diventa "05/04 Mario"
    const inputText = ctx.message.text.substring(5);

    const inputDate = inputText.slice(0, 5);
    const inputDay0 = inputText.slice(0, 1);
    const inputDay1 = inputText.slice(1, 2);
    const inputDivider = inputText.slice(2, 3);
    const inputMonth0 = inputText.slice(3, 4);
    const inputMonth1 = inputText.slice(4, 5);
    const inputName = inputText.slice(5);
    if (inputText.length > 36) {
        bot.api.sendMessage(sender, Messages.TextTooLong);
    } else if (
        !['0', '1', '2', '3'].includes(inputDay0) ||
        !['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(inputDay1) ||
        !['0', '1'].includes(inputMonth0) ||
        !['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(inputMonth1) ||
        inputDivider != '/'
    ) {
        bot.api.sendMessage(sender, Messages.WrongAddFormat);
    } else {
        try {
            await supabase
                .from('birthdays')
                .insert<BdayRow[]>([{ name: inputName, birthday: inputDate, owner: sender }]);
            bot.api.sendMessage(sender, `Aggiunto/a ${inputName} con compleanno il ${inputDate}`);
        } catch (error) {
            console.log("Error on supabase.from('birthdays').insert: ", error);
            bot.api.sendMessage(sender, Messages.ErrorOnInsert);
        }
    }
});

async function buildBdaysMsg(owner: number) {
    let { data, error } = await supabase.from('birthdays').select('*').eq('owner', owner);
    if (error) console.log('Error on supabase.from(birthdays).select(): ', error);
    let typedData = data as BdayRow[];

    const rowDate = new Date();
    const day = rowDate.getDate().toString().padStart(2, '0');
    const month = (rowDate.getMonth() + 1).toString().padStart(2, '0');
    const today = `${day}/${month}`;

    let bdays: BdayRow[] = [];
    bdays = typedData.filter((row) => {
        return row.birthday === today;
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

const onRequest = async (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'POST' && req.path === `/${Commands.bdays}`) {
        console.log(`${Commands.bdays} triggered`);

        let { data, error } = await supabase.from('users').select('*');
        if (error) console.log('Error on supabase.from(birthdays).select(): ', error);

        const users: UserRow[] = data;
        const chats = users
            .filter((user) => user.status === UserStatus.SUBSCRIBED)
            .map((user) => user.id);
        chats.forEach(async (subscriber) => {
            const msg = await buildBdaysMsg(subscriber);
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
