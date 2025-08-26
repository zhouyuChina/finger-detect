// profile.js
const api = require('../../utils/api.js')
const storage = require('../../utils/storage.js')
const common = require('../../utils/common.js')
const config = require('../../utils/config.js')
const profileDebug = require('../../utils/profile-debug.js')

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
      unreadSystemMessages: 0
    },

    loading: false // 加载状态
  },

  onLoad() {
    console.log('Profile页面加载')
    this.loadUserData()
    
    // 调试模式：自动运行调试
    if (this.data.debugMode) {
      this.debugProfile()
    }
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadUserData()
  },

  // 加载用户数据
  async loadUserData() {
    try {
      this.setData({ loading: true })
      
      // 并行加载用户信息、统计信息、子用户信息、档案信息、未读消息数量和系统消息未读数量
      const [userInfoRes, statsRes, subUsersRes, archivesRes, unreadMessagesRes, unreadSystemMessagesRes] = await Promise.all([
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
      ])

      // 处理用户信息
      if (userInfoRes && userInfoRes.code === 200 && userInfoRes.data) {
        const userInfo = this.formatUserInfo(userInfoRes.data)
        this.setData({ userInfo })
        console.log('用户信息加载成功:', userInfo)
      } else {
        console.log('使用默认用户信息')
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
        unreadSystemMessages: unreadSystemMessagesRes?.data?.unreadCount || 0
      })
      this.setData({ stats })
      console.log('统计信息加载成功:', stats)

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
      unreadSystemMessages: this.ensureNumber(data.unreadSystemMessages) || 0 // 系统消息未读数量
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
      console.log('处理头像URL:', avatarUrl)
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

  // 调试方法
  async debugProfile() {
    try {
      console.log('开始调试个人中心...')
      const result = await profileDebug.debugProfile()
      
      // 显示调试结果
      wx.showModal({
        title: '调试结果',
        content: `Token: ${result.token ? '存在' : '不存在'}\nProfile接口: ${result.profile.success ? '成功' : '失败'}\nStats接口: ${result.stats.success ? '成功' : '失败'}`,
        showCancel: false
      })
    } catch (error) {
      console.error('调试失败:', error)
    }
  }
}) 