/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'ci', 'revert'],
    ],
    'scope-enum': [
      1,
      'always',
      ['backend', 'frontend', 'mcp', 'prisma', 'ci', 'deps', 'docs', 'e2e'],
    ],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
};
