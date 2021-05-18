import { Buffer } from 'buffer';

export const uint8FromBase64 = (data) => Buffer.from(data, 'base64')[0];
export const base64FromUint8 = (value) => Buffer.from([value]).toString('base64');
export const stringFromBase64 = (data) => Buffer.from(data, 'base64').toString('ascii');
export const base64FromString = (value) => Buffer.from(value).toString('base64');
export const bufferFromBase64 = (data) => Buffer.from(data, 'base64');
export const asciiFromBase64 = (data) => Buffer.from(data, 'base64').toString('ascii');
export const isAsciiFromBase64 = (data) => base64FromString(asciiFromBase64(data)) === data;
