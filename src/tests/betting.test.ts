const mockGet = jest.fn();

jest.mock('./../api', () => ({
    post: jest.fn(),
    get: mockGet,
    patch: jest.fn(),
}))

import moment from 'moment';
import {handleBetMessageFromWS, handleBetMessages} from '../betting';

jest.useFakeTimers();

test('handleBetMessageFromWS - invalid json', () => {
    const wsCB = jest.fn();
    const chatCB = jest.fn();
    expect(() => handleBetMessageFromWS('anytype', {message: "test"}, wsCB, chatCB)).toThrow();
})
;

test('handleBetMessageFromWS - non betting type', () => {
    const wsCB = jest.fn();
    const chatCB = jest.fn();
    handleBetMessageFromWS('anytype', '{"message": "test"}', wsCB, chatCB);
    expect(wsCB).not.toHaveBeenCalled();
    expect(chatCB).not.toHaveBeenCalled();
})

test('handleBetMessageFromWS - init', () => {
    const wsCB = jest.fn();
    const chatCB = jest.fn();
    handleBetMessageFromWS('betting', '{"message": "init"}', wsCB, chatCB);
    expect(wsCB).toHaveBeenCalledWith({
        type: 'betting',
        data: {
            finishDate:  null,
            status: 'none',
            subType: 'init',
            aBets: [],
            bBets: [],
            betters: [],
        }
    });
    expect(chatCB).not.toHaveBeenCalled();
})

test('handleBetMessageFromWS - winnerfromcgsi', () => {
    const wsCB = jest.fn();
    const chatCB = jest.fn();
    handleBetMessageFromWS('betting', '{"message": "winnerfromcgsi", "winner": "a"}', wsCB, chatCB);
    jest.runAllTimers();
})

test('handleBetMessages - nonadmin start', () => {
    const wsCB = jest.fn();
    const chatCB = jest.fn();

    handleBetMessages('testuer', '!startbet', chatCB, wsCB);
    expect(wsCB).not.toHaveBeenCalled();
    expect(chatCB).not.toHaveBeenCalled();
})

test('handleBetMessages - admin start, winner from gsi', () => {
    const wsCB = jest.fn();
    const chatCB = jest.fn();

    handleBetMessages('griefcode', '!startbet', chatCB, wsCB);
    handleBetMessages('test', '!bet a', chatCB, wsCB);
    handleBetMessages('test', '!bet a', chatCB, wsCB);
    const date = moment().unix() + (90000 / 1000);
    jest.runAllTimers();
    expect(chatCB).toHaveBeenCalledTimes(2);
    expect(chatCB).toHaveBeenNthCalledWith(1, "Wetten wurden gestartet. Mit '!bet a' oder '!bet b' kannst du für dein favorisiertes Team abstimmen!");
    expect(chatCB).toHaveBeenNthCalledWith(2, 'Wetten sind geschlossen!');
    handleBetMessageFromWS('betting', '{"message": "winnerfromcgsi", "winner": "a"}', wsCB, chatCB);
    expect(chatCB).toHaveBeenCalledTimes(3);
    expect(chatCB).toHaveBeenNthCalledWith(3, "Der Gewinner wurde auf 'a' gesetzt.");

    expect(wsCB).toHaveBeenCalledTimes(4);
    expect(wsCB).toHaveBeenNthCalledWith(1, {
        type: 'betting',
        data: {
            finishDate:  date,
            status: 'started',
            subType: 'update',
            aBets: [],
            bBets: [],
            betters: [],
        }
    });
    expect(wsCB).toHaveBeenNthCalledWith(2, {
        type: 'betting',
        data: {
            finishDate:  date,
            status: 'started',
            subType: 'update',
            aBets: ['test'],
            bBets: [],
            betters: ['test'],
        }
    });
    expect(wsCB).toHaveBeenNthCalledWith(3, {
        type: 'betting',
        data: {
            finishDate:  null,
            status: 'running',
            subType: 'update',
            aBets: ['test'],
            bBets: [],
            betters: ['test'],
        }
    });
    expect(wsCB).toHaveBeenNthCalledWith(4, {
        type: 'betting',
        data: {
            finishDate:  null,
            status: 'finished',
            subType: 'update',
            aBets: [],
            bBets: [],
            betters: [],
        }
    });
});


