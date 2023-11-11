import { CommandContext } from 'grammy';
import { bot, supabase } from '../bot';
import { BdayRow, Convs, Messages, MyContext, MyConversation } from '../enums';
import { isAdmin } from '../utils';

export async function onTest(ctx: CommandContext<MyContext>) {
    console.log('/test triggered');
    const sender = ctx.from.id;
    if (!isAdmin(sender)) {
        bot.api.sendMessage(sender, Messages.Unauthorized);
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
        },
    });
    const inputDay = (await conversation.waitFor(':text')).message.text;

    await ctx.reply('E che mese?', {
        reply_markup: {
            keyboard: monthButtons,
        },
    });
    const inputMonth = (await conversation.waitFor(':text')).message.text;
    const inputDate = inputDay + '/' + inputMonth;

    try {
        await supabase
            .from('birthdays')
            .insert<BdayRow[]>([{ name: inputName, birthday: inputDate, owner: sender }]);
        ctx.reply(`Aggiunto/a ${inputName} con compleanno il ${inputDate}`);
    } catch (error) {
        console.log("Error on supabase.from('birthdays').insert: ", error);
        ctx.reply(Messages.ErrorOnRequest);
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
    return [{ text: day, callback_data: `2023-01-${day}` }];
});

const monthButtons = [
    [{ text: 'January', callback_data: '01' }],
    [{ text: 'February', callback_data: '02' }],
    [{ text: 'March', callback_data: '03' }],
    [{ text: 'April', callback_data: '04' }],
    [{ text: 'May', callback_data: '05' }],
    [{ text: 'June', callback_data: '06' }],
    [{ text: 'July', callback_data: '07' }],
    [{ text: 'August', callback_data: '08' }],
    [{ text: 'September', callback_data: '09' }],
    [{ text: 'October', callback_data: '10' }],
    [{ text: 'November', callback_data: '11' }],
    [{ text: 'December', callback_data: '12' }],
];

// markup tastiera figa
/* ctx.reply('Choose an option:', {
    reply_markup: {
        keyboard: [['Option 1', 'Option 2']],
        inline_keyboard: [['Option 1', 'Option 2']],
        one_time_keyboard: true,
    },
}); */
