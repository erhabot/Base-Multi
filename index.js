"use strict";
const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore } = require("@adiwajshing/baileys");
const pino = require("pino");
const { exec } = require("child_process");

const messageHandler = require("./message/wann");

const start = async () => {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  const level = pino({ level: "silent" });

  const wann = makeWASocket({
    logger: level,
    printQRInTerminal: true,
    browser: ["Base-Multi", "Safari", "1.0.0"],
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, level),
    },
  });

  wann.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      if (lastDisconnect.error.output.statusCode !== 401) {
        start();
      } else {
        exec("rm -rf auth_info_baileys");
        console.error("Scan QR!", update);
        start();
      }
    } else if (connection === "open") {
      console.log("Connecting...", update);
    }
  });

  wann.ev.on("creds.update", saveCreds);

  wann.ev.on("messages.upsert", (m) => {
    if (!m.messages) return;
    messageHandler(wann, m);
  });
};

start();
