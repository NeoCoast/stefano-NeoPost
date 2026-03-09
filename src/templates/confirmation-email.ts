export const confirmationEmailHtml = (confirmUrl: string): string => `
  <h1>Welcome to NeoPost!</h1>
  <p>Click the link below to confirm your account:</p>
  <a href="${confirmUrl}">${confirmUrl}</a>
  <p>This link expires in 24 hours.</p>
`;
