import { KeyboardButton } from 'grammy/types';
import { supabase } from './bot';
import { BdayRow, Tables, admins } from './enums';

export function randomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export function isAdmin(texter: number) {
    return admins.includes(texter);
}

export async function buildBdaysMsg(owner: number): Promise<string | null> {
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
        msg = `Oggi compie gli anni ${bdays[0].name}`;
    } else if (bdays.length > 1) {
        msg = 'Oggi compiono gli anni';
        bdays.forEach((bday, i) => {
            msg += ` ${bday.name}`;
            i < bdays.length ? (msg += ', ') : (msg += '.');
        });
    } else {
        msg = `error, bdays length is ${bdays.length}`;
    }

    return msg;
}

export async function getNamesTable(
    user: number
): Promise<{ keyboard: KeyboardButton[][]; rawData: BdayRow[] }> {
    let { data, error } = await supabase.from(Tables.birthdays).select('*').eq('owner', user);
    if (error) console.log('Error on supabase.from(birthdays).select(): ', error);
    let bdayRows = data as BdayRow[];
    let names = bdayRows.map((row) => {
        return row.name;
    });
    let keyboard = [];
    names.forEach((name) => {
        keyboard.push([{ text: name }]);
    });
    keyboard.sort((a, b) => {
        const textA = a[0].text.toUpperCase();
        const textB = b[0].text.toUpperCase();
        if (textA < textB) {
            return -1;
        } else if (textA > textB) {
            return 1;
        } else return 0;
    });
    return { keyboard: keyboard, rawData: bdayRows };
}
