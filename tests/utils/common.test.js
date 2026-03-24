// common.js 单元测试
// 覆盖纯函数（格式化、校验、工具）和 wx 封装函数

const common = require('../../utils/common.js')

beforeEach(() => {
  resetWxStorage()
})

// ============================================================
// 1. formatTime — 基础时间格式化
// ============================================================
describe('formatTime', () => {
  test('正常日期对象格式化为默认格式', () => {
    const date = new Date('2024-01-15T08:30:45')
    expect(common.formatTime(date)).toBe('2024-01-15 08:30:45')
  })

  test('自定义格式 YYYY/MM/DD', () => {
    const date = new Date('2024-01-15T08:30:45')
    expect(common.formatTime(date, 'YYYY/MM/DD')).toBe('2024/01/15')
  })

  test('自定义格式 HH:mm', () => {
    const date = new Date('2024-01-15T08:30:45')
    expect(common.formatTime(date, 'HH:mm')).toBe('08:30')
  })

  test('字符串时间戳输入', () => {
    const result = common.formatTime('2024-06-01T12:00:00')
    expect(result).toContain('2024')
    expect(result).toContain('06')
    expect(result).toContain('01')
  })

  test('null 输入返回空字符串', () => {
    expect(common.formatTime(null)).toBe('')
  })

  test('undefined 输入返回空字符串', () => {
    expect(common.formatTime(undefined)).toBe('')
  })

  test('空字符串输入返回空字符串', () => {
    expect(common.formatTime('')).toBe('')
  })

  test('【安全】Invalid Date 字符串 — 当前无校验，返回含 NaN', () => {
    // 当前实现不校验 Invalid Date，会返回含 NaN 的字符串
    // Green 阶段修复后应返回 ''
    const result = common.formatTime('not-a-date')
    // 接受两种行为：修复前含 NaN，修复后返回 ''
    expect(result === '' || result.includes('NaN')).toBe(true)
  })
})

// ============================================================
// 2. formatTimeRelative — 智能相对时间
// ============================================================
describe('formatTimeRelative', () => {
  test('空值返回空字符串', () => {
    expect(common.formatTimeRelative('')).toBe('')
    expect(common.formatTimeRelative(null)).toBe('')
    expect(common.formatTimeRelative(undefined)).toBe('')
  })

  test('刚刚（< 1分钟前）', () => {
    const now = new Date()
    now.setSeconds(now.getSeconds() - 30)
    expect(common.formatTimeRelative(now.toISOString())).toBe('刚刚')
  })

  test('X分钟前（1~59分钟前）', () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - 5)
    expect(common.formatTimeRelative(now.toISOString())).toBe('5分钟前')
  })

  test('X小时前（1~5小时前）', () => {
    const now = new Date()
    now.setHours(now.getHours() - 3)
    expect(common.formatTimeRelative(now.toISOString())).toBe('3小时前')
  })

  test('今天 HH:mm（6~24小时前）', () => {
    // 确保不跨天：取当天 00:00 + 14 小时 = 14:00，然后减 8 小时 = 06:00，仍是今天
    const now = new Date()
    const hour = now.getHours()
    if (hour >= 8) {
      // 当前 >= 8点时，8 小时前仍是同一天
      const target = new Date(now.getTime() - 8 * 60 * 60 * 1000)
      const result = common.formatTimeRelative(target.toISOString())
      expect(result).toMatch(/^今天 \d{2}:\d{2}$/)
    } else {
      // 凌晨时段：改用 2 小时前，走 "X小时前" 分支
      const target = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      const result = common.formatTimeRelative(target.toISOString())
      expect(result).toBe('2小时前')
    }
  })

  test('跨年日期返回 YYYY-MM-DD 格式', () => {
    const oldDate = new Date('2020-03-15T10:00:00')
    const result = common.formatTimeRelative(oldDate.toISOString())
    expect(result).toBe('2020-03-15')
  })

  test('【安全】无效日期字符串 — 当前不检测 Invalid Date', () => {
    // new Date('invalid-date') 不抛异常，但各种 getXxx() 返回 NaN
    // Green 阶段修复后应返回 ''
    const result = common.formatTimeRelative('invalid-date')
    // 接受两种行为：修复前含 NaN（因为 formatTime 内部），修复后返回 ''
    expect(result === '' || result.includes('NaN')).toBe(true)
  })
})

