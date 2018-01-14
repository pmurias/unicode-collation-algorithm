'use strict';
const fs = require('fs');

const xregexp = require('xregexp');

const UnicodeTrie = require('unicode-trie')
const unorm = require('./unorm.js');
const path = require('path');

///transpiled version of \p{Unified_Ideograph}/u
const isIdeograph = /^(?:[\u3400-\u4DB5\u4E00-\u9FEA\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0])$/;

const isCoreHan = xregexp('^(?:\\p{InCJK_Unified_Ideographs}|\p{InCJK_Compatibility_Ideographs)$', 'A');

const PRIMARY = 1
const PRIMARY_REVERSED = 2
const SECONDARY = 4
const SECONDARY_REVERSED = 8
const TERTIARY =  16
const TERTIARY_REVERSED = 32
const QUATERNARY = 64
const QUATERNARY_REVERSED = 128

let collationElements;


const ccc = new UnicodeTrie(fs.readFileSync(__dirname + '/ccc.trie'));

function readAllKeys() {
  collationElements = new Map();
  const lines = fs.readFileSync(path.join(__dirname, 'allkeys.txt'), 'ascii').split(/\n/);
  for (const line of lines) {
    if (line.match(/^#/) || line.match(/^\s*$/)) {
    } else if (line.match(/^(?:@version|@implicitweight)/)) {
    } else {
      const mapping = line.match(/^((?:\w+\s*?)+)\s*\;\s*(\S*)\s*(?:#.*)$/);
      if (!mapping) {
        console.log(line, mapping);
      }
      const codes = mapping[1].split(/\s+/).map(code => parseInt(code, 16));
      const elements = mapping[2].match(/\[(?:(?:\.|\*)\w+)*\]/g).map(
        levels => levels.substr(1, levels.length-2).match(/(?:\.|\*)\w+/g).map(level => parseInt(level.substr(1), 16))
      );


      collationElements.set(String.fromCodePoint.apply(null, codes), elements);
    }
  }

}


function sortKeyRaw(str, flags) {
  if (!collationElements) readAllKeys();

  const codes = Array.from(str);

  const elements = [];

  let processed = 0;
  while (processed < codes.length) {
    let attemptOffset = processed;
    let attemptCodes = '';


    let lookedupOffset;
    let lookedupCodes;


    // TODO take max prefix length into account

    while (attemptOffset < codes.length) {
      attemptCodes = attemptCodes + codes[attemptOffset];
      if (collationElements.get(attemptCodes) !== undefined) {
        lookedupOffset = attemptOffset;
        lookedupCodes = attemptCodes;
      }
      attemptOffset++;
    }

    if (lookedupCodes) {

      let extraOffset = lookedupOffset+1;

      let maxCCC = 0;

      let foundCCC;
      while (extraOffset < codes.length && (foundCCC = ccc.get(codes[extraOffset].codePointAt(0)))) {
        if (foundCCC > maxCCC && collationElements.get(lookedupCodes + codes[extraOffset]) !== undefined) {
          lookedupCodes = lookedupCodes + codes[extraOffset];
          codes.splice(extraOffset, 1);
        }
        maxCCC = Math.max(foundCCC, maxCCC);
        extraOffset++;
      }

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
    const isNormal = flags & (1 << (2*level));
    const isReversed = flags & (1 << (2*level + 1));
    if (!isNormal && !isReversed) {
      continue;
    }

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

  let lastReversed;

  for (let level=0; level < 3; level++) {
    let reversed = false;
    if (flags & (1 << (2*level))) {
    } else if (flags & (1 << (2*level + 1))) {
      reversed = true;
    } else {
      continue;
    }

    if (level !== 0) {
       key.writeUInt16BE(lastReversed ? 2**16 - 1 : 0, offset);
       offset += 2;
    }

    for (const element of elements) {
      if (element[level]) {
        key.writeUInt16BE(reversed ? 2**16 - 1 - element[level] : element[level], offset);
        offset += 2;
      }
    }
    lastReversed = reversed;
  }

  return key;
}

function sortKey(str, flags) {
  return sortKeyRaw(unorm.nfd(str), flags);
}

exports.sortKey = sortKey;

function compare(a, b, flags) {
  const normalizedA = unorm.nfd(a);
  const normalizedB = unorm.nfd(b);

  const cmp = sortKeyRaw(normalizedA, flags).compare(sortKeyRaw(normalizedB, flags));


  if (flags & QUATERNARY && cmp === 0) {
    return (normalizedA < normalizedB) ? -1 : (normalizedA > normalizedB ? 1 : 0);
  } else if (flags & QUATERNARY_REVERSED && cmp === 0) {
    return (normalizedA < normalizedB) ? 1 : (normalizedA > normalizedB ? -1 : 0);
  }
  return cmp;
}

exports.PRIMARY = 1
exports.PRIMARY_REVERSED = 2
exports.SECONDARY = 4
exports.SECONDARY_REVERSED = 8
exports.TERTIARY =  16
exports.TERTIARY_REVERSED = 32
exports.QUATERNARY = 64
exports.QUATERNARY_REVERSED = 128

exports.compare = compare;
