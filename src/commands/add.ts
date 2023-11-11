import { CommandContext } from 'grammy';
import { supabase, bot } from '../bot';
import { Commands, UserRow, Messages, BdayRow, MyContext, MyConversation, Convs } from '../enums';

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
            bot.api.sendMessage(sender, Messages.ErrorOnRequest);
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
    const numberMonth = months[inputMonth];
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

const months: { [key: string]: string } = {
    Gennaio: '01',
    Febbraio: '02',
    Marzo: '03',
    Aprile: '04',
    Maggio: '05',
    Giugno: '06',
    Luglio: '07',
    Agosto: '08',
    Settembre: '09',
    Ottobre: '10',
    Novembre: '11',
    Dicembre: '12',
};

// old add
/* const inputText = ctx.message.text.substring(5);

const inputDate = inputText.slice(0, 5);
const inputDay0 = inputText.slice(0, 1);
const inputDay1 = inputText.slice(1, 2);
const inputDivider = inputText.slice(2, 3);
const inputMonth0 = inputText.slice(3, 4);
const inputMonth1 = inputText.slice(4, 5);
const inputName = inputText.slice(5).trim();
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
        bot.api.sendMessage(sender, Messages.ErrorOnRequest);
    }
} */
