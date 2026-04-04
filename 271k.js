// Bot by Faro | xl | TG: @x81sq | Channel: @x1k4s
const DEFAULT_DELAY = 1000

const {
    generateWAMessageFromContent,
    getAggregateVotesInPollMessage,
    downloadContentFromMessage,
    encodeSignedDeviceIdentity,
    makeCacheableSignalKeyStore,
    prepareWAMessageMedia,
    downloadMediaMessage,
    useMultiFileAuthState,
    generateMessageIDV2,
    makeInMemoryStore,
    generateWAMessage,
    generateMessageID,
    encodeWAMessage,
    PHONENUMBER_MCC,
    DisconnectReason,
    getBusinessProfile,
    getContentType,
    makeWASocket,
    msgRetryCounterCache,
    areJidsSameUser,
    decryptPollVote,
    hmacSign,
    aesEncryptGCM,
    relayMessage,
    jidDecode,
    jidEncode,
    authState,
    Browsers,
    crypto_1,
    Utils_1,
    WABinary_1,
    WAProto_1,
    fetchLatestversion,
    WAProto,
    getDevice,
    proto,
} = require("@whiskeysockets/baileys")

const fs = require('fs')
const util = require('util')
const chalk = require('chalk')
const moment = require('moment-timezone')
const pino = require('pino')
const logger = pino({ level: 'debug' })
const crypto = require('crypto')
const path = require('path')
const os = require('os')
const timeRn = Math.floor(Date.now() / 1000)

// YouTube + FFmpeg
const ytdl = require('@distube/ytdl-core')
const { execFile, spawn } = require('child_process')
let ffmpegPath = 'ffmpeg';
try {
    if (os.platform() !== 'android') {
        ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
    }
} catch (e) {
    // If unsupported by installer (e.g. some ARM archs), fallback to system ffmpeg
}

// Media Processing
const webpLib = require('node-webpmux')
const ytDlp = require('yt-dlp-exec')

// === Global State for Rate Limiting & Queue ===
const globalQueue = [];
let isProcessingQueue = false;
const userCommands = new Map();
const bannedUsers = new Map();
const ytRequests = new Map();

async function processQueue() {
    if (isProcessingQueue) return;
    isProcessingQueue = true;
    while (globalQueue.length > 0) {
        const task = globalQueue.shift();
        // Drop stale entries older than 5 minutes
        if (Date.now() - task.timestamp > 5 * 60 * 1000) continue;
        try {
            await task.execute();
        } catch (e) {
            console.error("Queue task error:", e);
        }
    }
    isProcessingQueue = false;
}
// ============================================

// Removed wa-sticker-formatter to bypass sharp issues on Windows

