//@ts-ignore
import TwitchBot from 'twitch-bot';
import * as Sentry from '@sentry/node';
import WebSocket from 'ws';
import dotenv from 'dotenv';
dotenv.config();
import {handleFeedVoteMessage, handleFeedVoteMessageFromWS} from "./feed";
import {handleShokzFightMessage} from "./shokzFight";
import {saveSubscription, saveChatMessage} from "./api";
import {handleBetMessageFromWS, handleBetMessages} from "./betting";
import { handleCustomCommand } from './customCommands';
const {WS_URI='', TWITCH_USER='', TWITCH_OAUTH='', SENTRY_DSN=null} = process.env;

if(SENTRY_DSN) {
    Sentry.init({ dsn: SENTRY_DSN });
}

const Bot = new TwitchBot({
    username: TWITCH_USER,
    oauth: TWITCH_OAUTH,
    channels: ['shokztv', 'griefcode']
});

let ws: null | WebSocket = null;
const connect = (): void => {
    ws = new WebSocket(WS_URI);
    ws.on('open', function () {
        console.log('Backend connection established');
    });
    ws.on('error', function () {
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
                Bot.say(props.message);
            }
        } catch (error) {
        }
    });
};

connect();

Bot.on('error', (err: string): void => console.error(err));

interface ChatMessage {
    username: string;
    badge_info: string;
    badges?: {
        broadcaster: boolean;
        moderator: boolean;
        subscriber: number;
        'sub-gifter': number;
    };
    color: string;
    display_name: string;
    emotes: null | string;
    flags: null | string;
    id: string;
    mod: boolean;
    room_id: number;
    subscriber: boolean;
    tmi_sent_ts: number;
    turbo: boolean;
    user_id: number;
    user_type: 'mod' | 'staff';
    channel: string;
    message: string;
}

Bot.on('message', (chatter: ChatMessage): void => {
    const data = {username: chatter.username, message: chatter.message};

    if (ws && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({data, type: 'message'}));
    }

    saveChatMessage(chatter.username, chatter.message);
    handleBetMessages(chatter.username, chatter.message, populateToChat, populateWebsocketMessage);
    handleFeedVoteMessage(chatter.username, chatter.message, populateToChat, populateWebsocketMessage);
    const isMod = chatter.mod || (chatter.badges ? chatter.badges.broadcaster : false);
    handleShokzFightMessage(chatter.display_name, chatter.message, isMod, populateToChat);
    handleCustomCommand(chatter.display_name, chatter.message, populateToChat);
});

interface SubEvent {
    "badges": {
        "broadcaster": number;
        "staff": number;
        "turbo": number;
    };
    "channel": string;
    "color": string;
    "display_name": string;
    "emotes": null | string;
    "id": string;
    "login": string;
    "message": string | null;
    "mod": boolean;
    "msg_id": string;
    "msg_param_months": number;
    "msg_param_sub_plan": "Prime",
    "msg_param_sub_plan_name": "Prime",
    "room_id": number;
    "subscriber": number;
    "system_msg": string;
    "tmi_sent_ts": string;
    "turbo": boolean;
    "user_id": number;
    "user_type": string;
}

Bot.on('subscription', (event: SubEvent): void => {
    const data = {
        username: event.login,
        message: event.message,
        months: event.msg_param_months,
        subPlan: event.msg_param_sub_plan,
        subPlanName: event.msg_param_sub_plan_name
    };

    if (ws && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({data, type: 'subscription'}));
    }

    saveSubscription(data);
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
    Bot.say(message);
}