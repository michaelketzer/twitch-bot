import {handleShokzFightMessage} from '../shokzFight';

jest.useFakeTimers();

test('wrong command', () => {
    const cb = jest.fn();
    handleShokzFightMessage('testuser', '!betstats', false, cb);
    expect(cb).not.toHaveBeenCalled();
})

test('!deny without fight', () => {
    const cb = jest.fn();
    handleShokzFightMessage('testuser', '!deny', false, cb);
    expect(cb).not.toHaveBeenCalled();
})

test('invalid opponent', () => {
    const cb = jest.fn();
    handleShokzFightMessage('testuser', 'shokzFight @est asdasdas as', false, cb);
    expect(cb).not.toHaveBeenCalled();
})

test('no opponent', () => {
    const cb = jest.fn();
    handleShokzFightMessage('testuser', 'shokzFight', false, cb);
    expect(cb).not.toHaveBeenCalled();
})

test('start fight', () => {
    const cb = jest.fn();
    handleShokzFightMessage('testuser', 'shokzFight @user2', false, cb);
    expect(cb).toHaveBeenCalledWith('shokzFight shokzFight testuser fordert user2 heraus. Akzeptiere den Kampf mit \'shokzFight\' oder lehne ab mit \'!deny\' shokzFight shokzFight');
    jest.runAllTimers();
    expect(cb).toHaveBeenCalledWith('FeelsBadMan user2 hat nicht geantwortet. Es kommt nicht zum Kampf mit testuser FeelsBadMan');
})

test('secondary fight', () => {
    const cb = jest.fn();
    handleShokzFightMessage('testuser', 'shokzFight @user2', false, cb);
    expect(cb).toHaveBeenCalledWith('shokzFight shokzFight testuser fordert user2 heraus. Akzeptiere den Kampf mit \'shokzFight\' oder lehne ab mit \'!deny\' shokzFight shokzFight');
    handleShokzFightMessage('testuser', 'shokzFight @user3', false, cb);
    expect(cb).toHaveBeenCalledWith('testuser du kämpfst schon gegen user2!');
    jest.runAllTimers();
})

test('accept fight - winner 1, no payload', () => {
    const cb = jest.fn();
    handleShokzFightMessage('testuser', 'shokzFight @user2', false, cb);
    expect(cb).toHaveBeenCalledWith('shokzFight shokzFight testuser fordert user2 heraus. Akzeptiere den Kampf mit \'shokzFight\' oder lehne ab mit \'!deny\' shokzFight shokzFight');
    global.Math.random = () => 0.1;
    handleShokzFightMessage('user2', 'shokzFight', false, cb);
    expect(cb).toHaveBeenNthCalledWith(2, 'Der Kampf wurde entschieden für testuser PogChamp PepeLaugh Damit bekommt @user2 einen Timeout von 60 Sekunden PepeLaugh OMEGALUTSCH');
    expect(cb).toHaveBeenNthCalledWith(3, '/timeout @user2 60');
})

test('accept fight - winner 1, with payload', () => {
    const cb = jest.fn();
    handleShokzFightMessage('testuser', 'shokzFight @user2', false, cb);
    expect(cb).toHaveBeenCalledWith('shokzFight shokzFight testuser fordert user2 heraus. Akzeptiere den Kampf mit \'shokzFight\' oder lehne ab mit \'!deny\' shokzFight shokzFight');
    global.Math.random = () => 0.1;
    handleShokzFightMessage('user2', 'shokzFight @testuser', false, cb);
    expect(cb).toHaveBeenNthCalledWith(2, 'Der Kampf wurde entschieden für testuser PogChamp PepeLaugh Damit bekommt @user2 einen Timeout von 60 Sekunden PepeLaugh OMEGALUTSCH');
    expect(cb).toHaveBeenNthCalledWith(3, '/timeout @user2 60');
})

