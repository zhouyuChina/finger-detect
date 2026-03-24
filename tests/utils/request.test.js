// request.js 单元测试
// HTTP 请求层 — 需要 wx mock + storage mock

let request
let storage

beforeEach(() => {
  jest.resetModules()
  resetWxStorage()
  storage = require('../../utils/storage.js')
  request = require('../../utils/request.js')
})

// ============================================================
// 1. getHeaders — 请求头构造
// ============================================================
describe('getHeaders', () => {
  test('默认包含 Content-Type', () => {
    const headers = request.getHeaders()
    expect(headers['Content-Type']).toBe('application/json')
  })

  test('有 token 时包含 Authorization', () => {
    storage.setToken('test_token')
    const headers = request.getHeaders()
    expect(headers['Authorization']).toBe('Bearer test_token')
  })

  test('无 token 时不包含 Authorization', () => {
    const headers = request.getHeaders()
    expect(headers['Authorization']).toBeUndefined()
  })

  test('有 openId 时包含 X-Openid', () => {
    storage.setOpenId('o_123')
    const headers = request.getHeaders()
    expect(headers['X-Openid']).toBe('o_123')
  })

  test('无 openId 时不包含 X-Openid', () => {
    const headers = request.getHeaders()
    expect(headers['X-Openid']).toBeUndefined()
  })

  test('【安全】token 为字符串 "undefined" 时不附加 Authorization', () => {
    storage.set('token', 'undefined')
    const headers = request.getHeaders()
    expect(headers['Authorization']).toBeUndefined()
  })

  test('【安全】token 为字符串 "null" 时不附加 Authorization', () => {
    storage.set('token', 'null')
    const headers = request.getHeaders()
    expect(headers['Authorization']).toBeUndefined()
  })
})

// ============================================================
// 2. hasToken
// ============================================================
describe('hasToken', () => {
  test('有 token 返回 true', () => {
    storage.setToken('abc')
    expect(request.hasToken()).toBe(true)
  })

  test('无 token 返回 false', () => {
    expect(request.hasToken()).toBe(false)
  })
})

// ============================================================
// 3. GET 请求成功
// ============================================================
describe('GET 请求', () => {
  test('成功请求 — success 格式', async () => {
    wx.request.mockImplementation((options) => {
      options.success({
        statusCode: 200,
        data: { success: true, data: { id: 1, name: 'test' }, message: 'ok' }
      })
    })

    storage.setToken('test_token')
    const result = await request.get('/test', {}, { showLoading: false })
    expect(result.success).toBe(true)
    expect(result.data.id).toBe(1)
  })

  test('成功请求 — code 格式', async () => {
    wx.request.mockImplementation((options) => {
      options.success({
        statusCode: 200,
        data: { code: 200, data: { items: [] }, message: 'success' }
      })
    })

    storage.setToken('test_token')
    const result = await request.get('/test', {}, { showLoading: false })
    expect(result.code).toBe(200)
  })
})

// ============================================================
// 4. POST 请求成功
// ============================================================
describe('POST 请求', () => {
  test('成功请求', async () => {
    wx.request.mockImplementation((options) => {
      expect(options.method).toBe('POST')
      options.success({
        statusCode: 200,
        data: { success: true, data: { id: 'new_1' } }
      })
    })

    storage.setToken('test_token')
    const result = await request.post('/test', { name: 'new item' }, { showLoading: false })
    expect(result.success).toBe(true)
    expect(result.data.id).toBe('new_1')
  })
})

// ============================================================
// 5. HTTP 错误处理
// ============================================================
describe('HTTP 错误处理', () => {
  test('500 服务端错误', async () => {
    wx.request.mockImplementation((options) => {
      options.success({
        statusCode: 500,
        data: { message: '服务器错误' }
      })
    })

    storage.setToken('test_token')
    await expect(
      request.get('/test', {}, { showLoading: false, showError: false })
    ).rejects.toEqual(expect.objectContaining({ code: 500 }))
  })

  test('404 资源不存在', async () => {
    wx.request.mockImplementation((options) => {
      options.success({
        statusCode: 404,
        data: { message: '未找到' }
      })
    })

    storage.setToken('test_token')
    await expect(
      request.get('/test', {}, { showLoading: false, showError: false })
    ).rejects.toEqual(expect.objectContaining({ code: 404 }))
  })
})

