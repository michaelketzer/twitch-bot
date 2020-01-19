import {handleFeedVoteMessageFromWS, handleFeedVoteMessage} from '../feed';

jest.useFakeTimers();

test('handleFeedVoteMessageFromWS - invalid json', () => {
    const wsCB = jest.fn();
    const chatCB = jest.fn();
    expect(() => handleFeedVoteMessageFromWS('anytype', {message: "test"}, wsCB, chatCB)).toThrow();
})
;

test('handleFeedVoteMessageFromWS - non feedvoting type', () => {
    const wsCB = jest.fn();
    const chatCB = jest.fn();
    handleFeedVoteMessageFromWS('anytype', '{"message": "test"}', wsCB, chatCB);
    expect(wsCB).not.toHaveBeenCalled();
    expect(chatCB).not.toHaveBeenCalled();
})

test('handleFeedVoteMessageFromWS - init', () => {
    const wsCB = jest.fn();
    const chatCB = jest.fn();
    handleFeedVoteMessageFromWS('feedvoting', '{"message": "init"}', wsCB, chatCB);
    expect(wsCB).toHaveBeenCalledWith({
        type: 'feedvoting',
        data: {
            finishDate: null,
            status: 'none',
            subType: 'init',
            feedVotes: [],
            noFeedVotes: [],
            voters: [],
        }
    });
    expect(chatCB).not.toHaveBeenCalled();
})

test('handleFeedVoteMessageFromWS - startfromgsi', () => {
    const wsCB = jest.fn();
    const chatCB = jest.fn();
    handleFeedVoteMessageFromWS('feedvoting', '{"message": "startfromgsi"}', wsCB, chatCB);
    jest.runAllTimers();
    expect(wsCB).toHaveBeenCalledTimes(3);
    expect(chatCB).toHaveBeenNthCalledWith(1, 'Hat shokzTV gefeeded? Was meinst du? Benutze "!feed" oder "!keinfeed"');
    expect(chatCB).toHaveBeenNthCalledWith(2, 'Das Ergebnis steht fest! shokzTV hat nicht gefeedet.');
})

test('handleFeedVoteMessage - nonadmin start', () => {
    const wsCB = jest.fn();
    const chatCB = jest.fn();

    handleFeedVoteMessage('testuer', '!votefeed', chatCB, wsCB);
    expect(wsCB).not.toHaveBeenCalled();
    expect(chatCB).not.toHaveBeenCalled();
})

test('handleFeedVoteMessage - admin start', () => {
    const wsCB = jest.fn();
    const chatCB = jest.fn();

    handleFeedVoteMessage('griefcode', '!votefeed', chatCB, wsCB);
    jest.runAllTimers();
    expect(wsCB).toHaveBeenCalledTimes(3);
    expect(chatCB).toHaveBeenNthCalledWith(1, 'Hat shokzTV gefeeded? Was meinst du? Benutze "!feed" oder "!keinfeed"');
    expect(chatCB).toHaveBeenNthCalledWith(2, 'Das Ergebnis steht fest! shokzTV hat nicht gefeedet.');
})


test('handleFeedVoteMessage - with feed vote', () => {
    const wsCB = jest.fn();
    const chatCB = jest.fn();

    handleFeedVoteMessage('griefcode', '!votefeed', chatCB, wsCB);
    handleFeedVoteMessage('test', '!feed', chatCB, wsCB);
    jest.runAllTimers();
    expect(wsCB).toHaveBeenCalledTimes(4);
    expect(chatCB).toHaveBeenNthCalledWith(1, 'Hat shokzTV gefeeded? Was meinst du? Benutze "!feed" oder "!keinfeed"');
    expect(chatCB).toHaveBeenNthCalledWith(2, 'Das Ergebnis steht fest! shokzTV hat gefeedet.');
})