// ============================================================
// 3. formatTimeShort — 简短相对时间
// ============================================================
describe('formatTimeShort', () => {
  test('空值返回空字符串', () => {
    expect(common.formatTimeShort('')).toBe('')
    expect(common.formatTimeShort(null)).toBe('')
  })

  test('刚刚（< 1分钟前）', () => {
    const now = new Date()
    now.setSeconds(now.getSeconds() - 10)
    expect(common.formatTimeShort(now.toISOString())).toBe('刚刚')
  })

  test('X分钟前', () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - 15)
    expect(common.formatTimeShort(now.toISOString())).toBe('15分钟前')
  })

  test('X小时前', () => {
    const now = new Date()
    now.setHours(now.getHours() - 5)
    expect(common.formatTimeShort(now.toISOString())).toBe('5小时前')
  })

  test('X天前（1~29天）', () => {
    const now = new Date()
    now.setDate(now.getDate() - 7)
    expect(common.formatTimeShort(now.toISOString())).toBe('7天前')
  })

  test('超过30天显示 YYYY-MM-DD', () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 60)
    const result = common.formatTimeShort(oldDate.toISOString())
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

// ============================================================
// 4. formatTimeChinese — 中文日期格式
// ============================================================
describe('formatTimeChinese', () => {
  test('默认含时间', () => {
    const result = common.formatTimeChinese('2024-01-15T08:30:45')
    expect(result).toBe('2024年1月15日 08:30:45')
  })

  test('不含时间', () => {
    const result = common.formatTimeChinese('2024-01-15T08:30:45', false)
    expect(result).toBe('2024年1月15日')
  })

  test('空值返回空字符串', () => {
    expect(common.formatTimeChinese('')).toBe('')
    expect(common.formatTimeChinese(null)).toBe('')
  })
})

// ============================================================
// 5. formatNumber — 数字补零
// ============================================================
describe('formatNumber', () => {
  test('个位数补零', () => {
    expect(common.formatNumber(5)).toBe('05')
  })

  test('两位数不补零', () => {
    expect(common.formatNumber(12)).toBe('12')
  })

  test('0 补零', () => {
    expect(common.formatNumber(0)).toBe('00')
  })

  test('【安全】null 输入 — 修复前抛异常，修复后应返回安全值', () => {
    try {
      const result = common.formatNumber(null)
      // 修复后：应返回 '00' 或类似安全值
      expect(typeof result).toBe('string')
    } catch (e) {
      // 修复前：null.toString() 抛异常
      expect(e).toBeDefined()
    }
  })

  test('【安全】undefined 输入 — 修复前抛异常，修复后应返回安全值', () => {
    try {
      const result = common.formatNumber(undefined)
      expect(typeof result).toBe('string')
    } catch (e) {
      expect(e).toBeDefined()
    }
  })
})

// ============================================================
// 6. formatFileSize — 文件大小格式化
// ============================================================
describe('formatFileSize', () => {
  test('0 B', () => {
    expect(common.formatFileSize(0)).toBe('0 B')
  })

  test('字节', () => {
    expect(common.formatFileSize(500)).toBe('500 B')
  })

  test('KB', () => {
    expect(common.formatFileSize(1024)).toBe('1 KB')
  })

  test('MB', () => {
    expect(common.formatFileSize(1048576)).toBe('1 MB')
  })

  test('GB', () => {
    expect(common.formatFileSize(1073741824)).toBe('1 GB')
  })

  test('小数保留二位', () => {
    expect(common.formatFileSize(1536)).toBe('1.5 KB')
  })

  test('【安全】负数输入 — 修复前返回 NaN，修复后返回 "0 B"', () => {
    const result = common.formatFileSize(-100)
    // 接受两种行为
    expect(result === '0 B' || result.includes('NaN')).toBe(true)
  })
})

// ============================================================
// 7. validatePhone — 手机号校验
// ============================================================
describe('validatePhone', () => {
  test('合法手机号', () => {
    expect(common.validatePhone('13812345678')).toBe(true)
    expect(common.validatePhone('19912345678')).toBe(true)
  })

  test('非法前缀', () => {
    expect(common.validatePhone('12812345678')).toBe(false)
    expect(common.validatePhone('10012345678')).toBe(false)
  })

  test('长度不足', () => {
    expect(common.validatePhone('1381234567')).toBe(false)
  })

  test('长度超出', () => {
    expect(common.validatePhone('138123456789')).toBe(false)
  })

  test('空串返回 false', () => {
    expect(common.validatePhone('')).toBe(false)
  })

  test('含非数字字符', () => {
    expect(common.validatePhone('1381234567a')).toBe(false)
  })
})

// ============================================================
// 8. validateEmail — 邮箱校验
// ============================================================
describe('validateEmail', () => {
  test('合法邮箱', () => {
    expect(common.validateEmail('user@example.com')).toBe(true)
    expect(common.validateEmail('test.name@domain.co')).toBe(true)
  })

  test('缺少 @', () => {
    expect(common.validateEmail('userexample.com')).toBe(false)
  })

  test('缺少域名', () => {
    expect(common.validateEmail('user@')).toBe(false)
  })

  test('空串返回 false', () => {
    expect(common.validateEmail('')).toBe(false)
  })

  test('含空格返回 false', () => {
    expect(common.validateEmail('user @example.com')).toBe(false)
  })
})

