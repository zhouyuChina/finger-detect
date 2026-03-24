// storage.js 单元测试
// 存储层 — 需要 wx mock

// 因为 storage.js 导出单例，需要在每个 describe 中使用 resetModules 获取干净实例
let storage

beforeEach(() => {
  jest.resetModules()
  resetWxStorage()
  storage = require('../../utils/storage.js')
})

// ============================================================
// 1. 基本 CRUD
// ============================================================
describe('基本 CRUD', () => {
  test('set/get — 存入并读取值', () => {
    storage.set('key1', 'value1')
    expect(storage.get('key1')).toBe('value1')
  })

  test('set/get — 复杂对象', () => {
    const obj = { name: '张三', age: 25, hobbies: ['reading'] }
    storage.set('user', obj)
    expect(storage.get('user')).toEqual(obj)
  })

  test('get — 不存在的 key 返回 defaultValue', () => {
    expect(storage.get('nonexistent')).toBeNull()
    expect(storage.get('nonexistent', 'fallback')).toBe('fallback')
  })

  test('remove — 删除后读取返回 defaultValue', () => {
    storage.set('key1', 'value1')
    storage.remove('key1')
    expect(storage.get('key1')).toBeNull()
  })

  test('clear — 清空所有', () => {
    storage.set('a', 1)
    storage.set('b', 2)
    storage.clear()
    expect(storage.get('a')).toBeNull()
    expect(storage.get('b')).toBeNull()
  })
})

// ============================================================
// 2. 过期逻辑
// ============================================================
describe('过期逻辑', () => {
  test('未过期数据可以正常读取', () => {
    storage.set('key1', 'value1', 60000) // 1 分钟
    expect(storage.get('key1')).toBe('value1')
  })

  test('过期数据返回 defaultValue', () => {
    storage.set('key1', 'value1', 1000) // 1 秒

    // mock Date.now 为 2 秒后
    const originalNow = Date.now
    Date.now = jest.fn(() => originalNow() + 2000)

    expect(storage.get('key1')).toBeNull()

    Date.now = originalNow
  })

  test('无 expireTime 默认 24 小时过期', () => {
    storage.set('key1', 'value1')

    // mock Date.now 为 25 小时后
    const originalNow = Date.now
    Date.now = jest.fn(() => originalNow() + 25 * 60 * 60 * 1000)

    expect(storage.get('key1')).toBeNull()

    Date.now = originalNow
  })

  test('isExpired — null data 返回 true', () => {
    expect(storage.isExpired(null)).toBe(true)
    expect(storage.isExpired(undefined)).toBe(true)
  })
})

// ============================================================
// 3. Token 管理
// ============================================================
describe('Token 管理', () => {
  test('setToken/getToken', () => {
    storage.setToken('abc123')
    expect(storage.getToken()).toBe('abc123')
  })

  test('setRefreshToken/getRefreshToken', () => {
    storage.setRefreshToken('refresh_abc')
    expect(storage.getRefreshToken()).toBe('refresh_abc')
  })

  test('token 未设置时返回 null', () => {
    expect(storage.getToken()).toBeNull()
  })
})

// ============================================================
// 4. 用户信息
// ============================================================
describe('用户信息', () => {
  test('setUserInfo/getUserInfo', () => {
    const userInfo = { name: '张三', gender: 1 }
    storage.setUserInfo(userInfo)
    expect(storage.getUserInfo()).toEqual(userInfo)
  })

  test('用户信息过期后返回 null', () => {
    storage.setUserInfo({ name: '张三' })

    const originalNow = Date.now
    // 设为 31 天后（userInfo 过期时间为 30 天）
    Date.now = jest.fn(() => originalNow() + 31 * 24 * 60 * 60 * 1000)

    expect(storage.getUserInfo()).toBeNull()

    Date.now = originalNow
  })

  test('未设置用户信息返回 null', () => {
    expect(storage.getUserInfo()).toBeNull()
  })
})

// ============================================================
// 5. OpenId 管理
// ============================================================
describe('OpenId 管理', () => {
  test('setOpenId/getOpenId', () => {
    storage.setOpenId('o_123456')
    expect(storage.getOpenId()).toBe('o_123456')
  })

  test('【安全】getOpenId 对字符串 "undefined" 返回 null', () => {
    storage.set('openId', 'undefined', 30 * 24 * 60 * 60 * 1000)
    expect(storage.getOpenId()).toBeNull()
  })

  test('【安全】getOpenId 对字符串 "null" 返回 null', () => {
    storage.set('openId', 'null', 30 * 24 * 60 * 60 * 1000)
    expect(storage.getOpenId()).toBeNull()
  })

  test('openId 30天后过期', () => {
    storage.setOpenId('o_123456')

    const originalNow = Date.now
    Date.now = jest.fn(() => originalNow() + 31 * 24 * 60 * 60 * 1000)

    expect(storage.getOpenId()).toBeNull()

    Date.now = originalNow
  })
})

