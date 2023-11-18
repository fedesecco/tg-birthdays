import { CommandContext } from 'grammy';
import { Commands, MyContext } from '../enums';
import { buildBdaysMsg } from '../utils';

export async function onToday(ctx: CommandContext<MyContext>) {
    console.log(`${Commands.triggerBdays} triggered`);
    const sender = ctx.from.id;

    const msg = await buildBdaysMsg(sender);
    if (msg) {
        await ctx.reply(msg);
    } else {
        await ctx.reply('Non ci sono compleanni oggi');
    }
}