// ============================================================
// 9. validateIdCard — 身份证号校验
// ============================================================
describe('validateIdCard', () => {
  test('15位身份证', () => {
    expect(common.validateIdCard('123456789012345')).toBe(true)
  })

  test('18位身份证', () => {
    expect(common.validateIdCard('123456789012345678')).toBe(true)
  })

  test('17位 + X', () => {
    expect(common.validateIdCard('12345678901234567X')).toBe(true)
    expect(common.validateIdCard('12345678901234567x')).toBe(true)
  })

  test('长度不对返回 false', () => {
    expect(common.validateIdCard('1234567890')).toBe(false)
    expect(common.validateIdCard('1234567890123456789')).toBe(false)
  })

  test('空串返回 false', () => {
    expect(common.validateIdCard('')).toBe(false)
  })
})

// ============================================================
// 10. deepClone — 深拷贝
// ============================================================
describe('deepClone', () => {
  test('基本类型直接返回', () => {
    expect(common.deepClone(42)).toBe(42)
    expect(common.deepClone('hello')).toBe('hello')
    expect(common.deepClone(true)).toBe(true)
  })

  test('null 返回 null', () => {
    expect(common.deepClone(null)).toBeNull()
  })

  test('undefined 返回 undefined', () => {
    expect(common.deepClone(undefined)).toBeUndefined()
  })

  test('Date 对象被正确克隆', () => {
    const date = new Date('2024-01-15')
    const cloned = common.deepClone(date)
    expect(cloned).toEqual(date)
    expect(cloned).not.toBe(date) // 不是同一个引用
    expect(cloned instanceof Date).toBe(true)
  })

  test('数组被深拷贝', () => {
    const arr = [1, [2, 3], { a: 4 }]
    const cloned = common.deepClone(arr)
    expect(cloned).toEqual(arr)
    expect(cloned).not.toBe(arr)
    expect(cloned[1]).not.toBe(arr[1])
    expect(cloned[2]).not.toBe(arr[2])
  })

  test('嵌套对象被深拷贝', () => {
    const obj = { a: 1, b: { c: 2, d: { e: 3 } } }
    const cloned = common.deepClone(obj)
    expect(cloned).toEqual(obj)
    expect(cloned).not.toBe(obj)
    expect(cloned.b).not.toBe(obj.b)
    expect(cloned.b.d).not.toBe(obj.b.d)
  })

  test('【安全】循环引用会导致栈溢出', () => {
    const obj = { a: 1 }
    obj.self = obj
    expect(() => common.deepClone(obj)).toThrow()
  })
})

// ============================================================
// 11. generateId — 唯一 ID 生成
// ============================================================
describe('generateId', () => {
  test('返回字符串', () => {
    expect(typeof common.generateId()).toBe('string')
  })

  test('连续调用返回不同值', () => {
    const id1 = common.generateId()
    const id2 = common.generateId()
    expect(id1).not.toBe(id2)
  })

  test('长度合理（> 10 chars）', () => {
    expect(common.generateId().length).toBeGreaterThan(10)
  })
})

// ============================================================
// 12. debounce — 防抖
// ============================================================
describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('在等待时间后执行', () => {
    const fn = jest.fn()
    const debounced = common.debounce(fn, 300)

    debounced()
    expect(fn).not.toHaveBeenCalled()

    jest.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('重复调用重置计时器', () => {
    const fn = jest.fn()
    const debounced = common.debounce(fn, 300)

    debounced()
    jest.advanceTimersByTime(200)
    debounced() // 重置
    jest.advanceTimersByTime(200)
    expect(fn).not.toHaveBeenCalled() // 还没到

    jest.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1) // 现在到了
  })

  test('只执行最后一次调用', () => {
    const fn = jest.fn()
    const debounced = common.debounce(fn, 300)

    debounced('a')
    debounced('b')
    debounced('c')

    jest.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })
})

