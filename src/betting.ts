import {patch, post, get} from "./api";
import moment from 'moment';

interface ToplistEntry {
    rank: number;
    name: string;
    won: number;
    total: number;
    winPercentage: number;
}
const admins: string[] = ['shokztv', 'griefcode'];

enum STATUS {
    NONE= 'none',
    STARTED= 'started',
    RUNNING= 'running',
    FINISHED= 'finished',
}

const COMMANDS = {
    START: '!startbet',
    WINNER: '!winner',
    BET: '!bet',
    BET_STATS: '!betstats',
    TOP: '!top',
    BET_COMMANDS: '!betcommands'
};

const runTime: number = 90000;

let finishDate: number | null = null;
let status = STATUS.NONE;
let aBets = new Set<string>([]);
let bBets = new Set<string>();
let betters = new Set<string>([]);

export async function handleBetMessages(username: string, message: string, populateToChat: (data: string) => void, populateWebsocketMessage: (data: any) => void): Promise<void> {
    if (admins.includes(username) && message === COMMANDS.START && (status === STATUS.NONE || status === STATUS.FINISHED)) {
        status = STATUS.STARTED;
        post('/bet/createRound');
        finishDate = moment().unix() + (runTime / 1000);
        populateToChat(`Wetten wurden gestartet. Mit '${COMMANDS.BET} a' oder '${COMMANDS.BET} b' kannst du für dein favorisiertes Team abstimmen!`);
        updateBet(populateWebsocketMessage);

        setTimeout(() => {
            status = STATUS.RUNNING;
            finishDate = null;
            patch('/bet/updateRound', {status: STATUS.RUNNING});
            populateToChat('Wetten sind geschlossen!');
            updateBet(populateWebsocketMessage);
        }, runTime);
    } else if (admins.includes(username) && message.startsWith(COMMANDS.WINNER) && status === STATUS.RUNNING) {
        const winner = message.slice(-1).toLowerCase();
        setWinner(winner, populateToChat, populateWebsocketMessage);
    } else if (status === STATUS.STARTED && message.toLowerCase().startsWith(COMMANDS.BET) && !betters.has(username)) {
        const vote = message.slice(-1).toLowerCase();
        if(vote === 'a' || vote === 'b' ) {
            vote === 'a' ? aBets.add(username) : bBets.add(username);
            betters.add(username);
            post('/bet/register', {username, vote});
            updateBet(populateWebsocketMessage);
        }
    } else if(message.toLocaleLowerCase().startsWith(COMMANDS.BET_STATS)) {
        const payload = message.substr(COMMANDS.BET_STATS.length + 1);
        const name = payload.startsWith('@') ? payload.substr(1) : payload;
        //@ts-ignore
        const {wins = 0, rounds = 0} = await get(`/userstats/${name.length ? name : username}`);
        if(rounds !== 0) {
            const perc = Math.floor(wins * 100 / rounds);
            if(name && name !== username) {
                populateToChat(`@${username}, ${name} hat ${wins} Wetten aus ${rounds} Runden richtig. Das sind ${perc}%.`);
            } else {
                populateToChat(`@${username}, du hast ${wins} Wetten aus ${rounds} Runden richtig. Das sind ${perc}%.`);
            }
        } else {
            if(name && name !== username) {
                populateToChat(`@${username}, ${name} hat noch keine Wetten mitgemacht!`);
            } else {
                populateToChat(`@${username}, du hast noch keine Wetten mitgemacht!`);
            }
        }
    } else if(message.toLocaleLowerCase() === COMMANDS.BET_COMMANDS) {
        populateToChat(`Die Bet-Commands sind ${COMMANDS.BET_STATS} und ${COMMANDS.TOP}. Abstimmen kannst du mit '${COMMANDS.BET} a' oder '${COMMANDS.BET} b'`);
    } else if(message.toLocaleLowerCase() === COMMANDS.TOP) {
        const toplist = (await get(`/toplist`)) as unknown as ToplistEntry[];
        if(toplist.length) {
            const str = toplist.slice(0, 5).map(({rank, name, total, won}) => `${rank}.${name} (${won}/${total})`).join(', ');
            populateToChat(`Aktuelle Topliste: ${str}`);
        }
    }
}

function setWinner(winner: string, populateToChat: (data: string) => void, populateWebsocketMessage: (data: any) => void): void {
    aBets.clear();
    bBets.clear();
    betters.clear();
    status = STATUS.FINISHED;
    patch('/bet/updateRound', {status: STATUS.FINISHED, winner});
    populateToChat(`Der Gewinner wurde auf '${winner}' gesetzt.`);
    updateBet(populateWebsocketMessage);
}

function updateBet(populateWebsocketMessage: (data: any) => void): void {
    populateWebsocketMessage({
        type: 'betting',
        data: {
            finishDate,
            status,
            subType: 'update',
            aBets: [...aBets],
            bBets: [...bBets],
            betters: [...betters],
        }
    });
}


export function handleBetMessageFromWS(type: string, props: any, populateWebsocketMessage: (data: any) => void, populateToChat: (data: string) => void): void {
    try {
        if(type === 'betting' && props.message === 'init') {
            populateWebsocketMessage({
                type: 'betting',
                data: {
                    finishDate,
                    status,
                    subType: 'init',
                    aBets: [...aBets],
                    bBets: [...bBets],
                    betters: [...betters],
                }
            });
        } else if(type === 'betting' && props.message === 'winnerfromcgsi' && status === STATUS.RUNNING) {
            console.log('received winner from cgsi', props.winner);
            setWinner(props.winner, populateToChat, populateWebsocketMessage);
        }
    } catch(error) {
        throw new Error(error);
    }
}