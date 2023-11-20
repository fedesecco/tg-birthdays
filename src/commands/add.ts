import { CommandContext } from 'grammy';
import { supabase, bot } from '../bot';
import {
    Commands,
    UserRow,
    Messages,
    BdayRow,
    MyContext,
    MyConversation,
    Convs,
    monthToNumber,
} from '../enums';

export async function onAdd(ctx: CommandContext<MyContext>) {
    console.log(`${Commands.add} triggered`);
    const sender = ctx.from.id;
    const senderName = ctx.from.first_name;

    let { data, error } = await supabase.from('users').select('*');
    if (error) console.log('Error on supabase.from(users).select(): ', error);

    const userRows: UserRow[] = data;
    const users = userRows.map((userRow) => userRow.id);
    if (!users.includes(sender)) {
        try {
            await supabase.from('users').insert<UserRow[]>([{ id: sender, name: senderName }]);
        } catch (error) {
            console.log("Error on supabase.from('users').insert: ", error);
            await bot.api.sendMessage(sender, Messages.ErrorOnRequest);
        }
    }

    await ctx.conversation.enter(Convs.addConversation);
}

export async function addConversation(conversation: MyConversation, ctx: MyContext) {
    const sender = ctx.from.id;
    await ctx.reply('Chi vuoi aggiungere?');
    const inputName = await askName(conversation, ctx);

    await ctx.reply('In che giorno compie gli anni?', {
        reply_markup: {
            keyboard: dayButtons,
            one_time_keyboard: true,
        },
    });
    const inputDay = (await conversation.waitFor(':text')).message.text;

    await ctx.reply('E che mese?', {
        reply_markup: {
            keyboard: monthButtons,
            one_time_keyboard: true,
        },
    });
    const inputMonth = (await conversation.waitFor(':text')).message.text;
    const numberMonth = monthToNumber[inputMonth];
    const inputDate = inputDay + '/' + numberMonth;

    try {
        await supabase
            .from('birthdays')
            .insert<BdayRow[]>([{ name: inputName, birthday: inputDate, owner: sender }]);
        await ctx.reply(`Aggiunto/a ${inputName} con compleanno il ${inputDay} ${inputMonth}`);
    } catch (error) {
        console.log("Error on supabase.from('birthdays').insert: ", error);
        await ctx.reply(Messages.ErrorOnRequest);
    }
}

async function askName(conversation: MyConversation, ctx: MyContext) {
    let result = (await conversation.waitFor(':text')).message.text;

    if (result.length > 50) {
        await ctx.reply(`Name trppo lungo! Ho la memoria breve io. Re-inseriscilo`);
        result = await askName(conversation, ctx);
    }
    return result;
}

const dayButtons = Array.from({ length: 31 }, (_, index) => {
    const day = (index + 1).toString().padStart(2, '0');
    return [{ text: day, callback_data: `${day}` }];
});

const monthButtons = [
    [{ text: 'Gennaio' }],
    [{ text: 'Febbraio' }],
    [{ text: 'Marzo' }],
    [{ text: 'Aprile' }],
    [{ text: 'Maggio' }],
    [{ text: 'Giugno' }],
    [{ text: 'Luglio' }],
    [{ text: 'Agosto' }],
    [{ text: 'Settembre' }],
    [{ text: 'Ottobre' }],
    [{ text: 'Novembre' }],
    [{ text: 'Dicembre' }],
];
