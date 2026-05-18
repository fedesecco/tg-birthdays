import { KeyboardButton } from "grammy/types";
import { supabase } from "./bot";
import { admins } from "./enums";

export function randomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export function isAdmin(texter: number) {
    return admins.includes(texter);
}

export async function buildBdaysMsg(owner: number): Promise<string | null> {
    const rawDate = new Date();
    const day = rawDate.getDate();
    const month = rawDate.getMonth() + 1;

    let { data, error } = await supabase
        .from("birthdays")
        .select("*")
        .eq("birth_day", day)
        .eq("birth_month", month)
        .eq("user_id", owner);
    if (error) console.log("Error on supabase.from(birthdays).select(): ", error);
    const rows = data ?? [];

    let msg: string | null = "";
    if (rows.length === 0) {
        msg = null;
    } else if (rows.length === 1) {
        msg = `Oggi compie gli anni ${rows[0].display_name}`;
    } else if (rows.length > 1) {
        msg = "Oggi compiono gli anni";
        rows.forEach((bday, i) => {
            msg += ` ${bday.display_name}`;
            i < rows.length - 1 ? (msg += ", ") : (msg += ".");
        });
    } else {
        msg = `error, data length is ${rows.length}`;
    }

    return msg;
}

export async function getNamesTable(user: number): Promise<{
    keyboard: KeyboardButton[][];
    rawData: {
        birth_day: number;
        birth_month: number;
        birth_year: number | null;
        date_added: string | null;
        display_name: string;
        user_id: number;
    }[];
}> {
    let { data, error } = await supabase.from("birthdays").select("*").eq("user_id", user);
    if (error) console.log("Error on supabase.from(birthdays).select(): ", error);
    const rows = data ?? [];
    let names = rows.map((row) => {
        return row.display_name;
    });
    let keyboard: { text: string }[][] = [];
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
    return { keyboard: keyboard, rawData: rows };
}
