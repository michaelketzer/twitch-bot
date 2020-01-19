const timeouts = [60, 120, 300];
interface Fight {
    id: string;
    fighter1: string;
    fighter1mod: boolean;
    fighter2: string;
    fighter2mod: boolean;
}

const COMMANDS = {
    FIGHT: 'shokzFight',
    DENY: '!deny'
};

let fights: Fight[] = [];

export function handleShokzFightMessage(username: string, message: string, isMod: boolean, populateToChat: (data: string) => void): void {
    if (message.startsWith(COMMANDS.FIGHT) || message.toLowerCase().startsWith(COMMANDS.DENY)) {
        const payload = message.substr(COMMANDS.FIGHT.length + 1);
        const fight = fights.find(({fighter1}) => fighter1 === username);
        if(fight && payload.length) {
            populateToChat(`${username} du kämpfst schon gegen ${fight.fighter2}!`);
            return;
        }

        const proposed = fights.find(({fighter2}) => fighter2.toLowerCase() === username.toLowerCase());
        if(proposed && message === COMMANDS.FIGHT) {
            proposed.fighter2mod = isMod;
            startFight(proposed, populateToChat);
            return;
        }

        if(proposed && message.startsWith(COMMANDS.FIGHT) && payload.startsWith('@')) {
            const enemy =  payload.substr(1);
            if(enemy.toLowerCase() === proposed.fighter1.toLowerCase()) {
                proposed.fighter2mod = isMod;
                startFight(proposed, populateToChat);
                return;
            }
        }

        if(proposed && message.toLowerCase().startsWith(COMMANDS.DENY)) {
            populateToChat(`PepeLaugh ${username} möchte nicht gegen ${proposed.fighter1} kämpfen PepeLaugh`);
            fights = fights.filter(({id}) => proposed.id !== id);
            return;
        }

        if(payload.startsWith('@') && payload.length && payload.indexOf(' ') === -1) {
            const enemy =  payload.substr(1);
            populateToChat(`shokzFight shokzFight ${username} fordert ${enemy} heraus. Akzeptiere den Kampf mit '${COMMANDS.FIGHT}' oder lehne ab mit '${COMMANDS.DENY}' shokzFight shokzFight`);
            const newFight = {
                id: Math.random().toString(36).substring(7),
                fighter1: username,
                fighter2: enemy.toLowerCase(),
                fighter1mod: isMod,
                fighter2mod: false,
            };
            fights.push(newFight);
            expireFight(newFight, populateToChat);
            return;
        }
    }
}

function expireFight(fight: Fight, populateToChat: (data: string) => void) {
    setTimeout(() => {
        const expired = fights.find(({id}) => id === fight.id);
        if(expired) {
            populateToChat(`FeelsBadMan ${expired.fighter2} hat nicht geantwortet. Es kommt nicht zum Kampf mit ${expired.fighter1} FeelsBadMan`);
            fights = fights.filter(({id}) => expired.id !== id);
        }
    }, 90000);
}

function startFight(fight: Fight, populateToChat: (data: string) => void): void {
    const timeoutTime = timeouts[Math.floor((Math.random() * 3))];
    let rand = Math.random() * 100;
    let winner = rand > 60 ? 2 : (rand < 40 ? 1 : 0);
    if(fight.fighter2mod) {
        winner = 2;
    } else if(fight.fighter1mod) {
        winner = 1;
    }

    if(winner === 1) {
        populateToChat(`Der Kampf wurde entschieden für ${fight.fighter1} PogChamp PepeLaugh Damit bekommt @${fight.fighter2} einen Timeout von ${timeoutTime} Sekunden PepeLaugh OMEGALUTSCH`);
        populateToChat(`/timeout @${fight.fighter2} ${timeoutTime}`);
    } else if(winner === 2) {
        populateToChat(`Der Kampf wurde entschieden für ${fight.fighter2} PogChamp PepeLaugh Damit bekommt @${fight.fighter1} einen Timeout von ${timeoutTime} Sekunden PepeLaugh OMEGALUTSCH`);
        populateToChat(`/timeout @${fight.fighter1} ${timeoutTime}`);
    } else if(winner === 0 &&  rand > 50 ) {
        populateToChat(`PepeLaugh PepeLaugh Es haben sich @${fight.fighter1} und @${fight.fighter2} gleichzeitig KO gehauen PepeLaugh Damit bekommen beide einen Timeout von ${timeoutTime} Sekunden PepeLaugh PepeLaugh`);
        populateToChat(`/timeout @${fight.fighter1} ${timeoutTime}`);
        populateToChat(`/timeout @${fight.fighter2} ${timeoutTime}`);
    } else if(winner === 0 ) {
        populateToChat(`@${fight.fighter1} und @${fight.fighter2} sind beides die letzten Pepega. Keiner von beiden hat den anderen getroffen! Keiner bekommt einen Timeout SwiftLove`);
    }
    fights = fights.filter(({id}) => fight.id !== id);
}
