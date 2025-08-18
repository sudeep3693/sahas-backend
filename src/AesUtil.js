import CryptoJS from 'crypto-js';

const SECRET_KEY = '8745195374528964'; // 16 characters
const IV = 'a0d4am58dyqmzux5';         // 16 characters

export const encrypt = (text) => {
  const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
  const iv = CryptoJS.enc.Utf8.parse(IV);

  const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(text), key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
};
