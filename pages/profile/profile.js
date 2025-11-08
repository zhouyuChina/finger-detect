// profile.js
const api = require('../../utils/api.js')
const storage = require('../../utils/storage.js')
const common = require('../../utils/common.js')
const config = require('../../utils/config.js')


Page({
  data: {
    userInfo: {
      name: '',
      phone: '',
      avatar: '/images/default-avatar.png'
    },
    stats: {
      totalRecords: 0,
      totalReports: 0,
      familyMembers: 0,
      totalDetections: 0,
      unreadMessages: 0,
      unreadSystemMessages: 0,
      unreadFeedback: 0
    },

    loading: false, // 加载状态
    showPermissionPopup: false, // 权限设置弹窗
    cameraPermission: false, // 摄像头权限状态
    locationPermission: false // 地理位置权限状态
  },

  onLoad() {
    this.loadUserData()
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadUserData()
    // 检查并更新Tab栏红点
    this.checkTabBarBadge()
  },

  // 加载用户数据
  async loadUserData() {
    try {
      this.setData({ loading: true })
      
      // 检查用户是否已登录
      const storage = require('../../utils/storage.js')
      const userInfo = storage.getUserInfo()
      const openId = storage.getOpenId()
      
      if (!userInfo || !openId) {
        this.setData({
          loading: false,
          userInfo: {
            name: '未登录用户',
            phone: '',
            avatar: '/images/default-avatar.png'
          },
          stats: {
            totalRecords: 0,
            totalReports: 0,
            familyMembers: 0,
            totalDetections: 0,
            unreadMessages: 0,
            unreadSystemMessages: 0,
            unreadFeedback: 0
          }
        })
        return
      }
      
      
      // 并行加载用户信息、统计信息、子用户信息、档案信息、未读消息数量和系统消息未读数量（留言反馈未读数量暂时注释）
      const [userInfoRes, statsRes, subUsersRes, archivesRes, unreadMessagesRes, unreadSystemMessagesRes/*, unreadFeedbackRes*/] = await Promise.all([
        api.user.getProfile().catch(error => {
          console.warn('获取用户信息失败:', error)
          return null
        }),
        api.user.getStats().catch(error => {
          console.warn('获取用户统计失败:', error)
          return null
        }),
        api.user.getUsers().catch(error => {
          console.warn('获取子用户列表失败:', error)
          return null
        }),
        api.profile.getAllArchives().catch(error => {
          console.warn('获取档案列表失败:', error)
          return null
        }),
        api.message.getUnreadCount().catch(error => {
          console.warn('获取未读消息数量失败:', error)
          return null
        }),
        api.systemMessages.getUnreadCount().catch(error => {
          console.warn('获取系统消息未读数量失败:', error)
          return null
        })
        // api.feedback.getUnreadCount().catch(error => {
        //   console.warn('获取留言反馈未读数量失败:', error)
        //   return null
        // })
      ])

      // 处理用户信息
      if (userInfoRes && userInfoRes.code === 200 && userInfoRes.data) {
        const userInfo = this.formatUserInfo(userInfoRes.data)
        this.setData({ userInfo })
      } else {
        this.setData({
          userInfo: {
            name: '未登录用户',
            phone: '',
            avatar: '/images/default-avatar.png'
          }
        })
      }

      // 处理统计信息，整合多个接口的数据
      const stats = this.formatStats({
        ...(statsRes?.data || {}),
        subUsers: subUsersRes?.data?.subUsers?.length || 0,
        totalArchives: archivesRes?.data?.totalAll || 0,
        totalDetections: archivesRes?.data?.totalDetections || 0,
        unreadMessages: unreadMessagesRes?.data?.count || unreadMessagesRes?.data || 0,
        unreadSystemMessages: unreadSystemMessagesRes?.data?.unreadCount || 0,
        unreadFeedback: 0 // unreadFeedbackRes?.data?.unreadCount || unreadFeedbackRes?.data?.count || 0
      })
      this.setData({ stats })

    } catch (error) {
      console.error('加载用户数据失败:', error)
      common.showError('加载数据失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 格式化用户信息
  formatUserInfo(data) {
    return {
      name: data.name || data.nickname || data.username || '未设置姓名',
      phone: data.phone ? this.maskPhone(data.phone) : '',
      avatar: this.formatAvatarUrl(data.avatar || data.avatarUrl)
    }
  },

  // 格式化统计信息
  formatStats(data) {
    return {
      totalRecords: this.ensureNumber(data.subUsers || data.totalUsers || data.totalRecords) || 0, // 用户数目（子用户数量）
      totalReports: this.ensureNumber(data.totalArchives || data.totalReports || data.reportRecords) || 0, // 建档记录（档案数量）
      familyMembers: this.ensureNumber(data.totalDetections || data.detectionCount || data.familyMembers) || 0, // 检测记录（检测数量）
      totalDetections: this.ensureNumber(data.totalDetections || data.detectionCount) || 0, // 保留原有字段，用于其他功能
      unreadMessages: this.ensureNumber(data.unreadMessages || data.unreadCount) || 0, // 未读消息数量
      unreadSystemMessages: this.ensureNumber(data.unreadSystemMessages) || 0, // 系统消息未读数量
      unreadFeedback: this.ensureNumber(data.unreadFeedback) || 0 // 留言反馈未读数量
    }
  },

  // 确保返回数字类型
  ensureNumber(value) {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const num = parseInt(value, 10)
      return isNaN(num) ? 0 : num
    }
    if (Array.isArray(value)) return value.length
    if (value && typeof value === 'object') return 0
    return 0
  },

  // 处理头像URL
  formatAvatarUrl(avatarUrl) {
    if (!avatarUrl) {
      return '/images/default-avatar.png'
    }
    
    // 如果是相对路径，添加静态资源基础URL
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      const staticUrl = config.getCurrentConfig().staticUrl
      avatarUrl = staticUrl + avatarUrl
    }
    
    return avatarUrl
  },

  // 手机号脱敏
  maskPhone(phone) {
    if (!phone || phone.length < 7) return phone
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  },

  // 留言反馈
  onFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    });
  },

  // 查看检测记录
  // 查看用户数目（子用户管理）
  onViewRecords() {
    wx.navigateTo({
      url: '/pages/create-profile/create-profile'
    })
  },

  // 查看建档记录（档案列表）
  onViewReports() {
    wx.navigateTo({
      url: '/pages/records-compare/records-compare'
    })
  },

  // 查看检测记录
  onViewFamily() {
    wx.navigateTo({
      url: '/pages/user-records/user-records'
    })
  },

  // 查看检测统计
  onViewPoints() {
    wx.showModal({
      title: '检测统计',
      content: `总检测次数：${this.data.stats.totalDetections}\n\n继续使用我们的服务，获得更多健康数据。`,
      showCancel: false
    })
  },

  // 我的档案
  onMyProfile() {
    wx.navigateTo({
      url: '/pages/my-profile/my-profile'
    })
  },

  // 我的检测记录
  onMyRecords() {
    wx.navigateTo({
      url: '/pages/records/records'
    })
  },

  // 我的优惠券
  onMyCoupons() {
    wx.navigateTo({
      url: '/pages/my-coupons/my-coupons'
    })
  },

  // 系统消息
  onSystemMessages() {
    wx.navigateTo({
      url: '/pages/system-messages/system-messages'
    })
  },

  // 关于我们
  onAboutUs() {
    wx.navigateTo({
      url: '/pages/about/about'
    })
  },

  // 分享有礼
  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '健康检测平台 - 专业AI健康分析',
      path: '/pages/index/index',
      imageUrl: '/images/share-cover.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '健康检测平台 - 专业AI健康分析',
      imageUrl: '/images/share-cover.png'
    }
  },



  // 检查并更新Tab栏红点
  checkTabBarBadge() {
    const app = getApp()
    if (app && typeof app.checkAndUpdateTabBarBadge === 'function') {
      app.checkAndUpdateTabBarBadge()
    }
  },

  // 打开权限设置弹窗
  onPermissionSettings() {
    // 先检查当前权限状态
    this.checkPermissions()
    this.setData({
      showPermissionPopup: true
    })
  },

  // 检查所有权限状态
  async checkPermissions() {
    try {
      const setting = await new Promise((resolve, reject) => {
        wx.getSetting({
          success: resolve,
          fail: reject
        })
      })

      this.setData({
        cameraPermission: setting.authSetting['scope.camera'] === true,
        locationPermission: setting.authSetting['scope.userLocation'] === true
      })

      console.log('权限状态:', {
        camera: this.data.cameraPermission,
        location: this.data.locationPermission
      })
    } catch (error) {
      console.error('检查权限失败:', error)
      wx.showToast({
        title: '检查权限失败',
        icon: 'error'
      })
    }
  },

  // 打开系统设置或请求权限
  async openSystemSettings() {
    // 如果地理位置权限未授权，先尝试触发一次授权请求
    // 这样权限选项才会出现在系统设置中
    if (!this.data.locationPermission) {
      try {
        await new Promise((resolve, reject) => {
          wx.authorize({
            scope: 'scope.userLocation',
            success: resolve,
            fail: reject
          })
        })
        // 如果授权成功，直接更新状态
        this.setData({ locationPermission: true })
        wx.showToast({
          title: '位置权限已开启',
          icon: 'success'
        })
        return
      } catch (error) {
        // 用户拒绝授权，权限选项会出现在设置页面
        console.log('用户拒绝位置授权，引导去设置页面')
      }
    }

    // 打开系统设置页面
    wx.openSetting({
      success: (res) => {
        console.log('打开设置成功:', res.authSetting)
        // 重新检查权限状态
        this.checkPermissions()

        // 检查是否有权限变化
        const hasLocationChanged = res.authSetting['scope.userLocation'] !== this.data.locationPermission
        const hasCameraChanged = res.authSetting['scope.camera'] !== this.data.cameraPermission

        if (hasLocationChanged || hasCameraChanged) {
          wx.showToast({
            title: '权限已更新',
            icon: 'success'
          })
        }
      },
      fail: (error) => {
        console.error('打开设置失败:', error)
        wx.showToast({
          title: '打开设置失败',
          icon: 'error'
        })
      }
    })
  },

  // 关闭权限设置弹窗
  closePermissionPopup() {
    this.setData({
      showPermissionPopup: false
    })
  },

  // 权限弹窗显示状态变化
  onPermissionPopupChange(e) {
    this.setData({
      showPermissionPopup: e.detail.visible
    })
  }
}) 