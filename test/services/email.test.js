require('dotenv').config();
const { expect } = require('expect');
const { sendConfirmationEmail } = require('../../src/services/email');

describe('Email Service', () => {
  describe('sendConfirmationEmail', () => {
    let emailInfo;

    before(async function () {
      this.timeout(10000);
      emailInfo = await sendConfirmationEmail('test@example.com', 'fake-token-123');
    });

    it('should send an email and return info with messageId', () => {
      expect(emailInfo.messageId).toBeDefined();
    });

    it('should include a preview URL in development', () => {
      expect(emailInfo.previewUrl).toBeDefined();
      expect(typeof emailInfo.previewUrl).toBe('string');
    });
  });
});
