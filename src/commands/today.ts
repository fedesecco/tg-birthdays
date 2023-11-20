import { CommandContext } from 'grammy';
import { Commands, FullContext } from '../enums';
import { buildBdaysMsg } from '../utils';

export async function onToday(ctx: CommandContext<FullContext>) {
    console.log(`${Commands.triggerBdays} triggered`);
    const sender = ctx.from.id;

    const msg = await buildBdaysMsg(sender, ctx);
    if (msg) {
        await ctx.reply(msg);
    } else {
        await ctx.reply(ctx.t('global.noBirthdays'));
    }
}
