import { supabase } from './bot';
import { BdayRow, FullContext, Tables, admins } from './enums';

export function randomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export function isAdmin(texter: number) {
    return admins.includes(texter);
}

export async function buildBdaysMsg(owner: number, ctx: FullContext): Promise<string | null> {
    const rawDate = new Date();
    const day = rawDate.getDate().toString().padStart(2, '0');
    const month = (rawDate.getMonth() + 1).toString().padStart(2, '0');
    const today = `${day}/${month}`;

    let { data, error } = await supabase
        .from(Tables.birthdays)
        .select('*')
        .eq('birthday', today)
        .eq('owner', owner);
    if (error) console.log('Error on supabase.from(birthdays).select(): ', error);
    let bdays = data as BdayRow[];

    let msg: string | null = '';
    if (bdays.length === 0) {
        msg = null;
    } else if (bdays.length === 1) {
        msg = ctx.t('bdayMsg.singular') + bdays[0].name;
    } else if (bdays.length > 1) {
        msg = ctx.t('bdayMsg.plural');
        bdays.forEach((bday, i) => {
            msg += ` ${bday.name}`;
            i < bdays.length ? (msg += ', ') : (msg += '.');
        });
    } else {
        msg = `error, bdays length is ${bdays.length}`;
    }

    return msg;
}
