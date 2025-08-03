// auth.js
const api = require('../../utils/api.js')
const storage = require('../../utils/storage.js')
const common = require('../../utils/common.js')

Page({
  data: {
    showAuth: true, // 是否显示授权页面
    loading: false, // 加载状态
    userInfo: null, // 用户信息
    code: '', // 微信登录code
  },

  onLoad() {
    console.log('授权页面加载')
    this.getWxLoginCode()
  },

  // 获取微信登录code
  async getWxLoginCode() {
    try {
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        })
      })

      if (loginRes.code) {
        this.setData({ code: loginRes.code })
        console.log('获取微信登录code成功:', loginRes.code)
      } else {
        console.error('获取微信登录code失败')
        common.showError('获取登录凭证失败')
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      common.showError('微信登录失败')
    }
  },

  // 获取用户信息按钮点击事件
  getUserProfile() {
    if (!this.data.code) {
      common.showError('请先获取登录凭证')
      return
    }

    this.setData({ loading: true })

    wx.getUserProfile({
      desc: '用于完善用户资料和个性化服务', // 声明获取用户个人信息后的用途
      success: (res) => {
        console.log('获取用户信息成功:', res.userInfo)
        this.setData({ 
          userInfo: res.userInfo,
          loading: false 
        })
        
        // 将真实的用户信息传递给后端
        this.registerUser(res.userInfo)
      },
      fail: (err) => {
        console.log('获取用户信息失败:', err)
        this.setData({ loading: false })
        
        // 用户拒绝授权，使用默认信息
        this.registerUser({
          nickName: '微信用户',
          avatarUrl: '/images/default-avatar.png',
          gender: 0,
          country: '',
          province: '',
          city: ''
        })
      }
    })
  },

  // 注册用户
  async registerUser(userInfo) {
    try {
      this.setData({ loading: true })
      
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync()
      
      // 构建注册数据
      const registerData = {
        code: this.data.code,
        userInfo: userInfo,
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
        appVersion: '1.0.0'
      }

      console.log('开始注册用户...')
      console.log('注册数据:', registerData)

      const response = await api.user.miniProgramRegister(registerData)
      
      console.log('注册响应:', response)
      
      if (response.success || response.code === 200) {
        console.log('注册成功，保存用户数据')
        
        // 保存用户信息和token
        const responseData = response.data || response
        console.log('注册响应数据:', responseData)
        
        if (responseData.token) {
          storage.setToken(responseData.token)
          console.log('保存token成功:', responseData.token)
        } else {
          console.warn('响应中没有token')
        }
        
        if (responseData.userInfo) {
          storage.setUserInfo(responseData.userInfo)
          console.log('保存用户信息成功:', responseData.userInfo)
        } else {
          console.warn('响应中没有userInfo')
        }
        
        // 保存openId到localStorage（7天过期）
        if (responseData.openId) {
          storage.setOpenId(responseData.openId)
          console.log('保存openId成功:', responseData.openId)
        } else {
          console.warn('响应中没有openId')
        }
        
        // 验证保存的数据
        const savedToken = storage.getToken()
        const savedUserInfo = storage.getUserInfo()
        const savedOpenId = storage.getOpenId()
        console.log('保存后的数据验证:', {
          token: !!savedToken,
          userInfo: !!savedUserInfo,
          openId: !!savedOpenId
        })
        
        // 如果用户提供了真实信息，调用同步接口
        if (userInfo && userInfo.nickName !== '微信用户') {
          try {
            console.log('调用同步用户信息接口')
            const syncResponse = await api.user.syncProfile(userInfo)
            console.log('同步用户信息响应:', syncResponse.code, syncResponse.message)
          } catch (syncError) {
            console.warn('同步用户信息失败，但不影响使用:', syncError)
          }
        }
        
        // 隐藏授权页面
        this.setData({ showAuth: false })
        
        // 显示欢迎信息
        wx.showToast({
          title: '欢迎使用健康检测',
          icon: 'success',
          duration: 2000
        })

        // 验证数据完整性后再跳转
        const finalToken = storage.getToken()
        const finalUserInfo = storage.getUserInfo()
        const finalOpenId = storage.getOpenId()
        
        if (finalToken && finalUserInfo && finalOpenId) {
          console.log('数据保存完整，准备跳转到首页')
          // 延迟跳转到首页
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/index/index'
            })
          }, 2000)
        } else {
          console.error('数据保存不完整，无法跳转:', {
            token: !!finalToken,
            userInfo: !!finalUserInfo,
            openId: !!finalOpenId
          })
          common.showError('登录数据保存失败，请重试')
        }
        
      } else {
        console.error('用户注册失败:', response.message)
        common.showError('注册失败，请重试')
      }
    } catch (error) {
      console.error('注册失败:', error.message || error)
      common.showError('注册失败，请重试')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 跳过授权（使用默认信息）
  skipAuth() {
    console.log('用户选择跳过授权')
    this.registerUser({
      nickName: '微信用户',
      avatarUrl: '/images/default-avatar.png',
      gender: 0,
      country: '',
      province: '',
      city: ''
    })
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '健康检测小程序',
      path: '/pages/index/index',
      imageUrl: '/images/share.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '健康检测小程序',
      imageUrl: '/images/share.png'
    }
  }
}) 