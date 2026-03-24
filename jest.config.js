module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'utils/**/*.js',
    '!utils/area.js'
  ],
  coverageDirectory: 'coverage',
  setupFiles: ['./tests/setup.js'],
  transform: {},
  moduleFileExtensions: ['js', 'json'],
  // 不使用 clearMocks/restoreMocks，因为 setup.js 中我们用 beforeEach 手动管理 mock 清理
  // clearMocks 会在 setupFiles 运行后重置 jest.fn()，导致 wx mock 失效
}
