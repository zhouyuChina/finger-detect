// system-messages.js
const api = require('../../utils/api.js')

Page({
  data: {
    messages: [],
    loading: false,
    hasMore: true,
    page: 1,
    limit: 10,
    showDetailPopup: false,
    currentMessage: {},
    unreadCount: 0,
    refreshing: false
  },

  onLoad() {
    this.loadMessages(true)
    this.loadUnreadCount()
  },

  onShow() {
    // 页面显示时刷新未读数量
    this.loadUnreadCount()
    // 检查并更新Tab栏红点
    this.checkTabBarBadge()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ refreshing: true })
    this.loadMessages(true).then(() => {
      wx.stopPullDownRefresh()
      this.setData({ refreshing: false })
    }).catch(() => {
      wx.stopPullDownRefresh()
      this.setData({ refreshing: false })
    })
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMessages(false)
    }
  },

  // 加载系统消息列表
  async loadMessages(refresh = false) {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const page = refresh ? 1 : this.data.page
      const params = {
        page: page,
        limit: this.data.limit,
        status: 'published'
      }

      const res = await api.systemMessages.getList(params)
      
      if (res.success && res.data) {
        const newMessages = res.data.messages || []
        
        // 保持后端返回的isRead状态，如果没有则默认为false
        const formattedMessages = newMessages.map(msg => ({
          ...msg,
          isRead: msg.isRead !== undefined ? msg.isRead : false
        }))
        
        const messages = refresh ? formattedMessages : [...this.data.messages, ...formattedMessages]
        
        this.setData({
          messages: messages,
          page: page + 1,
          hasMore: formattedMessages.length === this.data.limit
        })
      } else {
        wx.showToast({
          title: res.message || '获取消息失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('加载系统消息失败:', error)
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载未读消息数量
  async loadUnreadCount() {
    try {
      const res = await api.systemMessages.getUnreadCount()
      if (res.success && res.data) {
        this.setData({
          unreadCount: res.data.unreadCount || 0
        })
      }
    } catch (error) {
      console.error('获取未读数量失败:', error)
    }
  },

  // 点击消息
  async onMessageClick(e) {
    const id = e.currentTarget.dataset.id
    const message = this.data.messages.find(msg => msg.id === id)
    
    if (!message) return

    // 显示加载状态
    wx.showLoading({ title: '加载中...' })

    try {
      // 获取消息详情（会自动标记为已读）
      const res = await api.systemMessages.getDetail(id)
      
      if (res.success && res.data) {
        this.setData({
          currentMessage: res.data,
          showDetailPopup: true
        })

        // 更新本地消息状态（因为后端已自动标记为已读）
        this.updateLocalMessageStatus(id)
      } else {
        wx.showToast({
          title: res.message || '获取消息详情失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('获取消息详情失败:', error)
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 更新本地消息状态
  updateLocalMessageStatus(messageId) {
    // 更新本地消息状态
    const messages = this.data.messages.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, isRead: true }
      }
      return msg
    })
    
    this.setData({ messages })
    
    // 更新未读数量
    this.loadUnreadCount()
    console.log('系统消息已标记为已读:', messageId)
    
    // 更新Tab栏红点
    this.checkTabBarBadge()
  },

  // 弹窗状态变化
  onDetailPopupChange(e) {
    this.setData({
      showDetailPopup: e.detail.visible
    })
  },

  // 关闭详情弹窗
  closeDetailPopup() {
    this.setData({
      showDetailPopup: false
    })
  },

  // 处理消息中的操作按钮
  onActionClick(e) {
    const action = e.currentTarget.dataset.action
    
    switch (action.action) {
      case 'goToCoupons':
        wx.navigateTo({
          url: '/pages/my-coupons/my-coupons'
        })
        break
      case 'viewReport':
        wx.navigateTo({
          url: '/pages/detection-result/detection-result'
        })
        break
      case 'changePassword':
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        })
        break
      default:
        wx.showToast({
          title: '功能暂未开放',
          icon: 'none'
        })
    }

    // 关闭弹窗
    this.closeDetailPopup()
  },

  // 获取消息类型文本
  getMessageTypeText(type) {
    const typeMap = {
      'system_notice': '系统通知',
      'activity_announcement': '活动公告',
      'feature_update': '功能更新',
      'maintenance_notice': '维护通知',
      'security_alert': '安全提醒'
    }
    return typeMap[type] || '系统消息'
  },

  // 获取消息图标
  getMessageIcon(type) {
    const iconMap = {
      'system_notice': 'notification',
      'activity_announcement': 'gift',
      'feature_update': 'setting',
      'maintenance_notice': 'wrench',
      'security_alert': 'shield'
    }
    return iconMap[type] || 'notification'
  },

  // 格式化时间
  formatTime(timeStr) {
    if (!timeStr) return ''
    
    const date = new Date(timeStr)
    const now = new Date()
    const diff = now - date
    
    // 小于1分钟
    if (diff < 60 * 1000) {
      return '刚刚'
    }
    // 小于1小时
    if (diff < 60 * 60 * 1000) {
      return Math.floor(diff / (60 * 1000)) + '分钟前'
    }
    // 小于24小时
    if (diff < 24 * 60 * 60 * 1000) {
      return Math.floor(diff / (60 * 60 * 1000)) + '小时前'
    }
    // 小于30天
    if (diff < 30 * 24 * 60 * 60 * 1000) {
      return Math.floor(diff / (24 * 60 * 60 * 1000)) + '天前'
    }
    
    // 超过30天显示具体日期
    return date.toLocaleDateString('zh-CN')
  },

  // 跳转到首页
  goToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  // 检查并更新Tab栏红点
  checkTabBarBadge() {
    const app = getApp()
    if (app && typeof app.checkAndUpdateTabBarBadge === 'function') {
      app.checkAndUpdateTabBarBadge()
    }
  }
}) 