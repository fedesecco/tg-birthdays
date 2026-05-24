import { Bot, session } from "grammy";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { conversations, createConversation } from "@grammyjs/conversations";
import { Database } from "./schema";
import { MyContext } from "./enums";
import { addConversation } from "./commands/add";
import { deleteConversation } from "./commands/delete";
import { searchConversation } from "./commands/search";

dotenv.config();

export const isProduction = process.env.NODE_ENV === "production";
const token = isProduction ? process.env.TELEGRAM_TOKEN : process.env.TELEGRAM_DEV_BOT_TOKEN ?? process.env.TELEGRAM_TOKEN;
if (!token) {
    console.error("No token!");
}

export const bot = new Bot<MyContext>(token);
bot.use(session({ initial: () => ({}) }));
bot.use(conversations());
bot.use(createConversation(addConversation));
bot.use(createConversation(deleteConversation));
bot.use(createConversation(searchConversation));

export const supabase = createClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    auth: { persistSession: false },
});

if (supabase.storage) {
    console.log("Login successful.");
} else {
    console.log("Fail on login");
}
