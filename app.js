// app.js
const storage = require('./utils/storage.js')
const common = require('./utils/common.js')
const config = require('./utils/config.js')

App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 初始化应用
    this.initApp()
  },

  // 初始化应用
  async initApp() {
    try {
      // 检查网络状态
      const isConnected = await common.checkNetwork()
      if (!isConnected) {
        common.showError('网络连接失败，请检查网络设置')
      }

      // 获取系统信息
      const systemInfo = await common.getSystemInfo()
      this.globalData.systemInfo = systemInfo

      // 检查更新
      this.checkUpdate()

      // 自动登录
      this.autoLogin()

    } catch (error) {
      console.error('应用初始化失败:', error)
    }
  },

  // 检查更新
  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()

      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(() => {
            wx.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启应用？',
              success: (res) => {
                if (res.confirm) {
                  updateManager.applyUpdate()
                }
              }
            })
          })

          updateManager.onUpdateFailed(() => {
            wx.showModal({
              title: '更新失败',
              content: '新版本下载失败，请检查网络后重试',
              showCancel: false
            })
          })
        }
      })
    }
  },

  // 自动登录
  async autoLogin() {
    try {
      // 检查是否有token
      if (storage.isLoggedIn()) {
        // 验证token有效性
        const userInfo = storage.getUserInfo()
        if (userInfo) {
          this.globalData.userInfo = userInfo
          this.globalData.isLoggedIn = true
        }
      } else {
        // 尝试微信登录
        await this.wxLogin()
      }
    } catch (error) {
      console.error('自动登录失败:', error)
    }
  },

  // 微信登录
  async wxLogin() {
    try {
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        })
      })

      if (loginRes.code) {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log('微信登录成功，code:', loginRes.code)
        // 这里可以调用后端API进行登录
        // const response = await api.user.login({ code: loginRes.code })
        // if (response.code === 200) {
        //   storage.setToken(response.data.token)
        //   storage.setUserInfo(response.data.userInfo)
        //   this.globalData.userInfo = response.data.userInfo
        //   this.globalData.isLoggedIn = true
        // }
      }
    } catch (error) {
      console.error('微信登录失败:', error)
    }
  },

  // 全局错误处理
  onError(error) {
    console.error('应用错误:', error)
    // 这里可以上报错误到服务器
  },

  // 全局未处理的Promise拒绝
  onUnhandledRejection(res) {
    console.error('未处理的Promise拒绝:', res.reason)
    // 这里可以上报错误到服务器
  },

  // 全局数据
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    systemInfo: null,
    // 应用配置
    appConfig: {
      name: '健康检测',
      version: '1.0.0',
      buildNumber: '1',
      // 功能开关
      features: {
        enablePhotoDetection: true,
        enableMessagePush: true,
        enableAutoLogin: true
      }
    }
  },

  // 获取用户信息
  getUserInfo() {
    return this.globalData.userInfo
  },

  // 设置用户信息
  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo
    this.globalData.isLoggedIn = true
    storage.setUserInfo(userInfo)
  },

  // 清除用户信息
  clearUserInfo() {
    this.globalData.userInfo = null
    this.globalData.isLoggedIn = false
    storage.clearUserData()
  },

  // 检查登录状态
  isLoggedIn() {
    return this.globalData.isLoggedIn && storage.isLoggedIn()
  },

  // 获取系统信息
  getSystemInfo() {
    return this.globalData.systemInfo
  },

  // 获取应用配置
  getAppConfig() {
    return this.globalData.appConfig
  },

  // 检查功能是否启用
  isFeatureEnabled(featureName) {
    return this.globalData.appConfig.features[featureName] || false
  }
})
