"use strict";
const { default: makeWASocket, getContentType } = require("@adiwajshing/baileys");
const { format } = require("util");
const { exec } = require("child_process");
const chalk = require("chalk");
const moment = require("moment-timezone");

moment.tz.setDefault("Asia/Jakarta").locale("id");

const color = (text, color) => {
  return !color ? chalk.green(text) : chalk.keyword(color)(text);
};

module.exports = async (wann, m) => {
  const time = moment().tz("Asia/Jakarta").format("HH:mm:ss");
  const msg = m.messages[0];
  const from = msg.key.remoteJid;
  const isGroup = from.endsWith("@g.us");
  const type = getContentType(msg.message);

  if (type === "ephemeralMessage") {
    if (msg && msg.message && msg.message.ephemeralMessage && msg.message.ephemeralMessage.message) {
      msg.message = msg.message.ephemeralMessage.message;
      if (msg.message.viewOnceMessage) {
        msg.message = msg.message.viewOnceMessage;
      }
    }
  }

  if (type === "viewOnceMessage") {
    if (msg && msg.message && msg.message.viewOnceMessage) {
      msg.message = msg.message.viewOnceMessage.message;
    }
  }

  const body = type === "imageMessage" || type === "videoMessage" ? msg.message[type].caption : type === "conversation" ? msg.message[type] : type === "extendedTextMessage" ? msg.message[type].text : "";
  let sender = isGroup ? msg.key.participant : msg.key.remoteJid;
  sender = sender.includes(":") ? sender.split(":")[0] + "@s.whatsapp.net" : sender;
  const senderNumber = sender.split("@")[0];
  const isCmd = /^[°•π÷×¶∆£¢€¥®™✓_=|~!?#$%^&.+-,\\\©^]/.test(body);
  const prefix = isCmd ? body[0] : "";
  let args = body.trim().split(" ").slice(1);
  let command = isCmd ? body.slice(1).trim().split(" ").shift().toLowerCase() : "";

  if (isCmd) console.log(color(">>", "green"), color(`${time}`, "yellow"), color(`${prefix + command} [${args.length}]`, "magenta"), color("from", "white"), color(senderNumber, "yellow"));

  const reply = (teks) => {
    wann.sendMessage(from, { text: teks }, { quoted: msg });
  };

  switch (command) {
    case "menu":
      let txt = `Ini menu\n`;
      txt += `\n`;
      txt += `Hello Word!`;
      wann.sendMessage(from, { text: txt }, { quoted: msg });
      break;
    default:
      if (body.startsWith(">")) {
        try {
          let value = await (async () => {
            return await eval(body.slice(1));
          })();
          await reply(format(value));
        } catch (e) {
          await reply(e.toString());
        }
      }

      if (body.startsWith("<")) {
        try {
          let value = await eval(`(async () => { return ${body.slice(1)} })()`);
          await reply(format(value));
        } catch (e) {
          await reply(e);
        }
      }
  }
};
