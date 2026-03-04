import 'dotenv/config';
import { expect } from 'expect';

import { sendConfirmationEmail } from '@/services/email';

describe('Email Service', () => {
  describe('sendConfirmationEmail', () => {
    let emailInfo: { messageId: string; previewUrl: string | null };

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