// ============================================================
// 6. 网络错误与重试
// ============================================================
describe('网络错误与重试', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('网络错误触发重试', async () => {
    let callCount = 0
    wx.request.mockImplementation((options) => {
      callCount++
      if (callCount <= 2) {
        options.fail({ errMsg: 'request:fail net::ERR_CONNECTION_REFUSED' })
      } else {
        options.success({
          statusCode: 200,
          data: { success: true, data: {} }
        })
      }
    })

    storage.setToken('test_token')
    const resultPromise = request.request({
      url: '/test',
      showLoading: false,
      showError: false
    })

    // 推进定时器让重试执行
    await jest.advanceTimersByTimeAsync(1000)
    await jest.advanceTimersByTimeAsync(2000)

    const result = await resultPromise
    expect(result.success).toBe(true)
    expect(callCount).toBe(3)
  })

  test('重试次数耗尽后抛出错误', async () => {
    wx.request.mockImplementation((options) => {
      options.fail({ errMsg: 'request:fail timeout' })
    })

    storage.setToken('test_token')
    const resultPromise = request.request({
      url: '/test',
      showLoading: false,
      showError: false
    })

    // catch 住 promise 防止 unhandled rejection
    const catchPromise = resultPromise.catch(err => err)

    // 推进足够的时间让所有重试完成
    // 重试延迟：1s, 2s, 3s, 4s (retryCount=3, 共 4 次请求)
    for (let i = 0; i < 10; i++) {
      await jest.advanceTimersByTimeAsync(1000)
    }

    const error = await catchPromise
    expect(error.code).toBe(-1)
  })
})

// ============================================================
// 7. Token 管理
// ============================================================
describe('Token 管理', () => {
  test('有 token 时请求头正确附加', async () => {
    storage.setToken('my_token')

    wx.request.mockImplementation((options) => {
      expect(options.header['Authorization']).toBe('Bearer my_token')
      options.success({
        statusCode: 200,
        data: { success: true, data: {} }
      })
    })

    await request.get('/test', {}, { showLoading: false })
  })

  test('needToken: false 跳过 token 检查', async () => {
    // 没有设置 token
    wx.request.mockImplementation((options) => {
      options.success({
        statusCode: 200,
        data: { success: true, data: {} }
      })
    })

    // needToken: false 不应该尝试获取 token
    const result = await request.get('/test', {}, { showLoading: false, needToken: false })
    expect(result.success).toBe(true)
  })
})

// ============================================================
// 8. handleResponse
// ============================================================
describe('handleResponse', () => {
  test('success: true 响应格式', () => {
    return new Promise((resolve, reject) => {
      request.handleResponse(
        { statusCode: 200, data: { success: true, data: { id: 1 } } },
        resolve,
        reject,
        false
      )
    }).then(result => {
      expect(result.success).toBe(true)
      expect(result.data.id).toBe(1)
    })
  })

  test('code: 200 响应格式', () => {
    return new Promise((resolve, reject) => {
      request.handleResponse(
        { statusCode: 200, data: { code: 200, data: { id: 1 } } },
        resolve,
        reject,
        false
      )
    }).then(result => {
      expect(result.code).toBe(200)
    })
  })

  test('业务错误（非 200 code）', () => {
    return new Promise((resolve, reject) => {
      request.handleResponse(
        { statusCode: 200, data: { code: 422, message: '参数错误' } },
        resolve,
        reject,
        false
      )
    }).catch(err => {
      expect(err.code).toBe(422)
    })
  })

  test('HTTP 500 错误', () => {
    return new Promise((resolve, reject) => {
      request.handleResponse(
        { statusCode: 500, data: {} },
        resolve,
        reject,
        false
      )
    }).catch(err => {
      expect(err.code).toBe(500)
    })
  })
})

