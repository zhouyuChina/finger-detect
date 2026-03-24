// 微信小程序全局 wx 对象 Mock
// 用内存 Map 模拟 wx 本地存储

const wxStorage = new Map()

global.wx = {
  // ========== 存储 API ==========
  setStorageSync(key, data) {
    wxStorage.set(key, JSON.parse(JSON.stringify(data)))
  },
  getStorageSync(key) {
    const data = wxStorage.get(key)
    return data ? JSON.parse(JSON.stringify(data)) : ''
  },
  removeStorageSync(key) {
    wxStorage.delete(key)
  },
  clearStorageSync() {
    wxStorage.clear()
  },
  getStorageInfoSync() {
    return {
      keys: Array.from(wxStorage.keys()),
      currentSize: wxStorage.size,
      limitSize: 10240
    }
  },

  // ========== 网络请求 API ==========
  request: jest.fn((options) => {
    if (options.success) {
      options.success({ statusCode: 200, data: { success: true, data: {} } })
    }
  }),
  uploadFile: jest.fn((options) => {
    if (options.success) {
      options.success({
        statusCode: 200,
        data: JSON.stringify({ success: true, data: {} })
      })
    }
  }),

  // ========== UI 交互 API ==========
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  showToast: jest.fn(),
  showModal: jest.fn((options) => {
    if (options.success) {
      options.success({ confirm: true, cancel: false })
    }
  }),
  showActionSheet: jest.fn((options) => {
    if (options.success) {
      options.success({ tapIndex: 0 })
    }
  }),

  // ========== 系统信息 API ==========
  getSystemInfo: jest.fn((options) => {
    if (options.success) {
      options.success({
        brand: 'devtools',
        model: 'iPhone 12',
        system: 'iOS 15.0',
        platform: 'devtools',
        SDKVersion: '3.8.12'
      })
    }
  }),
  getNetworkType: jest.fn((options) => {
    if (options.success) {
      options.success({ networkType: 'wifi' })
    }
  }),

  // ========== 用户相关 API ==========
  login: jest.fn((options) => {
    if (options.success) {
      options.success({ code: 'mock_code_123' })
    }
  }),
  getUserProfile: jest.fn(),
  getSetting: jest.fn(),
  getUserInfo: jest.fn(),

  // ========== 导航 API ==========
  navigateTo: jest.fn(),
  redirectTo: jest.fn(),
  switchTab: jest.fn(),
  navigateBack: jest.fn(),

  // ========== 媒体 API ==========
  makePhoneCall: jest.fn(),
  setClipboardData: jest.fn((options) => {
    if (options.success) options.success()
  }),
  getClipboardData: jest.fn((options) => {
    if (options.success) options.success({ data: '' })
  }),
  saveImageToPhotosAlbum: jest.fn((options) => {
    if (options.success) options.success()
  }),
  chooseImage: jest.fn((options) => {
    if (options.success) {
      options.success({ tempFilePaths: ['/tmp/test.jpg'] })
    }
  }),
  previewImage: jest.fn(),
  compressImage: jest.fn((options) => {
    if (options.success) {
      options.success({ tempFilePath: '/tmp/compressed.jpg' })
    }
  }),
  getFileSystemManager: jest.fn(() => ({
    readFile: jest.fn()
  }))
}

// 提供一个工具函数用于在测试间清理 wx storage 和 mock 调用记录
global.resetWxStorage = () => {
  wxStorage.clear()
  Object.keys(global.wx).forEach(key => {
    if (typeof global.wx[key] === 'function' && global.wx[key].mockClear) {
      global.wx[key].mockClear()
    }
  })
}
