// index.js
const api = require('../../utils/api.js')
const storage = require('../../utils/storage.js')
const common = require('../../utils/common.js')

Page({
  data: {
    // 轮播图数据
    bannerList: [],
    unreadCount: 0, // 未读消息数量
    messages: [], // 消息列表
    loading: false, // 加载状态
  },

  // 页面加载时
  onLoad() {
    this.initPage()
  },

  // 页面显示时
  onShow() {
    this.loadMessages()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData()
  },

  // 初始化页面
  async initPage() {
    try {
      this.setData({ loading: true })
      
      // 并行加载数据
      await Promise.all([
        this.loadBanner(),
        this.loadMessages()
      ])
    } catch (error) {
      console.error('初始化页面失败:', error)
      common.showError('加载数据失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 刷新数据
  async refreshData() {
    try {
      await Promise.all([
        this.loadBanner(),
        this.loadMessages()
      ])
      common.showSuccess('刷新成功')
    } catch (error) {
      console.error('刷新数据失败:', error)
      common.showError('刷新失败')
    } finally {
      wx.stopPullDownRefresh()
    }
  },

  // 加载轮播图
  async loadBanner() {
    try {
      // 先尝试从缓存获取
      let bannerList = storage.getBanner()
      
      if (bannerList.length === 0) {
        // 缓存为空，从服务器获取
        const response = await api.system.getBanner()
        bannerList = response.data || []
        
        // 缓存数据
        storage.setBanner(bannerList)
      }

      this.setData({ bannerList })
    } catch (error) {
      console.error('加载轮播图失败:', error)
      // 使用默认轮播图
      this.setData({
        bannerList: [
          {
            title: '健康检测服务',
            desc: '专业医疗级检测服务',
            background: 'linear-gradient(135deg, #4CAF50, #45a049)'
          },
          {
            title: 'AI智能分析',
            desc: '快速准确的智能诊断',
            background: 'linear-gradient(135deg, #2196F3, #1976D2)'
          },
          {
            title: '专业检测报告',
            desc: '详细健康评估报告',
            background: 'linear-gradient(135deg, #FF9800, #F57C00)'
          }
        ]
      })
    }
  },

  // 加载消息列表
  async loadMessages() {
    try {
      // 先尝试从缓存获取
      let messages = storage.getMessages()
      
      if (messages.length === 0) {
        // 缓存为空，从服务器获取
        const response = await api.message.getList({ limit: 10 })
        messages = response.data || []
        
        // 缓存数据
        storage.setMessages(messages)
      }

      this.setData({ messages })
      this.calculateUnreadCount()
    } catch (error) {
      console.error('加载消息失败:', error)
      // 使用默认消息
      this.setData({
        messages: [
          {
            id: 1,
            title: '健康检测新功能上线',
            content: '我们推出了全新的AI智能检测功能，提供更准确的健康分析。支持多种检测模式，检测时间缩短50%，准确率提升至98%。',
            type: 'system',
            time: '2024-07-20 10:30',
            isRead: false,
            priority: 'high'
          },
          {
            id: 2,
            title: '检测报告解读指南',
            content: '为了让您更好地理解检测报告，我们提供了详细的解读指南。包含各项指标的含义、正常值范围、异常情况说明等。',
            type: 'notice',
            time: '2024-07-19 15:20',
            isRead: true,
            priority: 'medium'
          }
        ]
      })
      this.calculateUnreadCount()
    }
  },

  // 计算未读消息数量
  calculateUnreadCount() {
    const unreadCount = this.data.messages.filter(msg => !msg.isRead).length
    this.setData({ unreadCount })
  },

  // 拍照检测
  onPhotoDetection() {
    // 检查登录状态
    if (!storage.isLoggedIn()) {
      common.showError('请先登录')
      return
    }

    wx.navigateTo({
      url: '/pages/create-profile/create-profile'
    })
  },

  // 查看全部消息
  async onViewAll() {
    try {
      const tapIndex = await common.showActionSheet(['全部标记已读', '查看全部消息'])
      
      switch (tapIndex) {
        case 0:
          await this.markAllAsRead()
          break
        case 1:
          wx.navigateTo({
            url: '/pages/message/message'
          })
          break
      }
    } catch (error) {
      console.error('操作失败:', error)
    }
  },

  // 点击消息
  async onMessageTap(e) {
    const index = e.currentTarget.dataset.index
    const message = this.data.messages[index]

    try {
      // 标记消息为已读
      if (!message.isRead) {
        await api.message.markRead(message.id)
        
        const messages = this.data.messages
        messages[index].isRead = true
        this.setData({ messages })
        this.calculateUnreadCount()
        
        // 更新缓存
        storage.setMessages(messages)
      }

      // 跳转到消息详情页面
      wx.navigateTo({
        url: `/pages/message-detail/message-detail?id=${message.id}`
      })
    } catch (error) {
      console.error('标记消息已读失败:', error)
      // 即使标记失败也跳转到详情页
      wx.navigateTo({
        url: `/pages/message-detail/message-detail?id=${message.id}`
      })
    }
  },

  // 全部标记已读
  async markAllAsRead() {
    try {
      await api.message.markAllRead()
      
      const messages = this.data.messages.map(msg => ({ ...msg, isRead: true }))
      this.setData({ messages })
      this.calculateUnreadCount()
      
      // 更新缓存
      storage.setMessages(messages)
      
      common.showSuccess('已全部标记为已读')
    } catch (error) {
      console.error('标记全部已读失败:', error)
      common.showError('操作失败')
    }
  },

  // 清空所有消息
  async clearAllMessages() {
    try {
      const confirmed = await common.showConfirm('确认清空', '确定要清空所有消息吗？此操作不可恢复。')
      
      if (confirmed) {
        // 这里可以调用API删除所有消息
        // await api.message.deleteAll()
        
        this.setData({ messages: [] })
        this.calculateUnreadCount()
        
        // 清空缓存
        storage.setMessages([])
        
        common.showSuccess('消息已清空')
      }
    } catch (error) {
      console.error('清空消息失败:', error)
      common.showError('操作失败')
    }
  },

  // 轮播图点击
  onBannerTap(e) {
    const index = e.currentTarget.dataset.index
    const banner = this.data.bannerList[index]
    
    // 这里可以根据轮播图配置跳转到相应页面
    console.log('点击轮播图:', banner)
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