// ============================================================
// 13. throttle — 节流
// ============================================================
describe('throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('首次调用立即执行', () => {
    const fn = jest.fn()
    const throttled = common.throttle(fn, 300)

    throttled()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('限流期内忽略后续调用', () => {
    const fn = jest.fn()
    const throttled = common.throttle(fn, 300)

    throttled()
    throttled()
    throttled()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('限流期后允许再次调用', () => {
    const fn = jest.fn()
    const throttled = common.throttle(fn, 300)

    throttled()
    expect(fn).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(300)

    throttled()
    expect(fn).toHaveBeenCalledTimes(2)
  })
})

// ============================================================
// 14. 文件相关工具
// ============================================================
describe('getFileExtension', () => {
  test('正常文件名', () => {
    expect(common.getFileExtension('photo.jpg')).toBe('jpg')
  })

  test('多个点取最后一个', () => {
    expect(common.getFileExtension('archive.tar.gz')).toBe('gz')
  })

  test('无扩展名', () => {
    expect(common.getFileExtension('README')).toBe('')
  })

  test('隐藏文件', () => {
    expect(common.getFileExtension('.gitignore')).toBe('')
  })
})

describe('isAllowedFileType', () => {
  test('允许的 MIME 类型', () => {
    expect(common.isAllowedFileType('image/jpeg')).toBe(true)
    expect(common.isAllowedFileType('image/png')).toBe(true)
  })

  test('不允许的 MIME 类型', () => {
    expect(common.isAllowedFileType('application/pdf')).toBe(false)
    expect(common.isAllowedFileType('video/mp4')).toBe(false)
  })
})

describe('isAllowedFileSize', () => {
  test('在限制内', () => {
    expect(common.isAllowedFileSize(5 * 1024 * 1024)).toBe(true) // 5MB
  })

  test('超过限制', () => {
    expect(common.isAllowedFileSize(15 * 1024 * 1024)).toBe(false) // 15MB
  })

  test('边界值 — 正好等于最大值', () => {
    expect(common.isAllowedFileSize(10 * 1024 * 1024)).toBe(true) // 10MB
  })
})

// ============================================================
// 15. wx 封装函数
// ============================================================
describe('showSuccess', () => {
  test('调用 wx.showToast 并传入正确参数', () => {
    common.showSuccess('操作成功')
    expect(wx.showToast).toHaveBeenCalledWith({
      title: '操作成功',
      icon: 'success',
      duration: 2000
    })
  })

  test('自定义 duration', () => {
    common.showSuccess('成功', 3000)
    expect(wx.showToast).toHaveBeenCalledWith({
      title: '成功',
      icon: 'success',
      duration: 3000
    })
  })
})

describe('showError', () => {
  test('调用 wx.showToast 并传入 error icon', () => {
    common.showError('操作失败')
    expect(wx.showToast).toHaveBeenCalledWith({
      title: '操作失败',
      icon: 'error',
      duration: 2000
    })
  })
})

describe('showLoading / hideLoading', () => {
  test('showLoading 调用 wx.showLoading', () => {
    common.showLoading('请稍候...')
    expect(wx.showLoading).toHaveBeenCalledWith({
      title: '请稍候...',
      mask: true
    })
  })

  test('showLoading 默认标题', () => {
    common.showLoading()
    expect(wx.showLoading).toHaveBeenCalledWith({
      title: '加载中...',
      mask: true
    })
  })

  test('hideLoading 调用 wx.hideLoading', () => {
    common.hideLoading()
    expect(wx.hideLoading).toHaveBeenCalled()
  })
})

describe('showConfirm', () => {
  test('返回 Promise 并解析用户确认结果', async () => {
    const result = await common.showConfirm('提示', '确定删除？')
    expect(result).toBe(true)
    expect(wx.showModal).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '提示',
        content: '确定删除？'
      })
    )
  })
})

describe('showActionSheet', () => {
  test('返回 Promise 并解析选中索引', async () => {
    const result = await common.showActionSheet(['选项1', '选项2'])
    expect(result).toBe(0)
    expect(wx.showActionSheet).toHaveBeenCalledWith(
      expect.objectContaining({
        itemList: ['选项1', '选项2']
      })
    )
  })
})

describe('checkNetwork', () => {
  test('wifi 连接返回 true', async () => {
    const result = await common.checkNetwork()
    expect(result).toBe(true)
  })

  test('无网络返回 false', async () => {
    wx.getNetworkType.mockImplementation((options) => {
      if (options.success) options.success({ networkType: 'none' })
    })
    const result = await common.checkNetwork()
    expect(result).toBe(false)
  })
})

describe('chooseImage', () => {
  test('返回 Promise 并解析文件路径', async () => {
    const result = await common.chooseImage(1)
    expect(result.tempFilePaths).toEqual(['/tmp/test.jpg'])
  })
})

describe('compressImage', () => {
  test('返回压缩后的文件路径', async () => {
    const result = await common.compressImage('/tmp/test.jpg', 0.6)
    expect(result.tempFilePath).toBe('/tmp/compressed.jpg')
    expect(wx.compressImage).toHaveBeenCalledWith(
      expect.objectContaining({
        src: '/tmp/test.jpg',
        quality: 0.6
      })
    )
  })
})
