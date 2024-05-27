"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const grammy_1 = require("grammy");
const bot_1 = require("../bot");
exports.default = (0, grammy_1.webhookCallback)(bot_1.bot, "aws-lambda");
