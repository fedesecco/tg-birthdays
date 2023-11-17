import { CommandContext } from 'grammy';
import { bot, supabase } from '../bot';
import { Messages, MyContext, People, UserRow, UserStatus } from '../enums';
import { buildBdaysMsg, isAdmin } from '../utils';

export async function onTest(ctx: CommandContext<MyContext>) {
    console.log('/test triggered');
    const sender = ctx.from.id;
    if (!isAdmin(sender)) {
        await bot.api.sendMessage(sender, Messages.Unauthorized);
    }

    ctx.reply(`Your language is ${ctx.from.language_code}`);
}

// markup tastiera figa
/* ctx.reply('Choose an option:', {
    reply_markup: {
        keyboard: [['Option 1', 'Option 2']],
        inline_keyboard: [['Option 1', 'Option 2']],
        one_time_keyboard: true,
    },
}); */
