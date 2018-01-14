const uca = require('./index.js');

test('simple comparsion', () => {
  expect(uca.compare('foo', 'foo', uca.PRIMARY)).toBe(0);
  expect(uca.compare('a', 'b', uca.PRIMARY)).toBe(-1);
  expect(uca.compare('b', 'a', uca.PRIMARY)).toBe(1);

});
