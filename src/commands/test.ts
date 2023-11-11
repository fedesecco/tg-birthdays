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

// markup tastiera figa
/* ctx.reply('Choose an option:', {
    reply_markup: {
        keyboard: [['Option 1', 'Option 2']],
        inline_keyboard: [['Option 1', 'Option 2']],
        one_time_keyboard: true,
    },
}); */