module.exports = async (ss, m, chatUpdate, store) => {
    try {
        let x = {}
        x.id = m.key.id
        x.isBaileys = x.id.startsWith('BAE5') && x.id.length === 16
        x.chat = m.key.remoteJid
        x.fromMe = m.key.fromMe
        x.isGroup = x.chat.endsWith('@g.us')

        if ((m.key?.participant?.endsWith("@lid")) & (m.key?.participant === ss.user.lid)) {
            x.sender = ss.user.lid
        } else {
            x.sender = ss.decodeJid(x.fromMe && ss.user.id || x.participant || m.key.participant || x.chat || '')
        }

        if (x.isGroup) x.participant = ss.decodeJid(m.key.participant) || ''

        function getTypeM(message) {
            const type = Object.keys(message)
            var restype = (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(type[0]) && type[0]) || (type.length >= 3 && type[1] !== 'messageContextInfo' && type[1]) || type[type.length - 1] || Object.keys(message)[0]
            return restype
        }

        x.mtype = getTypeM(m.message)
        x.msg = (x.mtype == 'viewOnceMessage' ? m.message[x.mtype].message[getTypeM(m.message[x.mtype].message)] : m.message[x.mtype])
        x.text = x?.msg?.text || x?.msg?.caption || m?.message?.conversation || x?.msg?.contentText || x?.msg?.selectedDisplayText || x?.msg?.title || ''

        const info = {
            key: m.key,
            message: m.message,
        }

        const from = info.key.remoteJid

        var body = (x.mtype === 'interactiveResponseMessage')
            ? JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id
            : (x.mtype === 'conversation')
                ? m.message.conversation
                : (x.mtype === 'deviceSentMessage')
                    ? m.message.extendedTextMessage.text
                    : (x.mtype == 'imageMessage')
                        ? m.message.imageMessage.caption
                        : (x.mtype == 'videoMessage')
                            ? m.message.videoMessage.caption
                            : (x.mtype == 'extendedTextMessage')
                                ? m.message.extendedTextMessage.text
                                : (x.mtype == 'buttonsResponseMessage')
                                    ? m.message.buttonsResponseMessage.selectedButtonId
                                    : (x.mtype == 'listResponseMessage')
                                        ? m.message.listResponseMessage.singleSelectReply.selectedRowId
                                        : (x.mtype == 'templateButtonReplyMessage')
                                            ? m.message.templateButtonReplyMessage.selectedId
                                            : (x.mtype == 'messageContextInfo')
                                                ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || x.text)
                                                : ""

        const getGroupAdmins = (participants) => {
            let admins = []
            for (let i of participants) {
                i.admin === "superadmin" ? admins.push(i.id) : i.admin === "admin" ? admins.push(i.id) : ''
            }
            return admins || []
        }

        const sleep = async (ms) => {
            return new Promise(resolve => setTimeout(resolve, ms))
        }

        const quotedMsg = info?.message?.extendedTextMessage?.contextInfo?.quotedMessage || { "conversation": "no quoted" }
        var budy = (typeof x.text == 'string' ? x.text : '')

        var prefix = global.prefixx
            ? /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi.test(body)
                ? body.match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi)[0]
                : ""
            : global.prefixx ?? global.prefix

        const bardy = body || ''
        const isCmd = bardy.startsWith(prefix)
        const command = isCmd ? bardy.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
        const args = bardy.trim().split(/ +/).slice(1)
        const text = args.join(" ")
        const q = args.join(" ")
        const sender = info.key.fromMe ? (ss.user.id.split(':')[0] + '@s.whatsapp.net' || ss.user.id) : (info.key.participant || info.key.remoteJid)
        const botNumber = await ss.decodeJid(ss.user.id)
        const senderNumber = sender.split('@')[0]

        global.prefixx = [",", "", "."]

        const settingsPath = './SS/setting.js'
        const settings = require(settingsPath)

        const userList = settings.devNumbers && settings.devNumbers.length ? settings.devNumbers : ["201006741515@s.whatsapp.net"]
        const isCreator = userList.includes(sender)
        const pushname = m.pushName || `${senderNumber}`
        const isBot = info.key.fromMe ? true : false
        const groupMetadata = x.isGroup ? await ss.groupMetadata(from).catch(e => { }) : ''
        const groupName = x.isGroup ? groupMetadata?.subject : ''
        const participants = x.isGroup ? groupMetadata.participants : ''
        const groupAdmins = x.isGroup ? await getGroupAdmins(participants) : ''
        const isBotAdmins = x.isGroup ? groupAdmins.includes(botNumber) : false
        const isAdmins = x.isGroup ? groupAdmins.includes(m.sender) : false
        var deviceC = info.key.id.length > 21 ? 'Android' : info.key.id.substring(0, 2) == '3A' ? 'IPhone' : 'WhatsApp web'

        const messageType = Object.keys(info.message)[0]
        const mentionxs = info.message[messageType]?.contextInfo?.mentionedJid
        const server = ["@s.whatsapp.net", "@lid", "@broadcast", "@bot", "@g.us"]
        const aiJid = "13135550002" + server[0]
        const aiId = "867051314767696" + server[3]
        const meJid = ss.user.id.split(":")[0] + server[0]
        const meLid = ss.user.lid.split(":")[0] + server[1]
        const sJid = "status" + server[2]

        global.grplog = settings.grplog
        global.totallog = settings.totallog
        global.logColor = settings.logColor || "\x1b[31m"
        global.shapeColor = settings.shapeColor || "\x1b[31m"
        global.rootColor = settings.rootColor || "\x1b[31m"
        global.root = settings.root || "┏━━[ A. Painter 88 ]\n┗━<$>"
        global.hideNumber = settings.hideNumber || false

        const stickerAuthor = settings.stickerAuthor || "Faro"
        const stickerPack = settings.stickerPack || "xl"

        function updateSettings(settingKey, value) {
            const settings = require(settingsPath)
            settings[settingKey] = value
            fs.writeFileSync(settingsPath, `module.exports = ${JSON.stringify(settings, null, 2)};`, 'utf8')
            global[settingKey] = value
        }

        function log(messageLines, title) {
            const top = `\n${shapeColor}` + "╭" + "─".repeat(50) + "╮" + "\x1b[0m"
            const bottom = `${shapeColor}╰` + "─".repeat(50) + "╯" + "\x1b[0m"
            const emptyLine = `${shapeColor}│` + " ".repeat(50) + "│" + "\x1b[0m"

            console.log(top)

            if (title) {
                const strip = title.replace(/\\x1b\\ [0-9;]*[mGK]/g, '')
                const titleLine = `${shapeColor}│` + " " + `${logColor}` +
                    strip.padEnd(48) + " " + `${shapeColor}│`
                console.log(titleLine)
                console.log(emptyLine)
            }

            messageLines.forEach((line, i) => {
                if (line.startsWith("\x1b")) {
                    const strip = line.replace(/\\x1b\\ [0-9;]*[mGK]/g, '')
                    let formattedLine = `${shapeColor}│${logColor}` + ` ${i + 1} ` + `${strip.padEnd(51)}` + " " + `${shapeColor}│` + "\x1b[0m"
                    console.log(formattedLine)
                } else {
                    const strip = line.replace(/\\x1b\\ [0-9;]*[mGK]/g, '')
                    let formattedLine = `${shapeColor}│${logColor}` + ` ${i + 1} ` + `${strip.padEnd(46)}` + " " + `${shapeColor}│` + "\x1b[0m"
                    console.log(formattedLine)
                }
            })

            console.log(emptyLine)
            console.log(bottom + "\n\n")
        }

        const reply = (text) => {
            ss.sendMessage(
                from,
                { text: text, mentions: [sender] },
                { quoted: info }
            ).catch(e => { return })
        }

        async function getMessage(key) {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id)
                return msg
            }
            return { conversation: "fjews" }
        }

        function formatJSON(jsonString) {
            try {
                const jsonObject = JSON.parse(jsonString)
                return JSON.stringify(jsonObject, null, 4)
            } catch (error) {
                console.error(error)
                return jsonString
            }
        }

        function hidden(input) {
            if (hideNumber) {
                return "*************"
            } else {
                return input
            }
        }

        let date = new Date(info.messageTimestamp * 1000)
        let options = {
            timeZone: 'Europe/Berlin',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }

        let deTime = date.toLocaleString('de-DE', options)

        if (totallog) {
            if (m.message && x.isGroup) {
                if (!grplog) {
                } else {
                    const tOo = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
                    const title = 'Group Chat'
                    const INFOS = [
                        `[ MESSAGE ] ${tOo}`,
                        `=> Text: ${bardy}`,
                        `=> Name: ${hidden(pushname || "unknown")}`,
                        `=> From: ${hidden(sender)}`,
                        `=> In: ${groupName || info.chat}`,
                        `=> Device: ${deviceC}`,
                    ]
                    log(INFOS, title)
                }
            } else {
                const tOo = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
                const title = 'Private Chat'
                const INFOS = [
                    `[ MESSAGE ] ${tOo}`,
                    `=> Text: ${bardy}`,
                    `=> Name: ${hidden(pushname || "unknown")}`,
                    `=> From: ${hidden(sender)}`,
                    `=> Device: ${deviceC}`,
                ]
                log(INFOS, title)
            }
        }

        // ──────────────────────────────────────────────────
        //  HELPERS
        // ──────────────────────────────────────────────────

        /**
         * Download the quoted media message (image/video/audio) as a Buffer.
         */
        async function downloadQuoted() {
            const ctx = info.message?.extendedTextMessage?.contextInfo
            if (!ctx?.quotedMessage) return null
            const qMsg = ctx.quotedMessage
            const qType = Object.keys(qMsg)[0]
            const qObj = qMsg[qType]
            const stream = await downloadContentFromMessage(qObj, qType.replace('Message', ''))
            let buf = Buffer.from([])
            for await (const chunk of stream) buf = Buffer.concat([buf, chunk])
            return { buffer: buf, type: qType, msg: qObj }
        }

        // ---- EXIF Injector Helper ----
        async function writeExif(webpBuf, pack, author) {
            try {
                const img = new webpLib.Image();
                await img.load(webpBuf);
                const json = {
                    'sticker-pack-id': 'xl.bot.' + Date.now(),
                    'sticker-pack-name': pack || '',
                    'sticker-pack-publisher': author || '',
                    'emojis': ['🌸'],
                };
                const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
                const jsonBuf = Buffer.from(JSON.stringify(json), 'utf-8');
                const exif = Buffer.concat([exifAttr, jsonBuf]);
                exif.writeUIntLE(jsonBuf.length, 14, 4);
                img.exif = exif;
                return await img.save(null);
            } catch (ex) {
                console.error('EXIF inject failed:', ex.message);
                return webpBuf;
            }
        }

        // ---- Sticker core (spawn-based, no sharp/wa-sticker-formatter) ----
        async function bufferToWebp(buffer, isAnimated, inputExt) {
            if (!buffer || buffer.length === 0) throw new Error('Buffer is empty');
            const tmpIn = path.join(os.tmpdir(), `si_${Date.now()}${inputExt}`);
            const tmpOut = path.join(os.tmpdir(), `so_${Date.now()}.webp`);
            fs.writeFileSync(tmpIn, buffer);

            const vf = 'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1';
            const args = isAnimated
                ? ['-y', '-i', tmpIn, '-vcodec', 'libwebp', '-vf', vf, '-loop', '0', '-preset', 'default', '-an', '-vsync', '0', tmpOut]
                : ['-y', '-i', tmpIn, '-vcodec', 'libwebp', '-vf', vf, '-lossless', '0', '-compression_level', '6', tmpOut];

            await new Promise((resolve, reject) => {
                const proc = spawn(ffmpegPath, args);
                let errLog = '';
                proc.stderr.on('data', chunk => errLog += chunk.toString());
                proc.on('close', code => {
                    if (code === 0) resolve();
                    else reject(new Error(`ffmpeg exited ${code}\nLog: ${errLog}`));
                });
                proc.on('error', reject);
            });

            const webpBuf = fs.readFileSync(tmpOut);
            try { fs.unlinkSync(tmpIn); } catch (_) { }
            try { fs.unlinkSync(tmpOut); } catch (_) { }
            return webpBuf;
        }

        async function makeStaticSticker(buffer, author, pack, type) {
            if (type === 'stickerMessage') return await writeExif(buffer, pack, author);
            const ext = type === 'videoMessage' ? '.mp4' : (type === 'imageMessage' ? '.jpg' : '.webp');
            return await writeExif(await bufferToWebp(buffer, false, ext), pack, author);
        }

        async function makeAnimatedSticker(buffer, author, pack, type) {
            if (type === 'stickerMessage') return await writeExif(buffer, pack, author);
            const ext = type === 'videoMessage' ? '.mp4' : (type === 'imageMessage' ? '.jpg' : '.webp');
            return await writeExif(await bufferToWebp(buffer, true, ext), pack, author);
        }

        async function downloadYTAudio(url) {
            const tmpFile = path.join(os.tmpdir(), `yt_audio_${Date.now()}.mp3`);
            await ytDlp(url, {
                extractAudio: true,
                audioFormat: 'mp3',
                output: tmpFile,
            });
            return tmpFile;
        }

        async function downloadYTVideo(url) {
            const tmpFile = path.join(os.tmpdir(), `yt_vid_${Date.now()}.mp4`);
            await ytDlp(url, {
                format: 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]',
                mergeOutputFormat: 'mp4',
                output: tmpFile,
            });
            return tmpFile;
        }

        // ──────────────────────────────────────────────────
        //  COMMAND QUEUE & SWITCH
        // ──────────────────────────────────────────────────

        if (command) {
            const now = Date.now();
            if (bannedUsers.has(sender)) {
                if (now < bannedUsers.get(sender)) return; // Silently ignore
                bannedUsers.delete(sender);
            }
            // Private mode: only creator can use bot
            if (settings.privateMode && !isCreator && !isBot) return;

            if (!isCreator && !isBot && botNumber !== senderNumber) {
                let history = userCommands.get(sender) || [];
                history = history.filter(t => now - t < 15000); // 15s window
                history.push(now);
                userCommands.set(sender, history);
                if (history.length >= 3) {
                    bannedUsers.set(sender, now + 10 * 60 * 1000); // 10m ban
                    return; // Silently ignore this and future ones
                }
            }

            globalQueue.push({
                timestamp: now,
                execute: async () => {
                    await executeCommand(command);
                }
            });
            processQueue();
        }

        async function executeCommand(command) {
            switch (command) {

                // ── Anti View-Once ─────────────────────────────
                case "aonc": {
                    // if (!isBot) return reply("no bot")
                    let ahoi = info?.message?.extendedTextMessage?.contextInfo?.quotedMessage
                    if (!ahoi) return reply("reply to a view once message")
                    if (ahoi?.videoMessage?.viewOnce) ahoi.videoMessage.viewOnce = false
                    if (ahoi?.imageMessage?.viewOnce) ahoi.imageMessage.viewOnce = false
                    if (ahoi?.audioMessage?.viewOnce) ahoi.audioMessage.viewOnce = false
                    ss.relayMessage(from, ahoi, {})
                } break

                // ── Main Poll Menu ──────────────────────────────
                case "menu": {
                    ss.pollMenu(from, `Main Menu`, [
                        { vote: "My Info",           cmd: `myinfo` },
                        { vote: "Chat ID",           cmd: `from`   },
                        { vote: "Anti View-Once",    cmd: `aonc`   },
                        { vote: "Stickers",       cmd: `menu3`  },
                        { vote: "YouTube",        cmd: `menu4`  },
                        { vote: "Full Menu (List)",  cmd: `menu2`  },
                    ], {
                        "remoteJid": "status@broadcast",
                        "participant": aiJid,
                    })
                } break

                // ── Sticker Poll Sub-Menu (.menu3) ─────────────
                case "menu3": {
                    ss.pollMenu(from, `Stickers`, [
                        { vote: "Image/Video to Sticker",    cmd: `s`    },
                        { vote: "Video to Animated Sticker",  cmd: `ms`   },
                        { vote: "Sticker to Image",           cmd: `ti`   },
                        { vote: "Animated Sticker to Video",  cmd: `tv`   },
                        { vote: "Back to Menu",            cmd: `menu` },
                    ], {
                        "remoteJid": "status@broadcast",
                        "participant": aiJid,
                    })
                } break

                // ── YouTube Poll Sub-Menu (.menu4) ─────────────
                case "menu4": {
                    ss.pollMenu(from, `YouTube`, [
                        { vote: "Search & Download",   cmd: `yt`     },
                        { vote: "Audio (URL)",          cmd: `ytplay` },
                        { vote: "Video (URL)",          cmd: `ytvid`  },
                        { vote: "Back to Menu",       cmd: `menu`   },
                    ], {
                        "remoteJid": "status@broadcast",
                        "participant": aiJid,
                    })
                } break

                // ── Full List Menu (.menu2) ───────────────────
                case "menu2": {
                    ss.sendjson(from, {
                        "viewOnceMessage": {
                            "message": {
                                "interactiveMessage": {
                                    "body": { "text": "xl Bot - Full Command List" },
                                    "footer": { "text": "Select any command to run" },
                                    "header": { "title": "Commands", "hasMediaAttachment": false },
                                    "nativeFlowMessage": {
                                        "buttons": [{
                                            "name": "single_select",
                                            "buttonParamsJson": JSON.stringify({
                                                "title": "Choose",
                                                "sections": [
                                                    {
                                                        "title": "General",
                                                        "rows": [
                                                            { "title": "My Info",       "description": "Developer & bot info",      "id": "myinfo"  },
                                                            { "title": "My JID",        "description": "Your WhatsApp JID",         "id": "me"      },
                                                            { "title": "Chat ID",       "description": "This chat JID",             "id": "from"    },
                                                            { "title": "Ping",          "description": "Bot response speed",        "id": "ping"    },
                                                            { "title": "Anti Once",     "description": "Reply to a view-once msg",  "id": "aonc"    },
                                                            { "title": "Refresh",       "description": "Clear stuck session files",  "id": "refresh" },
                                                        ]
                                                    },
                                                    {
                                                        "title": "Stickers",
                                                        "rows": [
                                                            { "title": ".s",  "description": "Image/video -> static sticker",   "id": "s"  },
                                                            { "title": ".ms", "description": "Video -> animated sticker (5s)",  "id": "ms" },
                                                            { "title": ".ti", "description": "Sticker -> image",                 "id": "ti" },
                                                            { "title": ".tv", "description": "Animated sticker -> video",         "id": "tv" },
                                                        ]
                                                    },
                                                    {
                                                        "title": "YouTube",
                                                        "rows": [
                                                            { "title": ".yt [name/url]", "description": "Search & select quality", "id": "yt"     },
                                                            { "title": "ytplay [url]",   "description": "Direct audio download",   "id": "ytplay" },
                                                            { "title": "ytvid [url]",    "description": "Direct video download",   "id": "ytvid"  },
                                                        ]
                                                    },
                                                ]
                                            })
                                        }],
                                        "messageParamsJson": ""
                                    }
                                }
                            }
                        }
                    }, { quoted: info });
                } break

                // ── Private Mode (.pr) — dev only ────────────────
                case "pr": {
                    if (!isCreator) return;
                    updateSettings('privateMode', true);
                    reply('Bot is now in private mode (dev only).');
                } break

                // ── Public Mode (.pu) — dev only ─────────────────
                case "pu": {
                    if (!isCreator) return;
                    updateSettings('privateMode', false);
                    reply('Bot is now in public mode.');
                } break

                // ── My JID ─────────────────────────────────────
                case "me": {
                    // if (!isBot) return
                    reply(meJid)
                } break

                // ── Chat JID ────────────────────────────────────
                case "from": {
                    // if (!isBot) return
                    reply(from)
                } break

                // ── Ping ────────────────────────────────────────
                case "ping": {
                    const speed = require("performance-now")
                    const timestamp = speed()
                    const latens = speed() - timestamp
                    reply(`*${latens.toFixed(4)}ms*`)
                } break

                // ── Refresh ─────────────────────────────────────
                case "refresh": {
                    function cleanFolder(folderPath, excludeFile) {
                        fs.readdir(folderPath, (_, files) => {
                            files.forEach(file => {
                                if (file !== excludeFile) {
                                    fs.unlink(path.join(folderPath, file), () => { })
                                }
                            })
                        })
                    }
                    cleanFolder("./SS/gaskammer", "creds.json")
                } break

                // ── Restart ─────────────────────────────────────
                case "restart": {
                    reply("restarting...")
                    process.exit()
                } break

                // ── Hide & Forward (.hfd) ────────────────────────
                // Reply to any message → forwards it anonymously (no sender info)
                case "hfd": {
                    try {
                        const ctx = info.message?.extendedTextMessage?.contextInfo
                        if (!ctx?.quotedMessage) return reply("ردّ على رسالة\nReply to a message")

                        const qMsg = ctx.quotedMessage
                        const fakeKey = {
                            remoteJid: "status@broadcast",
                            participant: aiJid,
                            id: generateMessageIDV2(),
                            fromMe: false,
                        }

                        // wrap in extendedTextMessage context to hide original sender
                        await ss.sendMessage(from, {
                            forward: {
                                key: fakeKey,
                                message: qMsg,
                            }
                        }, { quoted: info })
                    } catch (e) {
                        console.error('[hfd]', e.message)
                        // fallback: just relay the quoted message directly
                        try {
                            const ctx = info.message?.extendedTextMessage?.contextInfo
                            const qMsg = ctx?.quotedMessage
                            if (qMsg) await ss.relayMessage(from, qMsg, {})
                        } catch (_) {}
                    }
                } break

                // ── Static Sticker (.s) ─────────────────────────
                // .s              → convert replied image to static sticker (author/pack from config)
                // .s <pack>|<author> → custom pack and author
                case "s": {
                    // if (!isBot) return
                    try {
                        const quoted = await downloadQuoted()
                        if (!quoted) return reply("ردّ على صورة او فيديو\nReply to an image or video")

                        let customPack = stickerPack;
                        let customAuthor = stickerAuthor;

                        if (q.trim()) {
                            const parts = q.split('|');
                            if (parts.length === 2) {
                                customPack = parts[0].trim();
                                customAuthor = parts[1].trim();
                            } else {
                                customPack = q.trim();
                                customAuthor = '';
                            }
                        }

                        let stickerBuf;
                        if (quoted.type === 'stickerMessage') {
                            // Re-send the sticker with changed author
                            stickerBuf = await makeStaticSticker(quoted.buffer, customAuthor, customPack, quoted.type)
                        } else {
                            stickerBuf = await makeStaticSticker(quoted.buffer, customAuthor, customPack, quoted.type)
                        }

                        await ss.sendMessage(from, { sticker: stickerBuf }, { quoted: info })
                    } catch (e) {
                        console.error(e)
                        reply("حدث خطأ اثناء انشاء الستيكر\nError creating sticker")
                    }
                } break

                // ── Animated Sticker (.ms) ──────────────────────
                // .ms             → convert replied gif/video to animated sticker (author/pack from config)
                // .ms <pack>|<author> → custom pack and author
                case "ms": {
                    try {
                        const quoted = await downloadQuoted()
                        if (!quoted) return reply('Reply to a gif or video')

                        let customPack = stickerPack;
                        let customAuthor = stickerAuthor;

                        if (q.trim()) {
                            const parts = q.split('|');
                            if (parts.length === 2) {
                                customPack = parts[0].trim();
                                customAuthor = parts[1].trim();
                            } else {
                                customPack = q.trim();
                                customAuthor = '';
                            }
                        }

                        const stickerBuf = await makeAnimatedSticker(quoted.buffer, customAuthor, customPack, quoted.type)
                        await ss.sendMessage(from, { sticker: stickerBuf }, { quoted: info })
                    } catch (e) {
                        console.error(e)
                        reply('Error creating animated sticker')
                    }
                } break

                // ── YouTube Audio ───────────────────────────────
                case "ytplay": {
                    if (!q) return reply("Send a YouTube URL. Example: ytplay https://youtu.be/...")
                    try {
                        reply("جاري التنزيل...\nDownloading...")
                        const isUrl = q.startsWith('http')
                        if (!isUrl) return reply("ارسل رابط يوتيوب صحيح\nSend a valid YouTube URL")

                        let info_yt;
                        try { info_yt = await ytDlp(q, { dumpJson: true }); } catch { return reply("لم يتم العثور على الفيديو\nVideo not found") }

                        const title = info_yt.title || "Audio";
                        const duration = info_yt?.duration || 0;
                        if (duration > 600) return reply("Video is longer than 10 minutes")

                        const tmpPath = await downloadYTAudio(q)
                        const audioBuf = fs.readFileSync(tmpPath)
                        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)

                        await ss.sendMessage(from, {
                            audio: audioBuf,
                            mimetype: 'audio/mp4',
                            ptt: false,
                        }, { quoted: info })
                    } catch (e) {
                        console.error(e)
                        reply("حدث خطأ اثناء التنزيل\nDownload error")
                    }
                } break

                // ── YouTube Video ───────────────────────────────
                case "ytvid": {
                    if (!q) return reply("Send a YouTube URL. Example: ytvid https://youtu.be/...")
                    try {
                        reply("جاري التنزيل...\nDownloading...")
                        const isUrl = q.startsWith('http')
                        if (!isUrl) return reply("ارسل رابط يوتيوب صحيح\nSend a valid YouTube URL")

                        let info_yt;
                        try { info_yt = await ytDlp(q, { dumpJson: true }); } catch { return reply("لم يتم العثور على الفيديو\nVideo not found") }

                        const duration = info_yt.duration || 0;
                        if (duration > 300) return reply("مدة الفيديو اطول من 5 دقائق\nVideo is longer than 5 minutes")

                        const tmpPath = await downloadYTVideo(q)
                        const videoBuf = fs.readFileSync(tmpPath)
                        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)

                        await ss.sendMessage(from, {
                            video: videoBuf,
                            mimetype: 'video/mp4',
                        }, { quoted: info })
                    } catch (e) {
                        console.error(e)
                        reply("حدث خطأ اثناء التنزيل\nDownload error")
                    }
                } break

                // ── Convert to Image (.ti) ───────────────────────
                case "ti": {
                    try {
                        const quoted = await downloadQuoted();
                        if (!quoted) return reply("Reply to a sticker to convert to image.");

                        try {
                            const sharp = require('sharp');
                            const imgBuf = await sharp(quoted.buffer).png().toBuffer();
                            await ss.sendMessage(from, { image: imgBuf }, { quoted: info });
                        } catch (err) {
                            console.error('[.ti fallback]', err.message);
                            // Fallback via node-webpmux frame extraction
                            const ts2 = Date.now();
                            const tmpOut2 = path.join(os.tmpdir(), `ti_out_${ts2}.png`);
                            const img2 = new webpLib.Image();
                            await webpLib.Image.initLib();
                            await img2.load(quoted.buffer);
                            // getFrameData returns raw RGBA bytes
                            const rawBuf2 = (img2.frames && img2.frames.length > 0) ? await img2.getFrameData(0) : null;
                            if (rawBuf2) {
                                const w2 = img2.width, h2 = img2.height;
                                try {
                                    const sharpFb = require('sharp');
                                    const imgBuf2 = await sharpFb(rawBuf2, {
                                        raw: { width: w2, height: h2, channels: 4 }
                                    }).png().toBuffer();
                                    await ss.sendMessage(from, { image: imgBuf2 }, { quoted: info });
                                } catch (e2) {
                                    // Last resort: ffmpeg rawvideo → png
                                    const frameRaw2 = path.join(os.tmpdir(), `ti_raw_${ts2}.rgba`);
                                    fs.writeFileSync(frameRaw2, rawBuf2);
                                    await new Promise((resolve, reject) => {
                                        const proc = spawn(ffmpegPath, ['-y', '-f', 'rawvideo', '-pixel_format', 'rgba', '-video_size', `${w2}x${h2}`, '-i', frameRaw2, tmpOut2]);
                                        proc.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg ti exited ${code}`)));
                                        proc.on('error', reject);
                                    });
                                    const imgBuf2 = fs.readFileSync(tmpOut2);
                                    await ss.sendMessage(from, { image: imgBuf2 }, { quoted: info });
                                    try { fs.unlinkSync(frameRaw2); } catch (_) {}
                                }
                            } else {
                                reply('Could not extract frame from this sticker.');
                            }
                            try { fs.unlinkSync(tmpOut2); } catch (_) {}
                        }
                    } catch (e) {
                        console.error('[.ti]', e.message);
                        reply("Error converting sticker to image.");
                    }
                } break

                // ── Convert to Video (.tv) ───────────────────────
                // Uses node-webpmux to extract frames + sharp for webp→png (ffmpeg can't decode animated webp)
                case "tv": {
                    const ts = Date.now();
                    const tmpOut = path.join(os.tmpdir(), `tv_out_${ts}.mp4`);
                    const frameDir = path.join(os.tmpdir(), `tv_frames_${ts}`);
                    try {
                        const quoted = await downloadQuoted();
                        if (!quoted) return reply('Reply to an animated sticker.');

                        fs.mkdirSync(frameDir, { recursive: true });

                        const img = new webpLib.Image();
                        await img.load(quoted.buffer);

                        if (!img.frames || img.frames.length === 0) {
                            return reply('This sticker has no animation frames.');
                        }

                        const fps = 1000 / ((img.frames[0]?.delay) || 40);
                        const pngFiles = [];

                        await webpLib.Image.initLib();

                        const frameW = img.width;
                        const frameH = img.height;

                        let sharpLib;
                        try { sharpLib = require('sharp'); } catch (_) { sharpLib = null; }

                        for (let i = 0; i < img.frames.length; i++) {
                            // getFrameData() returns raw RGBA pixel bytes, not a WebP file
                            const rawBuf = await img.getFrameData(i);
                            const framePng = path.join(frameDir, `frame_${String(i).padStart(5, '0')}.png`);

                            if (sharpLib) {
                                // Tell sharp the raw format: width × height × 4 channels (RGBA)
                                await sharpLib(rawBuf, {
                                    raw: { width: frameW, height: frameH, channels: 4 }
                                }).png().toFile(framePng);
                            } else {
                                // Fallback: save as raw RGBA and let ffmpeg convert
                                const frameRaw = path.join(frameDir, `frame_${String(i).padStart(5, '0')}.rgba`);
                                fs.writeFileSync(frameRaw, rawBuf);
                                await new Promise((resolve, reject) => {
                                    const proc = spawn(ffmpegPath, [
                                        '-y',
                                        '-f', 'rawvideo',
                                        '-pixel_format', 'rgba',
                                        '-video_size', `${frameW}x${frameH}`,
                                        '-i', frameRaw,
                                        framePng
                                    ]);
                                    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`frame ${i} png fail`)));
                                    proc.on('error', reject);
                                });
                                try { fs.unlinkSync(frameRaw); } catch (_) {}
                            }
                            pngFiles.push(framePng);
                        }

                        if (pngFiles.length === 0) return reply('Could not extract any frames.');

                        const seqPattern = path.join(frameDir, 'frame_%05d.png');
                        const safeFps = Math.round(Math.min(Math.max(fps, 5), 30));

                        await new Promise((resolve, reject) => {
                            const proc = spawn(ffmpegPath, [
                                '-y',
                                '-framerate', String(safeFps),
                                '-i', seqPattern,
                                '-vcodec', 'libx264',
                                '-pix_fmt', 'yuv420p',
                                '-crf', '24',
                                '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
                                tmpOut
                            ]);
                            let errLog = '';
                            proc.stderr.on('data', c => errLog += c.toString());
                            proc.on('close', code => code === 0 ? resolve() : reject(new Error(errLog.slice(-300))));
                            proc.on('error', reject);
                        });

                        const videoBuf = fs.readFileSync(tmpOut);
                        await ss.sendMessage(from, { video: videoBuf, mimetype: 'video/mp4' }, { quoted: info });

                    } catch (e) {
                        console.error('[.tv]', e.message);
                        reply('Error: ' + e.message.slice(0, 120));
                    } finally {
                        try { fs.rmSync(frameDir, { recursive: true, force: true }); } catch (_) {}
                        try { fs.unlinkSync(tmpOut); } catch (_) {}
                    }
                } break

                // ── YouTube Search + Download (.yt) ────────────
                case "yt": {
                    if (!q) return reply('Send a song name or YouTube URL');

                    try {
                        const searchMsg = await ss.sendMessage(from, { text: '[...] Searching: ' + q }, { quoted: info });

                        delete require.cache[require.resolve('./SS/ytdl.js')];
                        const { yt_search } = require('./SS/ytdl.js');
                        let videos = [];

                        const res = await yt_search(q);
                        const entries = res.slice(0, 8);
                        for (const v of entries) {
                            if (!v || !v.url) continue;
                            videos.push({
                                title: v.title || 'Unknown',
                                url: v.url,
                                duration: v.timestamp || v.duration || '?'
                            });
                        }

                        if (!videos || !videos.length) {
                            if (searchMsg?.key) ss.sendMessage(from, { text: 'No results found for: ' + q, edit: searchMsg.key });
                            return;
                        }

                        // Build flat rows inside ONE section
                        const listRows = [];
                        for (const v of videos) {
                            const dur = v.duration || '?';
                            const title = v.title.slice(0, 40);
                            const reqId = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
                            
                            ytRequests.set('a:' + reqId, v.url);
                            ytRequests.set('v360:' + reqId, v.url);
                            ytRequests.set('v480:' + reqId, v.url);
                            ytRequests.set('v720:' + reqId, v.url);
                            
                            listRows.push({ title: '[Audio] ' + title, description: dur + ' | mp3', id: '.yd_audio a:' + reqId });
                            listRows.push({ title: '[360p] ' + title, description: dur + ' | mp4', id: '.yd_video v360:' + reqId });
                            listRows.push({ title: '[480p] ' + title, description: dur + ' | mp4', id: '.yd_video v480:' + reqId });
                            listRows.push({ title: '[720p] ' + title, description: dur + ' | mp4 HD', id: '.yd_video v720:' + reqId });
                        }

                        // Update search message to show list is ready
                        if (searchMsg?.key) {
                            await ss.sendMessage(from, { text: 'Results for: ' + q + '\n(' + videos.length + ' videos found)', edit: searchMsg.key }).catch(() => {});
                        }

                        // Send native list select
                        ss.sendjson(from, {
                            "viewOnceMessage": {
                                "message": {
                                    "interactiveMessage": {
                                        "body": { "text": `Search: ${q}` },
                                        "footer": { "text": "xl Bot" },
                                        "header": { "title": "YouTube", "hasMediaAttachment": false },
                                        "nativeFlowMessage": {
                                            "buttons": [{
                                                "name": "single_select",
                                                "buttonParamsJson": JSON.stringify({
                                                    "title": "Select to download",
                                                    "sections": [{ "title": "Results", "rows": listRows }]
                                                })
                                            }],
                                            "messageParamsJson": ""
                                        }
                                    }
                                }
                            }
                        }, { quoted: info });


                    } catch (e) {
                        console.error(e);
                        reply('حدث خطأ أثناء البحث\nSearch error');
                    }
                } break

                case "yd_audio":
                case "yd_video": {
                    // q is the reqId stored in ytRequests (e.g. "a:abc123")
                    const reqKey = q.trim();
                    const url = ytRequests.get(reqKey);
                    if (!url) return reply("انتهت الجلسة، أعد إرسال الأمر .yt\nSession expired, resend .yt");
                    ytRequests.delete(reqKey);

                    const isAudio = command === "yd_audio";

                    try {
                        let quality = '360';
                        let finalUrl = url;
                        
                        if (reqKey.startsWith('v1080:')) quality = '1080';
                        else if (reqKey.startsWith('v720:')) quality = '720';
                        else if (reqKey.startsWith('v480:')) quality = '480';
                        else if (reqKey.startsWith('v360:')) quality = '360';
                        
                        reply(`جاري التنزيل بجودة ${quality}p...\nDownloading ${quality}p...`);
                        
                        delete require.cache[require.resolve('./SS/ytdl.js')];
                        const { SmartDownload } = require('./SS/ytdl.js');
                        
                        let result = await SmartDownload(url, isAudio ? 'audio' : 'video', quality);

                        if (!result || (!result.link && !result.stream)) throw new Error("All download APIs failed");

                        const mediaPayload = result.stream ? { stream: result.stream } : { url: result.link };

                        if (isAudio) {
                            await ss.sendMessage(from, { audio: mediaPayload, mimetype: 'audio/mpeg', ptt: false }, { quoted: info });
                        } else {
                            await ss.sendMessage(from, { video: mediaPayload, mimetype: 'video/mp4' }, { quoted: info });
                        }

                        // Cleanup only if it was a legacy file (unlikely now)
                        if (result.isFile && result.link && fs.existsSync(result.link)) {
                            fs.unlinkSync(result.link);
                        }
                    } catch (e) {
                        console.error('[.yt download]', e.message);
                        reply("فشل التنزيل يرجى المحاولة لاحقاً\nDownload failed, please try again later.");
                    }
                } break

                // ── Developer Info (.myinfo) — multi-format ──────
                case "myinfo": {
                    const _sPath = './SS/setting.js';
                    let devName = "A. Painter 88";
                    let github = "https://github.com/EyeQ-Root";
                    let contact = "+201006741515";
                    let devNumber = "201006741515";
                    try {
                        const _s = require(_sPath);
                        if (_s.devName) devName = _s.devName;
                        if (_s.github) github = _s.github;
                        if (_s.devContact) contact = _s.devContact;
                        if (_s.devNumbers?.[0]) devNumber = _s.devNumbers[0].replace('@s.whatsapp.net', '');
                    } catch (e) { }

                    const uptime = process.uptime();
                    const _h = Math.floor(uptime / 3600);
                    const _m = Math.floor((uptime % 3600) / 60);
                    const _sec = Math.floor(uptime % 60);
                    const uptimeText = `${_h}h ${_m}m ${_sec}s`;

                    // 1. vCard contact card
                    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${devName}\nORG:xl Bot\nTEL;type=CELL;type=VOICE;waid=${devNumber}:${contact}\nURL:${github}\nNOTE:Bot Developer\nEND:VCARD`;
                    await ss.sendMessage(from, {
                        contacts: {
                            displayName: devName,
                            contacts: [{ vcard }]
                        }
                    }, { quoted: info });

                    // 2. Buttons message — uptime + quick actions
                    ss.sendjson(from, {
                        "viewOnceMessage": {
                            "message": {
                                "buttonsMessage": {
                                    "text": `Developer: ${devName}\nUptime: ${uptimeText}\nGitHub: ${github}`,
                                    "contentText": "Quick Actions:",
                                    "buttons": [
                                        { "buttonId": "ping",    "buttonText": { "displayText": "Ping"    }, "type": 1 },
                                        { "buttonId": "from",    "buttonText": { "displayText": "Chat ID" }, "type": 1 },
                                        { "buttonId": "refresh", "buttonText": { "displayText": "Refresh" }, "type": 1 },
                                    ],
                                    "headerType": 1
                                }
                            }
                        }
                    }, {});

                    // 3. Poll — quick command picker
                    ss.pollMenu(from, `${devName} - xl Bot`, [
                        { vote: "Ping",       cmd: "ping"    },
                        { vote: "My Info",    cmd: "myinfo"  },
                        { vote: "Chat ID",    cmd: "from"    },
                        { vote: "Full Menu",  cmd: "menu2"   },
                    ], {
                        "remoteJid": "status@broadcast",
                        "participant": aiJid,
                    });

                    // 4. List menu
                    ss.sendjson(from, {
                        "viewOnceMessage": {
                            "message": {
                                "interactiveMessage": {
                                    "body": { "text": `${devName}  |  Uptime: ${uptimeText}` },
                                    "footer": { "text": github },
                                    "header": { "title": "Bot Status", "hasMediaAttachment": false },
                                    "nativeFlowMessage": {
                                        "buttons": [{
                                            "name": "single_select",
                                            "buttonParamsJson": JSON.stringify({
                                                "title": "Commands",
                                                "sections": [{
                                                    "title": "Quick Actions",
                                                    "rows": [
                                                        { "title": "Ping",      "description": "Check latency",      "id": "ping"    },
                                                        { "title": "Chat ID",   "description": "Get current JID",    "id": "from"    },
                                                        { "title": "My JID",    "description": "Your JID",           "id": "me"      },
                                                        { "title": "Refresh",   "description": "Fix stuck messages", "id": "refresh" },
                                                        { "title": "Full Menu", "description": "All commands",       "id": "menu2"   },
                                                    ]
                                                }]
                                            })
                                        }],
                                        "messageParamsJson": ""
                                    }
                                }
                            }
                        }
                    }, {});
                } break

                default:
            }

        } // End of executeCommand
    } catch (e) {
        console.log(util.format(e))
    }
}

// Hot reload is handled externally by fuckpalant1r.js — no self-watcher needed here.

