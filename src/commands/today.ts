import { CommandContext } from 'grammy';
import { Commands, MyContext } from '../enums';
import { buildBdaysMsg } from '../utils';

export async function onToday(ctx: CommandContext<MyContext>) {
    console.log(`${Commands.unsubscribe} triggered`);
    const sender = ctx.from.id;

    const msg = await buildBdaysMsg(sender);
    if (msg) {
        ctx.reply(msg);
    } else {
        ctx.reply('Non ci sono compleanni oggi');
    }
}
