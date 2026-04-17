export const env = {
  baseUrl: process.env.BASE_URL ?? 'https://playwright.dev',
  username: process.env.LOGIN_USERNAME ?? '',
  password: process.env.LOGIN_PASSWORD ?? '',
  checkerUsername: process.env.CHECKER_USERNAME ?? '',
  checkerPassword: process.env.CHECKER_PASSWORD ?? '',
};
