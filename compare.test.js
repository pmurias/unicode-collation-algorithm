const compare = require('./index.js').compare;

test('simple comparsion', () => {
  expect(compare('foo', 'foo')).toBe(0);
});
