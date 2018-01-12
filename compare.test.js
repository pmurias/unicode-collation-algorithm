const compare = require('./index.js').compare;

test('simple comparsion', () => {
  expect(compare('foo', 'foo')).toBe(0);
  expect(compare('a', 'b')).toBe(-1);
  expect(compare('b', 'a')).toBe(1);

});
