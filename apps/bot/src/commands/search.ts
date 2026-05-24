import { CommandContext } from 'grammy';
import { Commands, Convs, MyContext, MyConversation, numberToMonth } from '../enums';
import { getNamesTable } from '../utils';

export async function onSearch(ctx: CommandContext<MyContext>) {
    console.log(`${Commands.search} triggered`);
    await ctx.conversation.enter(Convs.searchConversation);
}

export async function searchConversation(conversation: MyConversation, ctx: MyContext) {
    const sender = ctx.from.id;
    const { keyboard, rawData } = await getNamesTable(sender);
    await ctx.reply('Di chi vuoi vedere il compleanno?', {
        reply_markup: {
            keyboard: keyboard,
            one_time_keyboard: true,
        },
    });

    const nameToShowBday = (await conversation.waitFor(':text')).message.text;
    const birthday = rawData.find((row) => row.display_name === nameToShowBday);
    if (!birthday) {
        await ctx.reply(`Non ho trovato nessuno con nome "${nameToShowBday}"`);
        return;
    }

    const day = birthday.birth_day.toString().padStart(2, '0');
    const month = numberToMonth[birthday.birth_month.toString().padStart(2, '0')];
    await ctx.reply(`Il compleanno di ${nameToShowBday} e' il ${day} ${month}`);
}
