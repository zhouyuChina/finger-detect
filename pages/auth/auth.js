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
        this.setData({ 
          userInfo: res.userInfo,
          loading: false 
        })
        
        // 将真实的用户信息传递给后端
        this.registerUser(res.userInfo)
      },
      fail: (err) => {
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


      const response = await api.user.miniProgramRegister(registerData)
      
      
      if (response.success || response.code === 200) {
        
        // 保存用户信息（新接口格式）
        const responseData = response.data || response
        
        // 从新接口格式中提取数据
        const user = responseData.user
        if (user) {
          // 保存openId（从user.openid获取）
          if (user.openid) {
            storage.setOpenId(user.openid)
          } else {
            console.warn('响应中没有openid')
          }
          
          // 保存用户信息（使用user对象）
          storage.setUserInfo(user)
          
          // 保存子用户列表
          if (user.subUsers) {
            storage.setSubUsers(user.subUsers)
          }
          
          // 保存当前子用户
          if (user.currentSubUser) {
            storage.setCurrentSubUser(user.currentSubUser)
          }
        } else {
          console.warn('响应中没有user对象')
        }
        
        // 验证保存的数据
        const savedUserInfo = storage.getUserInfo()
        const savedOpenId = storage.getOpenId()
        const savedSubUsers = storage.getSubUsers()
        const savedCurrentSubUser = storage.getCurrentSubUser()
          userInfo: !!savedUserInfo,
          openId: !!savedOpenId,
          subUsers: !!savedSubUsers,
          currentSubUser: !!savedCurrentSubUser
        })
        
        // 如果用户提供了真实信息，调用同步接口
        if (userInfo && userInfo.nickName !== '微信用户') {
          try {
            const syncResponse = await api.user.syncProfile(userInfo)
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

        // 验证数据完整性后再跳转（新接口格式）
        const finalUserInfo = storage.getUserInfo()
        const finalOpenId = storage.getOpenId()
        
        if (finalUserInfo && finalOpenId) {
          // 延迟跳转到首页
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/index/index'
            })
          }, 2000)
        } else {
          console.error('数据保存不完整，无法跳转:', {
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