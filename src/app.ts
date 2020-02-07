import {Client} from 'tmi.js';
import * as Sentry from '@sentry/node';
import WebSocket from 'ws';
import dotenv from 'dotenv';
dotenv.config();
import {handleFeedVoteMessage, handleFeedVoteMessageFromWS} from "./feed";
import {handleShokzFightMessage} from "./shokzFight";
import {saveChatMessage} from "./api";
import {handleBetMessageFromWS, handleBetMessages} from "./betting";
import { handleCustomCommand } from './customCommands';
const {WS_URI='', TWITCH_USER='', TWITCH_OAUTH='', SENTRY_DSN=null} = process.env;

const client = Client({
	options: { debug: true },
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username: TWITCH_USER,
		password: TWITCH_OAUTH,
	},
	channels: [ '#shokztv' ]
});
client.connect();

if(SENTRY_DSN) {
    Sentry.init({ dsn: SENTRY_DSN });
}


let ws: null | WebSocket = null;
const connect = (): void => {
    ws = new WebSocket(WS_URI);
    ws.on('open', function () {
        console.log('Backend connection established');
    });
    ws.on('error', function (error) {

        console.log(error);
        console.log('Backend connection error. Reconnecting...');
    });
    ws.on('close', function () {
        console.error('Backend connection closed. Trying reconnecting...');
        setTimeout(connect, 2500);
    });
    ws.on('message', (data: string): void => {
        try {
            const {type, ...props} = JSON.parse(data);
            handleBetMessageFromWS(type, data, populateWebsocketMessage, populateToChat);
            handleFeedVoteMessageFromWS(type, data, populateWebsocketMessage, populateToChat);
            if (type === 'broadcast') {
                client.say('#shokztv', props.message);
            }
        } catch (error) {
        }
    });
};

connect();

/**
{
  'badge-info': { subscriber: '21' },
  badges: { moderator: '1', subscriber: '18', 'bits-leader': '1' },
  color: '#00FF7F',
  'display-name': 'GriefCode',
  emotes: null,
  flags: null,
  id: '2abaa013-de0c-4a8e-af5c-e48f00128e90',
  mod: true,
  'room-id': '63202811',
  subscriber: true,
  'tmi-sent-ts': '1581105025599',
  turbo: false,
  'user-id': '103933973',
  'user-type': 'mod',
  'emotes-raw': null,
  'badge-info-raw': 'subscriber/21',
  'badges-raw': 'moderator/1,subscriber/18,bits-leader/1',
  username: 'griefcode',
  'message-type': 'chat'
}

{
  'badge-info': { subscriber: '32' },
  badges: { broadcaster: '1', subscriber: '30', 'sub-gifter': '25' },
  color: '#0000FF',
  'display-name': 'shokzTV',
  emotes: null,
  flags: null,
  id: 'add162b3-2678-41c1-80bb-9f39d9ff84f7',
  mod: false,
  'room-id': '63202811',
  subscriber: true,
  'tmi-sent-ts': '1581106293563',
  turbo: false,
  'user-id': '63202811',
  'user-type': null,
  'emotes-raw': null,
  'badge-info-raw': 'subscriber/32',
  'badges-raw': 'broadcaster/1,subscriber/30,sub-gifter/25',
  username: 'shokztv',
  'message-type': 'chat'
}
 */
client.on('message', (channel, tags, message, self) => {
    console.log(tags);
	if(self) return;
    const username = tags.username || tags["display-name"]?.toLocaleLowerCase();
    if(!username) return;

    if (ws && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({data: {message, username}, type: 'message'}));
    }

    const mod = !!(!!tags.mod || (tags.badges && tags.badges.broadcaster === '1'));

    saveChatMessage(username, message);
    handleBetMessages(username, message, populateToChat, populateWebsocketMessage);
    handleFeedVoteMessage(username, message, populateToChat, populateWebsocketMessage);
    handleShokzFightMessage(username, message, mod, populateToChat);
    handleCustomCommand(username, message, populateToChat);
});

function populateWebsocketMessage(data: any): void {
    if (ws && ws.readyState === ws.OPEN) {
        console.info('[populateWebsocketMessage]', JSON.stringify(data));
        ws.send(JSON.stringify(data));
    } else {
        console.error('Could not popuplate message, as ws is not in readyState', JSON.stringify(data));
    }
}

function populateToChat(message: string): void {
    client.say('#shokztv', message);
}