test('handleBetMessages - with bet vote', () => {
    const wsCB = jest.fn();
    const chatCB = jest.fn();

    handleBetMessages('griefcode', '!startbet', chatCB, wsCB);
    handleBetMessages('test', '!bet a', chatCB, wsCB);
    handleBetMessages('b test', '!bet b', chatCB, wsCB);
    handleBetMessages('c test', '!bet c', chatCB, wsCB);
    const date = moment().unix() + (90000 / 1000);
    jest.runAllTimers();
    handleBetMessages('griefcode', '!winner a', chatCB, wsCB);
    expect(chatCB).toHaveBeenCalledTimes(3);
    expect(chatCB).toHaveBeenNthCalledWith(1, "Wetten wurden gestartet. Mit '!bet a' oder '!bet b' kannst du für dein favorisiertes Team abstimmen!");
    expect(chatCB).toHaveBeenNthCalledWith(2, 'Wetten sind geschlossen!');
    expect(chatCB).toHaveBeenNthCalledWith(3, "Der Gewinner wurde auf 'a' gesetzt.");

    expect(wsCB).toHaveBeenCalledTimes(5);
    expect(wsCB).toHaveBeenNthCalledWith(1, {
        type: 'betting',
        data: {
            finishDate:  date,
            status: 'started',
            subType: 'update',
            aBets: [],
            bBets: [],
            betters: [],
        }
    });
    expect(wsCB).toHaveBeenNthCalledWith(2, {
        type: 'betting',
        data: {
            finishDate:  date,
            status: 'started',
            subType: 'update',
            aBets: ['test'],
            bBets: [],
            betters: ['test'],
        }
    });
    expect(wsCB).toHaveBeenNthCalledWith(3, {
        type: 'betting',
        data: {
            finishDate:  date,
            status: 'started',
            subType: 'update',
            aBets: ['test'],
            bBets: ['b test'],
            betters: ['test', 'b test'],
        }
    });
    expect(wsCB).toHaveBeenNthCalledWith(4, {
        type: 'betting',
        data: {
            finishDate:  null,
            status: 'running',
            subType: 'update',
            aBets: ['test'],
            bBets: ['b test'],
            betters: ['test', 'b test'],
        }
    });
    expect(wsCB).toHaveBeenNthCalledWith(5, {
        type: 'betting',
        data: {
            finishDate:  null,
            status: 'finished',
            subType: 'update',
            aBets: [],
            bBets: [],
            betters: [],
        }
    });
});

test('betstats - no result', async () => {
    const wsCB = jest.fn();
    const chatCB = jest.fn();
    mockGet.mockReturnValueOnce({wins: 0, rounds: 0});

    await handleBetMessages('griefcode', '!betstats', chatCB, wsCB);

    expect(chatCB).toHaveBeenCalledTimes(1);
    expect(chatCB).toHaveBeenCalledWith('@griefcode, du hast noch keine Wetten mitgemacht!');
})
test('betstats - no result - empty response', async () => {
    const wsCB = jest.fn();
    const chatCB = jest.fn();
    mockGet.mockReturnValueOnce({});

    await handleBetMessages('griefcode', '!betstats', chatCB, wsCB);

    expect(chatCB).toHaveBeenCalledTimes(1);
    expect(chatCB).toHaveBeenCalledWith('@griefcode, du hast noch keine Wetten mitgemacht!');
})

test('betstats - result', async () => {
    const wsCB = jest.fn();
    const chatCB = jest.fn();
    mockGet.mockReturnValueOnce({wins: 5, rounds: 10});

    await handleBetMessages('griefcode', '!betstats', chatCB, wsCB);

    expect(chatCB).toHaveBeenCalledTimes(1);
    expect(chatCB).toHaveBeenCalledWith('@griefcode, du hast 5 Wetten aus 10 Runden richtig. Das sind 50%.');
})

test('betstats - with payload', async () => {
    const wsCB = jest.fn();
    const chatCB = jest.fn();
    mockGet.mockReturnValueOnce({wins: 5, rounds: 10});

    await handleBetMessages('griefcode', '!betstats dende73', chatCB, wsCB);

    expect(chatCB).toHaveBeenCalledTimes(1);
    expect(chatCB).toHaveBeenCalledWith('@griefcode, dende73 hat 5 Wetten aus 10 Runden richtig. Das sind 50%.');
})

test('betcommands', async () => {
    const wsCB = jest.fn();
    const chatCB = jest.fn();
    mockGet.mockReturnValueOnce({wins: 5, rounds: 10});

    await handleBetMessages('griefcode', '!betcommands', chatCB, wsCB);

    expect(chatCB).toHaveBeenCalledTimes(1);
    expect(chatCB).toHaveBeenCalledWith('Die Bet-Commands sind !betstats und !top. Abstimmen kannst du mit \'!bet a\' oder \'!bet b\'');
})

test('top', async () => {
    const wsCB = jest.fn();
    const chatCB = jest.fn();
    mockGet.mockReturnValueOnce([{rank: 1, name: 'griefcode', won: 12, total: 15}]);
    await handleBetMessages('griefcode', '!top', chatCB, wsCB);

    expect(chatCB).toHaveBeenCalledTimes(0);
})