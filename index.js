const fs = require('fs');

let collationElements;

function readAllKeys() {
  collationElements = new Map();
  const lines = fs.readFileSync('allkeys.txt', 'ascii').split(/\n/);
  for (const line of lines) {
    if (line.match(/^#/) || line.match(/^\s*$/)) {
    } else if (line.match(/^(?:@version|@implicitweight)/)) {
    } else {
      const mapping = line.match(/^((?:\w+\s*?)+)\s*\;\s*(\S*)\s*(?:#.*)$/);
      if (!mapping) {
        console.log(line, mapping);
      }
      const codes = mapping[1].split(/\s+/).map(code => parseInt(code, 16));
//      if (codes.length != 1) console.log(mapping[1]);
      const elements = mapping[2].match(/\[(?:(?:\.|\*)\w+)*\]/g).map(
        levels => levels.substr(1, levels.length-2).match(/(?:\.|\*)\w+/g).map(level => parseInt(level.substr(1), 16))
      );

//      console.log('code:', parseInt(code, 16), mapping[2], 'elements:', elements);

      collationElements.set(String.fromCodePoint.apply(null, codes), elements);
    }
  }

}


function sortKey(str) {
  if (!collationElements) readAllKeys();
  const normalized = str.normalize('NFD');

  const elements = [];

  for (const c of normalized) {
    for (const element of collationElements.get(c)) {
        //console.log('c:', c.codePointAt(0).toString(16), collationElements.get(c).map(element => element.map(value => value.toString(16))));
        elements.push(element);
    }
  }
 
  let keySize = 0;

  for (let level=0; level < 3; level++) {
    if (level !== 0) {
      keySize += 2;
    }
    for (const element of elements) {
      if (element[level]) {
        keySize += 2;
      }
    }
  }

  const key = new Buffer(keySize);

  let offset = 0;
  for (let level=0; level < 3; level++) {
    if (level !== 0) {
       key.writeUInt16BE(0, offset);
       offset += 2;
    }

    for (const element of elements) {
      if (element[level]) {
        key.writeUInt16BE(element[level], offset);
        offset += 2;
      }
    }

  }

  return key;
}

exports.sortKey = sortKey;

function compare(a, b) {
  return sortKey(a).compare(sortKey(b));
}

module.exports.compare = compare;