// ============================================================
// 9. Loading 指示器
// ============================================================
describe('Loading 指示器', () => {
  test('showLoading: true 显示加载', async () => {
    wx.request.mockImplementation((options) => {
      options.success({
        statusCode: 200,
        data: { success: true, data: {} }
      })
    })

    storage.setToken('test_token')
    await request.get('/test', {}, { showLoading: true })
    expect(wx.showLoading).toHaveBeenCalled()
    expect(wx.hideLoading).toHaveBeenCalled()
  })

  test('showLoading: false 不显示加载', async () => {
    wx.request.mockImplementation((options) => {
      options.success({
        statusCode: 200,
        data: { success: true, data: {} }
      })
    })

    storage.setToken('test_token')
    await request.get('/test', {}, { showLoading: false })
    expect(wx.showLoading).not.toHaveBeenCalled()
  })
})

// ============================================================
// 10. Upload 文件上传
// ============================================================
describe('upload', () => {
  test('成功上传', async () => {
    wx.uploadFile.mockImplementation((options) => {
      options.success({
        statusCode: 200,
        data: JSON.stringify({ success: true, data: { url: '/uploaded/file.jpg' } })
      })
    })

    const result = await request.upload('/tmp/photo.jpg', {
      showLoading: false
    })
    expect(result.success).toBe(true)
    expect(result.data.url).toBe('/uploaded/file.jpg')
  })

  test('上传失败 — 网络错误', async () => {
    wx.uploadFile.mockImplementation((options) => {
      options.fail({ errMsg: 'uploadFile:fail timeout' })
    })

    await expect(
      request.upload('/tmp/photo.jpg', { showLoading: false })
    ).rejects.toBeDefined()
  })

  test('上传返回非 JSON 数据', async () => {
    wx.uploadFile.mockImplementation((options) => {
      options.success({
        statusCode: 200,
        data: 'not json'
      })
    })

    await expect(
      request.upload('/tmp/photo.jpg', { showLoading: false })
    ).rejects.toBeDefined()
  })
})

// ============================================================
// 11. handleTokenExpired — 走真实 401 路径
// ============================================================
describe('handleTokenExpired', () => {
  test('首次调用者的 resolve/reject 不在 requestQueue 中，Promise 永远 pending', async () => {
    // 模拟 getToken 成功
    wx.request.mockImplementation((options) => {
      options.success({
        statusCode: 200,
        data: { success: true, data: { token: 'refreshed_token' } }
      })
    })

    // 直接调用 handleTokenExpired，传入我们可以监控的 resolve/reject
    let resolved = false
    let rejected = false
    const promise = new Promise((resolve, reject) => {
      request.handleTokenExpired(
        () => { resolved = true; resolve() },
        (err) => { rejected = true; reject(err) }
      )
    })

    // 给异步流程足够时间完成
    await new Promise(r => setTimeout(r, 50))

    // Bug: handleTokenExpired 成功路径只遍历 requestQueue 调用 resolve()
    // 但首次调用者的 resolve 从未被加入 requestQueue（仅 isRefreshing=true 时才入队）
    // 所以 resolved 仍然是 false
    expect(resolved).toBe(false)
    expect(rejected).toBe(false)

    // token 确实被刷新了
    expect(storage.getToken()).toBe('refreshed_token')
    // isRefreshing 已重置
    expect(request.isRefreshing).toBe(false)
  })

  test('并发调用时第二个调用者被加入 requestQueue，但 resolve 收到空值', async () => {
    let requestCount = 0
    let resolveFirst
    wx.request.mockImplementation((options) => {
      requestCount++
      // 第一次延迟完成，模拟慢请求
      resolveFirst = () => {
        options.success({
          statusCode: 200,
          data: { success: true, data: { token: 'new_token' } }
        })
      }
    })

    // 第一次调用 — 设置 isRefreshing = true
    let firstResolved = false
    request.handleTokenExpired(() => { firstResolved = true }, () => {})

    // 第二次调用 — 应该被加入队列
    let secondResolvedWith = 'NOT_CALLED'
    request.handleTokenExpired(
      (val) => { secondResolvedWith = val },
      () => {}
    )

    expect(request.requestQueue.length).toBe(1)

    // 完成第一次 token 获取
    resolveFirst()
    await new Promise(r => setTimeout(r, 50))

    // 第二个调用者的 resolve 被调用了，但传入的是 undefined（丢失了响应数据）
    expect(secondResolvedWith).toBeUndefined()
    expect(request.requestQueue.length).toBe(0)
  })
})

