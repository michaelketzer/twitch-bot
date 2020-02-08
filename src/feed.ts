import moment from 'moment';

const admins: string[] = ['shokztv', 'griefcode'];

enum STATUS {
    NONE= 'none',
    STARTED= 'started',
    RUNNING= 'running',
    FINISHED= 'finished',
}

const COMMANDS = {
    START: '!votefeed',
    FEED: '!feed',
    NOFEED: '!keinfeed'
};

const runTime: number = 30000;

let finishDate: number | null = null;
let status = STATUS.NONE;
let feedVotes = new Set<string>([]);
let noFeedVotes = new Set<string>();
let voters = new Set<string>([]);

function startFeedVoting(populateWebsocketMessage: (data: any) => void, populateToChat:  (data: string) => void) {
    status = STATUS.STARTED;
    feedVotes.clear();
    noFeedVotes.clear();
    voters.clear();
    finishDate = moment().unix() + (runTime / 1000);
    updateVote(populateWebsocketMessage);
    populateToChat(`Hat shokzTV gefeeded? Was meinst du? Benutze "${COMMANDS.FEED}" oder "${COMMANDS.NOFEED}"`);

    setTimeout(() => {
        status = STATUS.FINISHED;
        finishDate = null;
        populateToChat('Das Ergebnis steht fest! shokzTV hat ' + (feedVotes.size > noFeedVotes.size ? 'gefeedet.' : 'nicht gefeedet.'));
        updateVote(populateWebsocketMessage);

        setTimeout(() => {
            status = STATUS.NONE;
            updateVote(populateWebsocketMessage);
        }, 5000);
    }, runTime);
}

export function handleFeedVoteMessage(username: string, message: string, populateToChat: (data: string) => void, populateWebsocketMessage: (data: any) => void): void {
    if (admins.includes(username) && message === COMMANDS.START && status === STATUS.NONE) {
        startFeedVoting(populateWebsocketMessage, populateToChat);
    } else if (status === STATUS.STARTED && (message.toLowerCase().startsWith(COMMANDS.FEED) || message.toLowerCase().startsWith(COMMANDS.NOFEED)) && !voters.has(username)) {
        const votedForFeed = message.toLowerCase().startsWith(COMMANDS.FEED);
        votedForFeed ? feedVotes.add(username) : noFeedVotes.add(username);
        voters.add(username);
        updateVote(populateWebsocketMessage);
    }
}

function updateVote(populateWebsocketMessage: (data: any) => void): void {
    populateWebsocketMessage({
        type: 'feedvoting',
        data: {
            finishDate,
            status,
            subType: 'update',
            feedVotes: [...feedVotes],
            noFeedVotes: [...noFeedVotes],
            voters: [...voters],
        }
    });
}

export function handleFeedVoteMessageFromWS(type: string, props: any, populateWebsocketMessage: (data: any) => void, populateToChat: (data: string) => void): void {
    try {
        if(type === 'feedvoting' && props.message === 'init') {
            populateWebsocketMessage({
                type: 'feedvoting',
                data: {
                    finishDate,
                    status,
                    subType: 'init',
                    feedVotes: [...feedVotes],
                    noFeedVotes: [...noFeedVotes],
                    voters: [...voters],
                }
            });
        } else if(props.message === 'startfromgsi') {
            startFeedVoting(populateWebsocketMessage, populateToChat)
        }
    } catch(error) {
        throw new Error(error);
    }
}