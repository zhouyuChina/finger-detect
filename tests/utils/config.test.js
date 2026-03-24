// config.js 单元测试
// 配置校验 — 确保安全合理的默认值

const config = require('../../utils/config.js')

// ============================================================
// 1. 超时配置
// ============================================================
describe('请求超时配置', () => {
  test('【安全】timeout 应在合理范围内（5s ~ 60s）', () => {
    // 当前值: 900000 (15分钟) — 这个测试预期会失败
    // 修复后应为 15000 (15秒)
    expect(config.timeout).toBeGreaterThanOrEqual(5000)
    expect(config.timeout).toBeLessThanOrEqual(60000)
  })

  test('retryCount 在合理范围（1~5）', () => {
    expect(config.retryCount).toBeGreaterThanOrEqual(1)
    expect(config.retryCount).toBeLessThanOrEqual(5)
  })
})

// ============================================================
// 2. API 端点配置
// ============================================================
describe('API 端点配置', () => {
  // 收集所有 api 分组
  const apiGroups = Object.keys(config.api)

  test('至少存在 5 个 API 分组', () => {
    expect(apiGroups.length).toBeGreaterThanOrEqual(5)
  })

  apiGroups.forEach(groupName => {
    describe(`api.${groupName}`, () => {
      const group = config.api[groupName]
      const endpoints = Object.keys(group)

      endpoints.forEach(endpointName => {
        test(`${groupName}.${endpointName} 是有效路径（非空字符串，以 / 开头）`, () => {
          const path = group[endpointName]
          expect(typeof path).toBe('string')
          expect(path.length).toBeGreaterThan(0)
          expect(path.startsWith('/')).toBe(true)
        })
      })
    })
  })
})

// ============================================================
// 3. 缓存过期时间配置
// ============================================================
describe('缓存过期时间配置', () => {
  const expireTimes = config.cache.expireTime

  Object.keys(expireTimes).forEach(key => {
    test(`cache.expireTime.${key} 是正数`, () => {
      expect(typeof expireTimes[key]).toBe('number')
      expect(expireTimes[key]).toBeGreaterThan(0)
    })
  })

  test('userInfo 过期时间应不超过 90 天', () => {
    const ninetyDays = 90 * 24 * 60 * 60 * 1000
    expect(expireTimes.userInfo).toBeLessThanOrEqual(ninetyDays)
  })

  test('【性能】message 缓存时间应 >= 10 分钟（减少频繁 API 调用）', () => {
    // 当前值: 5分钟 — 这个测试预期会失败
    const tenMinutes = 10 * 60 * 1000
    expect(expireTimes.message).toBeGreaterThanOrEqual(tenMinutes)
  })
})

// ============================================================
// 4. 文件上传配置
// ============================================================
describe('文件上传配置', () => {
  test('maxSize 是正数', () => {
    expect(config.upload.maxSize).toBeGreaterThan(0)
  })

  test('maxSize 不超过 50MB', () => {
    expect(config.upload.maxSize).toBeLessThanOrEqual(50 * 1024 * 1024)
  })

  test('allowedTypes 是非空数组', () => {
    expect(Array.isArray(config.upload.allowedTypes)).toBe(true)
    expect(config.upload.allowedTypes.length).toBeGreaterThan(0)
  })

  test('allowedTypes 只包含图片 MIME 类型', () => {
    config.upload.allowedTypes.forEach(type => {
      expect(type).toMatch(/^image\//)
    })
  })

  test('quality 在 0~1 之间', () => {
    expect(config.upload.quality).toBeGreaterThan(0)
    expect(config.upload.quality).toBeLessThanOrEqual(1)
  })
})

// ============================================================
// 5. 错误码配置
// ============================================================
describe('错误码配置', () => {
  test('SUCCESS 为 200', () => {
    expect(config.errorCodes.SUCCESS).toBe(200)
  })

  test('UNAUTHORIZED 为 401', () => {
    expect(config.errorCodes.UNAUTHORIZED).toBe(401)
  })

  test('所有错误码为数字', () => {
    Object.values(config.errorCodes).forEach(code => {
      expect(typeof code).toBe('number')
    })
  })
})

// ============================================================
// 6. 错误消息配置
// ============================================================
describe('错误消息配置', () => {
  test('所有错误码都有对应消息', () => {
    const importantCodes = [401, 403, 404, 500]
    importantCodes.forEach(code => {
      expect(config.errorMessages[code]).toBeDefined()
      expect(typeof config.errorMessages[code]).toBe('string')
      expect(config.errorMessages[code].length).toBeGreaterThan(0)
    })
  })

  test('存在默认错误消息', () => {
    expect(config.errorMessages.default).toBeDefined()
    expect(typeof config.errorMessages.default).toBe('string')
  })
})

// ============================================================
// 7. 环境配置
// ============================================================
describe('环境配置', () => {
  test('getCurrentConfig 返回包含 baseUrl 的对象', () => {
    const envConfig = config.getCurrentConfig()
    expect(envConfig).toBeDefined()
    expect(envConfig.baseUrl).toBeDefined()
    expect(typeof envConfig.baseUrl).toBe('string')
  })

  test('getCurrentConfig 返回包含 uploadUrl 的对象', () => {
    const envConfig = config.getCurrentConfig()
    expect(envConfig.uploadUrl).toBeDefined()
  })

  test('getCurrentConfig 返回包含 wsUrl 的对象', () => {
    const envConfig = config.getCurrentConfig()
    expect(envConfig.wsUrl).toBeDefined()
  })

  test('baseUrl 使用 HTTPS', () => {
    const envConfig = config.getCurrentConfig()
    expect(envConfig.baseUrl).toMatch(/^https:\/\//)
  })

  test('wsUrl 使用 WSS', () => {
    const envConfig = config.getCurrentConfig()
    expect(envConfig.wsUrl).toMatch(/^wss:\/\//)
  })
})

// ============================================================
// 8. UI 配置
// ============================================================
describe('UI 默认配置', () => {
  test('Banner 轮播配置合理', () => {
    expect(config.ui.banner.interval).toBeGreaterThanOrEqual(2000)
    expect(config.ui.banner.interval).toBeLessThanOrEqual(10000)
    expect(typeof config.ui.banner.autoplay).toBe('boolean')
    expect(typeof config.ui.banner.circular).toBe('boolean')
  })

  test('消息列表 pageSize 在合理范围', () => {
    expect(config.ui.message.pageSize).toBeGreaterThanOrEqual(5)
    expect(config.ui.message.pageSize).toBeLessThanOrEqual(50)
  })
})
