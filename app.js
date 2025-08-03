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

      // 不再自动登录，由授权页面处理
      console.log('应用初始化完成，等待用户授权')

    } catch (error) {
      console.error('应用初始化失败:', error)
    }
  },

  // 获取小程序token
  async getAppToken() {
    try {
      const api = require('./utils/api.js')
      await api.user.getToken()
      console.log('应用启动时获取token成功')
    } catch (error) {
      console.error('应用启动时获取token失败:', error)
      // 不阻止应用启动，后续请求时会重试
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
      // 检查localStorage中是否有完整的用户数据
      const token = storage.getToken()
      const userInfo = storage.getUserInfo()
      const openId = storage.getOpenId()
      
      console.log('检查localStorage数据:', {
        hasToken: !!token,
        hasUserInfo: !!userInfo,
        hasOpenId: !!openId
      })
      
      // 只有当localStorage中缺少必要数据时才触发注册
      if (token && userInfo && openId && !token.startsWith('dev_token_')) {
        console.log('localStorage数据完整，使用现有登录状态')
        this.globalData.userInfo = userInfo
        this.globalData.isLoggedIn = true
      } else {
        console.log('localStorage数据不完整，开始注册流程')
        // 清除可能存在的临时数据
        if (token && token.startsWith('dev_token_')) {
          storage.remove('token')
        }
        // 确保清除所有用户相关数据
        storage.clearUserData()
        // 触发微信登录并注册
        await this.wxLoginAndRegister()
      }
    } catch (error) {
      console.error('自动登录失败:', error)
    }
  },

  // 微信登录并自动注册
  async wxLoginAndRegister() {
    try {
      const api = require('./utils/api.js')
      
      // 1. 获取微信登录code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        })
      })

      if (!loginRes.code) {
        throw new Error('获取微信登录code失败')
      }

      console.log('微信登录成功，code:', loginRes.code)

      // 2. 获取用户信息（如果用户授权）
      let userInfo = null
      try {
        const settingRes = await new Promise((resolve, reject) => {
          wx.getSetting({
            success: resolve,
            fail: reject
          })
        })

        if (settingRes.authSetting['scope.userInfo']) {
          const userInfoRes = await new Promise((resolve, reject) => {
            wx.getUserInfo({
              success: resolve,
              fail: reject
            })
          })
          userInfo = userInfoRes.userInfo
        }
      } catch (error) {
        console.log('获取用户信息失败，将使用默认信息:', error)
      }

      // 3. 获取系统信息
      const systemInfo = this.globalData.systemInfo || await common.getSystemInfo()

      // 4. 构建注册数据
      const registerData = {
        code: loginRes.code,
        userInfo: userInfo || {
          nickName: '微信用户',
          avatarUrl: '/images/default-avatar.png',
          gender: 0,
          country: '',
          province: '',
          city: ''
        },
        systemInfo: {
          platform: systemInfo.platform,
          system: systemInfo.system,
          version: systemInfo.version,
          SDKVersion: systemInfo.SDKVersion,
          brand: systemInfo.brand,
          model: systemInfo.model,
          screenWidth: systemInfo.screenWidth,
          screenHeight: systemInfo.screenHeight,
          windowWidth: systemInfo.windowWidth,
          windowHeight: systemInfo.windowHeight,
          pixelRatio: systemInfo.pixelRatio,
          language: systemInfo.language
        },
        registerTime: new Date().toISOString(),
        appVersion: this.globalData.appConfig.version
      }

      console.log('开始注册用户...')
      
      const response = await api.user.miniProgramRegister(registerData)
      
      console.log('注册响应:', response)
      
      if (response.success || response.code === 200) {
        console.log('注册成功，保存用户数据')
        
        // 保存用户信息和token
        const responseData = response.data || response
        console.log('app.js 注册响应数据:', responseData)
        
        if (responseData.token) {
          storage.setToken(responseData.token)
          console.log('app.js 保存token成功')
        }
        if (responseData.userInfo) {
          storage.setUserInfo(responseData.userInfo)
          this.globalData.userInfo = responseData.userInfo
          this.globalData.isLoggedIn = true
          console.log('app.js 保存用户信息成功')
        }
        
        // 保存openId到localStorage（7天过期）
        if (responseData.openId) {
          storage.setOpenId(responseData.openId)
          console.log('app.js 保存openId成功')
        }
        
        // 验证保存的数据
        const savedToken = storage.getToken()
        const savedUserInfo = storage.getUserInfo()
        const savedOpenId = storage.getOpenId()
        console.log('app.js 保存后的数据验证:', {
          token: !!savedToken,
          userInfo: !!savedUserInfo,
          openId: !!savedOpenId
        })
        
        // 显示欢迎信息
        wx.showToast({
          title: '欢迎使用健康检测',
          icon: 'success',
          duration: 2000
        })
      } else {
        console.error('用户注册失败:', response.message)
        // 注册失败不影响应用使用，用户可以在后续操作中手动注册
      }

    } catch (error) {
      console.error('注册失败:', error.message || error)
      
      // 如果是500错误，显示更友好的提示
      if (error.code === 500) {
        wx.showToast({
          title: '服务器暂时不可用，请稍后重试',
          icon: 'none',
          duration: 3000
        })
      }
      
      // 登录失败不影响应用使用
    }
  },

  // 微信登录（保留原方法，用于其他场景）
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
  },

  // 获取openId
  getOpenId() {
    return storage.getOpenId()
  },

  // 检查是否有有效的openId
  hasValidOpenId() {
    return !!storage.getOpenId()
  }
})
