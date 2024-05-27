import { webhookCallback } from "grammy";
import { bot } from "../bot";

export default webhookCallback(bot, "aws-lambda");
