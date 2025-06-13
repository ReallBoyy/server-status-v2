import { exec } from 'child_process';
import { WebhookClient, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import config from './db/config.js';
import si from 'systeminformation';
import os from 'os';

const WEBHOOK_URL = config.webhook_url;

const listColor = ['#5865F2', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FFA500', '#800080', '#FFC0CB', '#00FFFF', '#FFFFFF', '#000000', '#808080', '#D3D3D3', '#2C2F33', '#FFD700', '#1ABC9C', '#11806A', '#ADD8E6', '#008080', '#000080'];

const [webhook_id, webhook_token] = WEBHOOK_URL.split('/').slice(-2);

const hook = new WebhookClient({ id: webhook_id, token: webhook_token });

let lastMessageId = null;

async function checkProcess(processName) {
    return new Promise((resolve, reject) => {
        exec('tasklist', (err, stdout, stderr) => {
            if (err || stderr) return reject(err || stderr);

            const lines = stdout.toLowerCase().split('\n');
            const found = lines.some(line => line.trim().startsWith(processName.toLowerCase()));
            resolve(found);
        });
    });
}


async function updateDiscordStatus(isRunning) {
    const TMem = os.totalmem();
    const FMem = os.freemem();
    const usedMem = TMem - FMem;

    const cpuUsed = await si.currentLoad();
    const cpuPercent = Math.floor(cpuUsed.currentLoad);

    const players = fs.readdirSync(config.db_players).filter(file => path.extname(file).toLowerCase() === '.json');
    const worlds = fs.readdirSync(config.db_worlds).filter(file => path.extname(file).toLowerCase() === '.json');
    const guilds = fs.readdirSync(config.db_guilds).filter(file => path.extname(file).toLowerCase() === '.json');

    const embed = new EmbedBuilder()
        .setAuthor(
            {
                name: 'Contact Owner',
                iconURL: 'https://ar-hosting.pages.dev/1749415055883.png',
                url: 'https://t.me/reallboyy2_4'

            })
        .setColor(listColor[Math.floor(Math.random() * listColor.length)])
        .setDescription(' **Server Statistics** :bar_chart: \n\n\n')
        .addFields(
            {
                name: ':desktop: CPU Usage',
                value: `${cpuPercent}%/100%`,
                inline: true
            },
            {
                name: ':floppy_disk: RAM Usage',
                value: `${Math.round((usedMem / TMem) * 100)}% / 100%`,
                inline: true
            },
            {
                name: ':computer: Status',
                value: isRunning ? ':green_circle: Online' : ':red_circle: Offline',
                inline: true
            },
            {
                name: ':globe_with_meridians: Worlds',
                value: `${worlds.length}`,
                inline: true
            },
            {
                name: ':bust_in_silhouette: Players',
                value: `${players.length}`,
                inline: true
            },
            {
                name: ':shield: Guilds',
                value: `${guilds.length}`,
                inline: true
            })
        .setTimestamp();

    try {
        if (!lastMessageId) {
            const sentMessage = await hook.send({ embeds: [embed] });
            lastMessageId = sentMessage.id;
        }
        else {
            await hook.editMessage(lastMessageId, { embeds: [embed] });
        }
    }
    catch (error) {
        console.error('Error updating Discord webhook:', error);
    }
}

async function Run() {
    try {
        const isRunning = await checkProcess(config.enet_server_name);
        await updateDiscordStatus(isRunning);
    }
    catch (error) {
        console.error('Error checking process:', error);
    }
}

Run();
console.log("Server Status is running . . .\nDo not close the program!")
setInterval(Run, config.delayMS);
