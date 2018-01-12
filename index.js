'use strict';
const fs = require('fs');

const xregexp = require('xregexp');

///transpiled version of \p{Unified_Ideograph}/u
const isIdeograph = /^(?:[\u3400-\u4DB5\u4E00-\u9FEA\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0])$/;

const isCoreHan = xregexp('^(?:\\p{InCJK_Unified_Ideographs}|\p{InCJK_Compatibility_Ideographs)$', 'A');

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

  const codes = Array.from(str.normalize('NFD'));

  const elements = [];

  let processed = 0;
  while (processed < codes.length) {
    //console.log('processing', processed);
    let attemptOffset = processed;
    let attemptCodes = codes[processed];

    //console.log('attempting', attemptCodes);

    let lookedupOffset;
    let lookedupCodes;

    while (collationElements.get(attemptCodes) !== undefined) {
      lookedupOffset = attemptOffset;
      lookedupCodes = attemptCodes;

      attemptCodes = attemptCodes + codes[++attemptOffset];
    }

    if (lookedupCodes) {
      for (const element of collationElements.get(lookedupCodes)) {
        elements.push(element);
      }
      processed = lookedupOffset + 1;
    } else {
      const codePoint = codes[processed].codePointAt(0);
      const unknown = codes[processed++];
      if (0x17000 <= codePoint && codePoint <= 0x18AFF) {
        elements.push([0xFB00,0x0020,0x0002], [(codePoint - 0x17000) | 0x8000, 0, 0]);
      } else if (0x1B170 <= codePoint && codePoint <= 0x1B2FF) {
        elements.push([0xFB01, 0x0020, 0x0002], [(codePoint - 0x1B170) | 0x8000, 0, 0]);
      } else {
        if (isIdeograph.test(unknown)) {
          if (isCoreHan.test(unknown)) {
            elements.push([0xFB40 + (codePoint >> 15),0x0020,0x0002]);
          } else {
            elements.push([0xFB80 + (codePoint >> 15),0x0020,0x0002]);
          }
        } else {
           elements.push([0xFBC0 + (codePoint >> 15),0x0020,0x0002]);
        }
        elements.push([(codePoint & 0x7FFF) | 0x8000, 0, 0]);
      }
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
