
export function handleCustomCommand(username: string, message: string, populateToChat: (data: string) => void): void {
    const command = message.startsWith('!') && (message.indexOf(' ') !== -1 ? message.substr(0, message.indexOf(' ')) : message);

    if(command === '!timeout' || command === '!kekw') {
        const payload = message.substr(command.length);
        const timeout = isNaN(+payload) ? 300 : +payload;

        populateToChat(`/timeout ${username} ${timeout}`);
        return;
    }
}