import { CommandContext } from 'grammy';
import { Commands, Convs, MyContext, MyConversation, numberToMonth } from '../enums';
import { getNamesTable } from '../utils';

export async function onSearch(ctx: CommandContext<MyContext>) {
    console.log(`${Commands.search} triggered`);
    await ctx.conversation.enter(Convs.deleteConversation);
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
    const date = rawData.filter((row) => row.name === nameToShowBday).map((row) => row.birthday)[0];
    const day = date.substring(0, 2);
    const month = numberToMonth[date.substring(3, 5)];
    await ctx.reply(`Il compleanno di ${nameToShowBday} è il ${day} ${month}`);
}
