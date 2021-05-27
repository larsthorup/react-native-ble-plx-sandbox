// Note: these are Jest tests, and are tested as part of "app".

import { base64FromUint8, uint8FromBase64 } from './base64.js';

describe('base64', () => {
  describe('uint8FromBase64', () => {
    it('should decode integers', () => {
      expect(uint8FromBase64('AA==')).toEqual(0);
      expect(uint8FromBase64('Kg==')).toEqual(42);
      expect(uint8FromBase64('/w==')).toEqual(255);
    });
  });

  describe('base64FromUint', () => {
    it('should encode integers', () => {
      expect(base64FromUint8(0)).toEqual('AA==');
      expect(base64FromUint8(42)).toEqual('Kg==');
      expect(base64FromUint8(255)).toEqual('/w==');
    });
  });
});
