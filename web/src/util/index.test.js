const load = () => {
  jest.resetModules();
  return require('./index'); // eslint-disable-line global-require
};

describe('utility arrays', () => {
  test('constant shared arrays are as expected', () => {
    const { ACTIVITY_FUNDING_SOURCES, STATES, STANDARDS } = load();

    expect(ACTIVITY_FUNDING_SOURCES).toEqual(['HIT', 'HIE', 'MMIS']);
    expect(STATES.length).toBe(56);
    expect(STANDARDS.length).toBe(11);
  });
});

describe('provides default years based on now', () => {
  test('before October', () => {
    jest.useFakeTimers().setSystemTime(new Date('1970-09-01').getTime());
    // tick forward 10 days, so we're not on the weird date boundary
    jest.advanceTimersByTime(864000000);
    const { defaultAPDYearOptions, defaultAPDYears } = load();

    expect(defaultAPDYearOptions).toEqual(['1970', '1971', '1972']);
    expect(defaultAPDYears).toEqual(['1970', '1971']);

    jest.clearAllTimers();
  });

  test('after October', () => {
    jest.useFakeTimers().setSystemTime(new Date('1970-10-01').getTime());
    // tick forward 360 days
    jest.advanceTimersByTime(31104000000);
    const { defaultAPDYearOptions, defaultAPDYears } = load();

    expect(defaultAPDYearOptions).toEqual(['1971', '1972', '1973']);
    expect(defaultAPDYears).toEqual(['1971', '1972']);

    jest.clearAllTimers();
  });
});

describe('utility functions', () => {
  const {
    applyToNumbers,
    arrToObj,
    generateKey,
    getParams,
    stateDateToDisplay,
    stateDateRangeToDisplay,
    stateLookup
  } = load();

  test('apply a function to numbers in an object, deeply', () => {
    expect(applyToNumbers({ a: 1, b: 2, c: { d: 7 } }, () => 'boop')).toEqual({
      a: 'boop',
      b: 'boop',
      c: { d: 'boop' }
    });
  });

  test('finds a state by two-letter code', () => {
    expect(stateLookup('Mo')).toEqual({ id: 'mo', name: 'Missouri' });
    expect(stateLookup('MO')).toEqual({ id: 'mo', name: 'Missouri' });
    expect(stateLookup('mo')).toEqual({ id: 'mo', name: 'Missouri' });
    expect(stateLookup('bob')).toEqual(undefined);
  });

  test('parses parameters from a URL query string', () => {
    expect(getParams('?hello=world&seven=7&bob&long=this%20is%20text')).toEqual(
      {
        hello: 'world',
        seven: '7',
        bob: null,
        long: 'this is text'
      }
    );
  });

  test('generates a key', () => {
    // Letters are only 37.5% of hex digits, so running this test a lot makes
    // it statistically very unlikely that we'd just happen to only generate
    // keys that start with a letter
    for (let i = 0; i < 50000; i += 1) {
      const key = generateKey();
      expect(key).toEqual(expect.stringMatching(/^[a-f0-9]{8}$/));
      expect(key).toEqual(expect.stringMatching(/[a-f]/));
    }
  });

  test('converts a state-formatted date string into a display string', () => {
    expect(stateDateToDisplay('2014-04-03')).toEqual('4/3/2014');
    expect(stateDateToDisplay(null)).toEqual('Date not specified');
    expect(stateDateToDisplay()).toEqual('Date not specified');
  });

  test('converts two state-formatted date strings into a display date range', () => {
    expect(stateDateRangeToDisplay('2014-04-03', '2015-04-19')).toEqual(
      '4/3/2014 - 4/19/2015'
    );
    expect(stateDateRangeToDisplay(null, null)).toEqual(
      'Date not specified - Date not specified'
    );
    expect(stateDateRangeToDisplay('2014-04-03', null)).toEqual(
      '4/3/2014 - Date not specified'
    );
    expect(stateDateRangeToDisplay(null, '2015-04-09')).toEqual(
      'Date not specified - 4/9/2015'
    );
    expect(stateDateRangeToDisplay(null, '9999-01-99')).toEqual(
      'Date not specified - Invalid date'
    );
    expect(stateDateRangeToDisplay('2020-14-35', '9999-01-99')).toEqual(
      'Invalid date - Invalid date'
    );
    expect(stateDateRangeToDisplay()).toEqual(
      'Date not specified - Date not specified'
    );
  });

  test('converts an array into an object with array values as object keys', () => {
    expect(arrToObj(['a', 'b', 'c'])).toEqual({ a: 0, b: 0, c: 0 });
    expect(arrToObj(['a', 'b', 'c'], 'boop')).toEqual({
      a: 'boop',
      b: 'boop',
      c: 'boop'
    });
  });
});