test('accept fight - winner 2', () => {
    const cb = jest.fn();
    handleShokzFightMessage('testuser', 'shokzFight @user2', false, cb);
    expect(cb).toHaveBeenCalledWith('shokzFight shokzFight testuser fordert user2 heraus. Akzeptiere den Kampf mit \'shokzFight\' oder lehne ab mit \'!deny\' shokzFight shokzFight');
    global.Math.random = () => 0.8;
    handleShokzFightMessage('user2', 'shokzFight @testuser', false, cb);
    expect(cb).toHaveBeenNthCalledWith(2, 'Der Kampf wurde entschieden für user2 PogChamp PepeLaugh Damit bekommt @testuser einen Timeout von 300 Sekunden PepeLaugh OMEGALUTSCH');
    expect(cb).toHaveBeenNthCalledWith(3, '/timeout @testuser 300');
})
test('accept fight - no winner, both ko', () => {
    const cb = jest.fn();
    handleShokzFightMessage('testuser', 'shokzFight @user2', false, cb);
    expect(cb).toHaveBeenCalledWith('shokzFight shokzFight testuser fordert user2 heraus. Akzeptiere den Kampf mit \'shokzFight\' oder lehne ab mit \'!deny\' shokzFight shokzFight');
    global.Math.random = () => 0.55;
    handleShokzFightMessage('user2', 'shokzFight @testuser', false, cb);
    expect(cb).toHaveBeenNthCalledWith(2, 'PepeLaugh PepeLaugh Es haben sich @testuser und @user2 gleichzeitig KO gehauen PepeLaugh Damit bekommen beide einen Timeout von 120 Sekunden PepeLaugh PepeLaugh');
    expect(cb).toHaveBeenNthCalledWith(3, '/timeout @testuser 120');
    expect(cb).toHaveBeenNthCalledWith(4, '/timeout @user2 120');
})
test('accept fight - no winner', () => {
    const cb = jest.fn();
    handleShokzFightMessage('testuser', 'shokzFight @user2', false, cb);
    expect(cb).toHaveBeenCalledWith('shokzFight shokzFight testuser fordert user2 heraus. Akzeptiere den Kampf mit \'shokzFight\' oder lehne ab mit \'!deny\' shokzFight shokzFight');
    global.Math.random = () => 0.45;
    handleShokzFightMessage('user2', 'shokzFight @testuser', false, cb);
    expect(cb).toHaveBeenNthCalledWith(2, '@testuser und @user2 sind beides die letzten Pepega. Keiner von beiden hat den anderen getroffen! Keiner bekommt einen Timeout SwiftLove');
})
test('deny fight', () => {
    const cb = jest.fn();
    handleShokzFightMessage('testuser', 'shokzFight @user2', false, cb);
    expect(cb).toHaveBeenCalledWith('shokzFight shokzFight testuser fordert user2 heraus. Akzeptiere den Kampf mit \'shokzFight\' oder lehne ab mit \'!deny\' shokzFight shokzFight');
    handleShokzFightMessage('user2', '!deny', false, cb);
    expect(cb).toHaveBeenNthCalledWith(2, 'PepeLaugh user2 möchte nicht gegen testuser kämpfen PepeLaugh');
})
test('accept fight - mod started', () => {
    const cb = jest.fn();
    handleShokzFightMessage('testuser', 'shokzFight @user2', true, cb);
    expect(cb).toHaveBeenCalledWith('shokzFight shokzFight testuser fordert user2 heraus. Akzeptiere den Kampf mit \'shokzFight\' oder lehne ab mit \'!deny\' shokzFight shokzFight');
    global.Math.random = () => 0.8;
    handleShokzFightMessage('user2', 'shokzFight', false, cb);
    expect(cb).toHaveBeenNthCalledWith(2, 'Der Kampf wurde entschieden für testuser PogChamp PepeLaugh Damit bekommt @user2 einen Timeout von 300 Sekunden PepeLaugh OMEGALUTSCH');
    expect(cb).toHaveBeenNthCalledWith(3, '/timeout @user2 300');
})
test('accept fight - non-mod started', () => {
    const cb = jest.fn();
    handleShokzFightMessage('testuser', 'shokzFight @user2', false, cb);
    expect(cb).toHaveBeenCalledWith('shokzFight shokzFight testuser fordert user2 heraus. Akzeptiere den Kampf mit \'shokzFight\' oder lehne ab mit \'!deny\' shokzFight shokzFight');
    global.Math.random = () => 0.8;
    handleShokzFightMessage('user2', 'shokzFight', true, cb);
    expect(cb).toHaveBeenNthCalledWith(2, 'Der Kampf wurde entschieden für user2 PogChamp PepeLaugh Damit bekommt @testuser einen Timeout von 300 Sekunden PepeLaugh OMEGALUTSCH');
    expect(cb).toHaveBeenNthCalledWith(3, '/timeout @testuser 300');
})