// ============================================================
// 12. refreshToken — 验证是死代码
// ============================================================
describe('refreshToken 死代码验证', () => {
  test('refreshToken 方法存在，但 handleTokenExpired 从不调用它', () => {
    const spy = jest.spyOn(request, 'refreshToken')

    // 模拟 getToken 成功
    wx.request.mockImplementation((options) => {
      options.success({
        statusCode: 200,
        data: { success: true, data: { token: 'token' } }
      })
    })

    // handleTokenExpired 内部调用的是 this.getToken() 而非 this.refreshToken()
    request.handleTokenExpired(() => {}, () => {})

    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('refreshToken 自身逻辑：无 refreshToken 时 reject', async () => {
    await expect(request.refreshToken()).rejects.toBeUndefined()
  })

  test('refreshToken 绕过了 storage 单例，直接用 wx.getStorageSync/setStorageSync', () => {
    // 这证明它跟 storage.js 体系不一致，是遗留代码
    wx.setStorageSync('refreshToken', 'some_refresh_token')

    wx.request.mockImplementation((options) => {
      // 验证它直接从 wx.getStorageSync 读取，而非通过 storage 实例
      expect(options.header['Authorization']).toContain('some_refresh_token')
      options.success({
        statusCode: 200,
        data: { code: 200, data: { token: 'new_t', refreshToken: 'new_rt' } }
      })
    })

    return request.refreshToken().then(() => {
      // 验证它也直接写入 wx.setStorageSync，不经过 storage 实例
      expect(wx.getStorageSync('token')).toBe('new_t')
      expect(wx.getStorageSync('refreshToken')).toBe('new_rt')
    })
  })
})

// ============================================================
// 13. getToken 并发：忙等待轮询的实质性验证
// ============================================================
describe('getToken 并发竞争', () => {
  test('并发调用时第二个调用者进入 setTimeout 100ms 轮询循环', async () => {
    jest.useFakeTimers()

    let resolveTokenRequest
    wx.request.mockImplementation((options) => {
      // 不立即完成，让我们控制时序
      resolveTokenRequest = () => {
        options.success({
          statusCode: 200,
          data: { success: true, data: { token: 'the_token' } }
        })
      }
    })

    // 第一个调用
    const p1 = request.getToken()
    expect(request.isGettingToken).toBe(true)

    // 第二个并发调用 — 应该走 isGettingToken=true 分支
    let p2Resolved = false
    const p2 = request.getToken().then(() => { p2Resolved = true })

    // 此时 p2 内部在用 setTimeout(checkToken, 100) 轮询
    // 推进 100ms — token 还没拿到，p2 仍然 pending
    jest.advanceTimersByTime(100)
    expect(p2Resolved).toBe(false)

    // 完成 token 获取
    resolveTokenRequest()
    await p1

    // p2 的轮询需要再次触发 setTimeout 才能检测到 token 已存在
    jest.advanceTimersByTime(100)
    await Promise.resolve() // flush microtasks
    jest.advanceTimersByTime(100)
    await Promise.resolve()

    jest.useRealTimers()
  })

  test('getToken 失败后 isGettingToken 重置为 false', async () => {
    wx.request.mockImplementation((options) => {
      options.fail({ errMsg: 'request:fail' })
    })

    await request.getToken()
    expect(request.isGettingToken).toBe(false)
  })
})

// ============================================================
// 14. 便捷方法
// ============================================================
describe('便捷方法', () => {
  beforeEach(() => {
    storage.setToken('test_token')
    wx.request.mockImplementation((options) => {
      options.success({
        statusCode: 200,
        data: { success: true, data: {} }
      })
    })
  })

  test('put 方法使用 PUT method', async () => {
    wx.request.mockImplementation((options) => {
      expect(options.method).toBe('PUT')
      options.success({
        statusCode: 200,
        data: { success: true, data: {} }
      })
    })

    await request.put('/test', { name: 'updated' }, { showLoading: false })
  })

  test('delete 方法使用 DELETE method', async () => {
    wx.request.mockImplementation((options) => {
      expect(options.method).toBe('DELETE')
      options.success({
        statusCode: 200,
        data: { success: true, data: {} }
      })
    })

    await request.delete('/test', { id: 1 }, { showLoading: false })
  })
})