// ============================================================
// 6. 登录状态检查
// ============================================================
describe('登录状态检查', () => {
  test('isLoggedIn — 有 token 时返回 true', () => {
    storage.setToken('abc123')
    expect(storage.isLoggedIn()).toBe(true)
  })

  test('isLoggedIn — 无 token 时返回 false', () => {
    expect(storage.isLoggedIn()).toBe(false)
  })

  test('isUserLoggedIn — 同时有 userInfo 和 openId 时返回 true', () => {
    storage.setUserInfo({ name: '张三' })
    storage.setOpenId('o_123')
    expect(storage.isUserLoggedIn()).toBe(true)
  })

  test('isUserLoggedIn — 缺少 userInfo 返回 false', () => {
    storage.setOpenId('o_123')
    expect(storage.isUserLoggedIn()).toBe(false)
  })

  test('isUserLoggedIn — 缺少 openId 返回 false', () => {
    storage.setUserInfo({ name: '张三' })
    expect(storage.isUserLoggedIn()).toBe(false)
  })
})

// ============================================================
// 7. 授权状态检查
// ============================================================
describe('checkAuthStatus', () => {
  test('已登录状态', () => {
    storage.setUserInfo({ name: '张三' })
    storage.setOpenId('o_123')

    const status = storage.checkAuthStatus()
    expect(status.isAuthorized).toBe(true)
    expect(status.hasUserInfo).toBe(true)
    expect(status.hasOpenId).toBe(true)
  })

  test('未登录状态', () => {
    const status = storage.checkAuthStatus()
    expect(status.isAuthorized).toBe(false)
    expect(status.hasUserInfo).toBe(false)
    expect(status.hasOpenId).toBe(false)
  })
})

// ============================================================
// 8. 用户信息完整性检查
// ============================================================
describe('isUserInfoComplete', () => {
  test('无用户信息 → false', () => {
    expect(storage.isUserInfoComplete()).toBe(false)
  })

  test('完整信息 → true', () => {
    storage.setUserInfo({
      currentSubUser: {
        gender: 1,
        age: 25,
        address: '北京市朝阳区'
      }
    })
    expect(storage.isUserInfoComplete()).toBe(true)
  })

  test('缺少 gender → false', () => {
    storage.setUserInfo({
      currentSubUser: {
        age: 25,
        address: '北京'
      }
    })
    expect(storage.isUserInfoComplete()).toBe(false)
  })

  test('缺少 age → false', () => {
    storage.setUserInfo({
      currentSubUser: {
        gender: 1,
        address: '北京'
      }
    })
    expect(storage.isUserInfoComplete()).toBe(false)
  })

  test('缺少 address → false', () => {
    storage.setUserInfo({
      currentSubUser: {
        gender: 1,
        age: 25
      }
    })
    expect(storage.isUserInfoComplete()).toBe(false)
  })

  test('gender 为 0（未知）→ false', () => {
    storage.setUserInfo({
      currentSubUser: {
        gender: 0,
        age: 25,
        address: '北京'
      }
    })
    expect(storage.isUserInfoComplete()).toBe(false)
  })

  test('无 currentSubUser → 返回 falsy（当前实现未返回明确的 false）', () => {
    storage.setUserInfo({ name: '张三' })
    // 当前实现中 hasGender/hasAge/hasAddress 都依赖 currentSubUser
    // 没有 currentSubUser 时 userInfo.currentSubUser 为 undefined
    // && 短路返回 undefined (falsy)，而非 false
    expect(storage.isUserInfoComplete()).toBeFalsy()
  })
})

// ============================================================
// 9. getMissingUserInfoFields
// ============================================================
describe('getMissingUserInfoFields', () => {
  test('无用户信息 → 返回所有必填字段', () => {
    const missing = storage.getMissingUserInfoFields()
    expect(missing).toContain('gender')
    expect(missing).toContain('birthYear')
    expect(missing).toContain('province')
    expect(missing).toContain('city')
  })

  test('有完整用户信息 → 返回空数组', () => {
    storage.setUserInfo({
      gender: 1,
      birthYear: 1990,
      province: '北京',
      city: '北京'
    })
    const missing = storage.getMissingUserInfoFields()
    expect(missing).toEqual([])
  })
})

// ============================================================
// 10. 缓存一致性
// ============================================================
describe('缓存一致性', () => {
  test('set 同时写入内存和 wx 存储', () => {
    storage.set('test', 'value')

    // 验证 wx 存储也有数据
    const wxData = wx.getStorageSync('test')
    expect(wxData.value).toBe('value')
  })

  test('内存缓存优先于 wx 存储', () => {
    storage.set('test', 'value1')
    // 直接修改 wx 存储
    wx.setStorageSync('test', { value: 'value2', timestamp: Date.now(), expireTime: null })
    // 内存缓存应该优先
    expect(storage.get('test')).toBe('value1')
  })

  test('内存缓存清空后从 wx 存储回补', () => {
    storage.set('test', 'value1')
    // 清空内存缓存但保留 wx 存储
    storage.cache.clear()
    // 应从 wx 存储读取
    expect(storage.get('test')).toBe('value1')
  })
})

