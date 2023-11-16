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

    let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('status', UserStatus.SUBSCRIBED);
    if (error) console.log('Error on supabase.from(users).select(): ', error);
    console.log('First row of users: ', data[0]);
    const subscribedUsers: UserRow[] = data;
    const chats = subscribedUsers.map((user) => user.id);
    console.log('Chats: ', chats);
    for (const subscriber of chats) {
        const msg = await buildBdaysMsg(subscriber);
        await bot.api.sendMessage(People.Fede, `Invio messaggio a ${subscriber}`);
    }
}

// markup tastiera figa
/* ctx.reply('Choose an option:', {
    reply_markup: {
        keyboard: [['Option 1', 'Option 2']],
        inline_keyboard: [['Option 1', 'Option 2']],
        one_time_keyboard: true,
    },
}); */
