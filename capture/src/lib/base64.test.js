import { Buffer } from 'buffer';

import { expect } from 'chai';

import {
  printableFromBase64,
  base64FromString,
  base64FromUint8,
  bufferFromBase64,
  stringFromBase64,
  uint8FromBase64,
  isPrintableFromBase64,
} from './base64.js';

describe('base64', () => {
  describe('uint8FromBase64', () => {
    it('should decode integers', () => {
      expect(uint8FromBase64('AA==')).to.equal(0);
      expect(uint8FromBase64('Kg==')).to.equal(42);
      expect(uint8FromBase64('/w==')).to.equal(255);
    });
  });

  describe('base64FromUint', () => {
    it('should encode integers', () => {
      expect(base64FromUint8(0)).to.equal('AA==');
      expect(base64FromUint8(42)).to.equal('Kg==');
      expect(base64FromUint8(255)).to.equal('/w==');
    });
  });

  describe('stringFromBase64', () => {
    it('should decode strings', () => {
      expect(stringFromBase64('')).to.equal('');
      expect(stringFromBase64('Z2Rj')).to.equal('gdc');
    });
  });

  describe('base64FromString', () => {
    it('should encode strings', () => {
      expect(base64FromString('')).to.equal('');
      expect(base64FromString('gdc')).to.equal('Z2Rj');
    });
  });

  describe('bufferFromBase64', () => {
    it('should decode binary data', () => {
      expect(bufferFromBase64('AAAAAAAAAAA=').equals(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]))).to.be.true;
    });
  });

  describe('printableFromBase64', () => {
    it('should decode only printable characters', () => {
      expect(printableFromBase64('Z2Rj')).to.equal('gdc');
      expect(printableFromBase64(base64FromString('a\bx\n'))).to.equal('a?x?');
      expect(printableFromBase64('AAAAAAAAAAA=')).to.equal('????????');
    });
  });

  describe('isPrintableFromBase64', () => {
    it('should verify that string is printable', () => {
      expect(isPrintableFromBase64('Z2Rj')).to.equal(true);
      expect(isPrintableFromBase64(base64FromString('a\bx\n'))).to.equal(false);
      expect(isPrintableFromBase64('AAAAAAAAAAA=')).to.equal(false);
    });
  });
});