// ============================================================
// 11. 业务缓存方法
// ============================================================
describe('业务缓存方法', () => {
  test('setBanner/getBanner', () => {
    const banners = [{ id: 1, url: '/banner1.jpg' }]
    storage.setBanner(banners)
    expect(storage.getBanner()).toEqual(banners)
  })

  test('getBanner 默认返回空数组', () => {
    expect(storage.getBanner()).toEqual([])
  })

  test('setMessages/getMessages', () => {
    const msgs = [{ id: 1, title: '消息1' }]
    storage.setMessages(msgs)
    expect(storage.getMessages()).toEqual(msgs)
  })

  test('getMessages 默认返回空数组', () => {
    expect(storage.getMessages()).toEqual([])
  })

  test('setSubUsers/getSubUsers', () => {
    const users = [{ id: 1, name: '子用户1' }]
    storage.setSubUsers(users)
    expect(storage.getSubUsers()).toEqual(users)
  })

  test('setCurrentSubUser/getCurrentSubUser', () => {
    const user = { id: 1, name: '当前用户' }
    storage.setCurrentSubUser(user)
    expect(storage.getCurrentSubUser()).toEqual(user)
  })

  test('setArticleDetail/getArticleDetail', () => {
    const detail = { title: '文章标题', content: '内容' }
    storage.setArticleDetail('a1', detail)
    expect(storage.getArticleDetail('a1')).toEqual(detail)
  })
})

// ============================================================
// 12. 清除用户数据
// ============================================================
describe('clearUserData', () => {
  test('清除所有用户相关数据', () => {
    storage.setToken('token')
    storage.setUserInfo({ name: '张三' })
    storage.setOpenId('o_123')

    storage.clearUserData()

    expect(storage.getToken()).toBeNull()
    expect(storage.getUserInfo()).toBeNull()
    expect(storage.getOpenId()).toBeNull()
  })
})

// ============================================================
// 13. Bug: setSystemConfig 参数遮蔽
// ============================================================
describe('Bug: setSystemConfig', () => {
  test('【已修复】参数名不再遮蔽模块级 config，调用正常工作', () => {
    // 修复前：setSystemConfig(config) 参数遮蔽了模块级 config
    // 修复后：参数改名为 systemConfigData，不再冲突
    expect(() => {
      storage.setSystemConfig({ theme: 'dark' })
    }).not.toThrow()

    // 验证数据确实被存储
    const result = storage.getSystemConfig()
    expect(result).toEqual({ theme: 'dark' })
  })
})

// ============================================================
// 14. Bug: clearExpiredData 逻辑错误
// ============================================================
describe('Bug: clearExpiredData', () => {
  test('clearExpiredData 无法清理已过期数据（因为 get 已经返回 null）', () => {
    // 写入一条短过期数据
    storage.set('userInfo', { name: '张三' }, 1000)

    const originalNow = Date.now
    Date.now = jest.fn(() => originalNow() + 2000) // 过期

    // clearExpiredData 内部：
    // const data = this.get(key)   ← get 检测到过期，自动删除并返回 null
    // if (data && this.isExpired(data))  ← data 为 null，跳过
    // 所以 clearExpiredData 的 isExpired 分支永远进不去

    // 但注意：get() 本身已经做了清理
    // 先通过 get 触发清理
    expect(storage.get('userInfo')).toBeNull()

    // 验证 wx 存储中确实也被清了（是 get 清的，不是 clearExpiredData 清的）
    const wxData = wx.getStorageSync('userInfo')
    expect(wxData).toBe('') // wx mock 对不存在的 key 返回 ''

    Date.now = originalNow
  })

  test('对未过期数据调用 clearExpiredData 不会误删', () => {
    storage.set('userInfo', { name: '张三' }, 60000)
    storage.setToken('valid_token')

    storage.clearExpiredData()

    // 未过期的数据应保持
    expect(storage.getUserInfo()).toEqual({ name: '张三' })
    expect(storage.getToken()).toBe('valid_token')
  })
})

// ============================================================
// 15. 存储大小
// ============================================================
describe('getSize / getInfo', () => {
  test('getSize 返回数字', () => {
    expect(typeof storage.getSize()).toBe('number')
  })

  test('getInfo 返回对象', () => {
    const info = storage.getInfo()
    expect(info).toBeDefined()
    expect(info.keys).toBeDefined()
  })
})

// ============================================================
// 16. 授权相关
// ============================================================
describe('授权管理', () => {
  test('getAuthStatusDescription — 已授权', () => {
    storage.setUserInfo({ name: '张三' })
    storage.setOpenId('o_123')
    const desc = storage.getAuthStatusDescription()
    expect(desc).toContain('授权有效')
  })

  test('getAuthStatusDescription — 未授权', () => {
    const desc = storage.getAuthStatusDescription()
    expect(desc).toBe('未授权')
  })

  test('extendAuthValidity — 续期', () => {
    storage.setUserInfo({ name: '张三' })
    storage.setOpenId('o_123')

    // 续期前先确认可以读取
    expect(storage.getUserInfo()).not.toBeNull()

    // 延长有效期
    storage.extendAuthValidity()

    // 续期后仍可读取
    expect(storage.getUserInfo()).not.toBeNull()
    expect(storage.getOpenId()).toBe('o_123')
  })
})
