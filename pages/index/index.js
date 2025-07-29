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
      // 从服务器获取banner数据
      const response = await api.system.getBanner()
      console.log('Banner接口响应:', response)
      
      // 处理接口返回的数据
      if (response.code === 200 && response.data) {
        const bannerList = this.formatBannerData(response.data)
        this.setData({ bannerList })
        // 缓存数据
        storage.setBanner(bannerList)
      } else {
        console.warn('Banner接口返回数据格式错误:', response)
        this.setData({ bannerList: [] })
      }
    } catch (error) {
      console.error('加载轮播图失败:', error)
      this.setData({ bannerList: [] })
    }
  },

  // 格式化Banner数据
  formatBannerData(data) {
    if (!Array.isArray(data)) {
      console.warn('Banner数据不是数组格式:', data)
      return []
    }

    return data.map((item, index) => {
      // 根据接口返回的数据结构进行适配
      return {
        id: item.id || index + 1,
        title: item.title || item.name || `Banner ${index + 1}`,
        desc: item.description || item.desc || item.subtitle || '',
        imageUrl: item.imageUrl || item.image || item.img || '',
        linkUrl: item.linkUrl || item.link || item.url || '',
        background: item.background || item.bgColor || this.getDefaultBackground(index),
        sort: item.sort || item.order || index,
        status: item.status || 1,
        createTime: item.createTime || item.createdAt || new Date().toISOString()
      }
    }).sort((a, b) => a.sort - b.sort) // 按排序字段排序
  },

  // 获取默认背景色
  getDefaultBackground(index) {
    const backgrounds = [
      'linear-gradient(135deg, #4CAF50, #45a049)',
      'linear-gradient(135deg, #2196F3, #1976D2)',
      'linear-gradient(135deg, #FF9800, #F57C00)',
      'linear-gradient(135deg, #9C27B0, #7B1FA2)',
      'linear-gradient(135deg, #E91E63, #C2185B)'
    ]
    return backgrounds[index % backgrounds.length]
  },

  // 加载消息列表
  async loadMessages() {
    try {
      // 从服务器获取消息数据
      const response = await api.message.getList({ limit: 10 })
      console.log('消息接口响应:', response)
      
      if (response.code === 200 && response.data) {
        const messages = response.data
        this.setData({ messages })
        this.calculateUnreadCount()
        // 缓存数据
        storage.setMessages(messages)
      } else {
        console.warn('消息接口返回数据格式错误:', response)
        this.setData({ messages: [] })
        this.calculateUnreadCount()
      }
    } catch (error) {
      console.error('加载消息失败:', error)
      this.setData({ messages: [] })
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
    
    console.log('点击轮播图:', banner)
    
    // 处理轮播图点击跳转
    if (banner.linkUrl) {
      // 如果是外部链接
      if (banner.linkUrl.startsWith('http')) {
        // 复制链接到剪贴板
        wx.setClipboardData({
          data: banner.linkUrl,
          success: () => {
            common.showSuccess('链接已复制到剪贴板')
          }
        })
      } else {
        // 如果是内部页面路径
        wx.navigateTo({
          url: banner.linkUrl,
          fail: (error) => {
            console.error('页面跳转失败:', error)
            common.showError('页面跳转失败')
          }
        })
      }
    } else {
      // 没有链接时显示提示
      common.showToast({
        title: banner.title,
        icon: 'none',
        duration: 2000
      })
    }
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
  },

  // 测试JWT认证（开发阶段使用）
  async testAuth() {
    try {
      const testAuth = require('../../utils/auth-test.js')
      await testAuth.runFullTest()
    } catch (error) {
      console.error('JWT测试失败:', error)
      common.showError('测试失败')
    }
  }
}) 