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
import BackendTransport from 'backend-transport';
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

interface InternalMessage {
    type: string;
    message: string;
}

const onMessage = (props: object) => {
    handleBetMessageFromWS((props as InternalMessage).type, props, populateWebsocketMessage, populateToChat);
    handleFeedVoteMessageFromWS((props as InternalMessage).type, props, populateWebsocketMessage, populateToChat);
    if ((props as InternalMessage).type === 'broadcast') {
        client.say('#shokztv', (props as InternalMessage).message);
    }
}

const ws = new BackendTransport({url: WS_URI, messageCallback: onMessage})
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
	if(self) return;
    const username = tags.username || tags["display-name"]?.toLocaleLowerCase();
    if(!username) return;

    ws.send(JSON.stringify({data: {message, username}, type: 'message'}));

    const mod = !!(!!tags.mod || (tags.badges && tags.badges.broadcaster === '1'));

    saveChatMessage(username, message);
    handleBetMessages(username, message, populateToChat, populateWebsocketMessage);
    handleFeedVoteMessage(username, message, populateToChat, populateWebsocketMessage);
    handleShokzFightMessage(username, message, mod, populateToChat);
    handleCustomCommand(username, message, populateToChat);
});

function populateWebsocketMessage(data: any): void {
    console.info('[populateWebsocketMessage]', JSON.stringify(data));
    ws.send(JSON.stringify(data));
}

function populateToChat(message: string): void {
    client.say('#shokztv', message);
}