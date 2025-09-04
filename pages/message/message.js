// message.js
const api = require('../../utils/api.js')
const storage = require('../../utils/storage.js')
const common = require('../../utils/common.js')
const config = require('../../utils/config.js')

Page({
  data: {
    messageList: [],
    loading: false
  },

  onLoad(options) {
    this.loadMessages()
  },

  onShow() {
    // 页面显示时检查并更新Tab栏红点
    this.checkTabBarBadge()
  },

  // 加载消息数据
  async loadMessages() {
    try {
      this.setData({ loading: true })
      
      // 从服务器获取消息数据
      const response = await api.message.getList({ limit: 20 })
      
      let messageData = null
      
      // 处理不同的响应格式（与首页保持一致）
      if (response.success && response.data && response.data.list) {
        // 格式：{success: true, data: {list: [...], pagination: {...}}}
        messageData = response.data.list
      } else if (response.success && response.data) {
        // 格式：{success: true, data: [...]}
        messageData = response.data
      } else if (response.code === 200 && response.data) {
        // 格式：{code: 200, data: [...]}
        messageData = response.data
      } else if (Array.isArray(response)) {
        // 格式：直接返回数组
        messageData = response
      } else {
        console.warn('Message接口返回数据格式错误:', response)
        this.setData({ messageList: [] })
        return
      }
      
      const messageList = this.formatMessageData(messageData)
      
      // 获取阅读状态
      const messageListWithReadStatus = await this.fetchReadStatus(messageList)
      
      this.setData({ messageList: messageListWithReadStatus })
      
      // 缓存数据
      storage.setMessages(messageListWithReadStatus)
    } catch (error) {
      console.error('Message页面加载消息失败:', error)
      this.setData({ messageList: [] })
      common.showError('加载消息失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 格式化消息数据
  formatMessageData(data) {
    
    if (!Array.isArray(data)) {
      console.warn('消息数据不是数组格式:', data)
      return []
    }

    const formattedData = data.map((item, index) => {
      // 处理封面图片URL，如果是相对路径则拼接完整URL
      let image = item.coverImage || item.image || item.img || ''
      if (image && !image.startsWith('http')) {
        // 如果是相对路径，拼接静态资源URL
        const staticUrl = config.getCurrentConfig().staticUrl
        image = staticUrl + image
      }

      // 处理发布时间
      const publishedAt = item.publishedAt || item.createdAt || item.createTime || new Date().toISOString()
      const time = common.formatTime(new Date(publishedAt), 'YYYY-MM-DD')

      // 处理标签和类型
      const tags = item.tags || []
      const types = item.types || []
      const isTop = types.includes('置顶') || item.isTop
      const isImportant = types.includes('重要') || item.isImportant

      return {
        id: item.id || index + 1,
        title: item.title || `消息 ${index + 1}`,
        image: image,
        views: item.readCount || 0,
        time: time,
        summary: item.summary || item.content || item.desc || '',
        author: item.author || '系统',
        category: item.category || '资讯',
        tags: tags,
        types: types,
        isTop: isTop,
        isImportant: isImportant,
        isRead: item.isRead || false,
        publishedAt: publishedAt
      }
    })

    // 排序：置顶 > 重要 > 发布时间倒序
    return formattedData.sort((a, b) => {
      if (a.isTop && !b.isTop) return -1
      if (!a.isTop && b.isTop) return 1
      if (a.isImportant && !b.isImportant) return -1
      if (!a.isImportant && b.isImportant) return 1
      return new Date(b.publishedAt) - new Date(a.publishedAt)
    })
  },

  // 获取阅读状态
  async fetchReadStatus(messageList) {
    try {
      // 检查用户是否已登录
      const storage = require('../../utils/storage.js')
      const userInfo = storage.getUserInfo()
      const openId = storage.getOpenId()
      
      if (!userInfo || !openId) {
        // 未登录用户，跳过阅读状态获取，并将所有消息标记为已读（不显示未读状态）
        return messageList.map(message => ({
          ...message,
          isRead: true // 未登录用户不显示未读状态
        }))
      }
      
      // 获取所有消息ID
      const articleIds = messageList.map(item => item.id)
      
      if (articleIds.length === 0) {
        return messageList
      }
      
      // 从服务器获取阅读状态
      const response = await api.message.getReadStatus(articleIds)
      
      if (response.success && response.data) {
        const readStatusMap = {}
        
        // 构建阅读状态映射
        if (Array.isArray(response.data)) {
          response.data.forEach(item => {
            readStatusMap[item.articleId || item.id] = {
              isRead: item.isRead || false,
              readAt: item.readAt
            }
          })
        }
        
        // 合并阅读状态到消息列表
        return messageList.map(message => ({
          ...message,
          isRead: readStatusMap[message.id]?.isRead || message.isRead || false,
          readAt: readStatusMap[message.id]?.readAt || message.readAt
        }))
      } else {
        console.warn('获取阅读状态失败:', response)
        return messageList
      }
    } catch (error) {
      console.error('获取阅读状态失败:', error)
      return messageList
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    try {
      await this.loadMessages()
      common.showSuccess('刷新成功')
    } catch (error) {
      console.error('刷新失败:', error)
      common.showError('刷新失败')
    } finally {
      wx.stopPullDownRefresh()
    }
  },

  // 上拉加载更多
  onReachBottom() {
    wx.showToast({
      title: '没有更多数据了',
      icon: 'none'
    })
  },



  // 消息点击
  async onMessageClick(e) {
    const { id } = e.currentTarget.dataset
    const messageIndex = this.data.messageList.findIndex(item => item.id === id)
    const message = this.data.messageList[messageIndex]
    
    if (message) {
      try {
        // 检查用户是否已登录
        const storage = require('../../utils/storage.js')
        const userInfo = storage.getUserInfo()
        const openId = storage.getOpenId()
        
        // 标记资讯为已读（仅限已登录用户）
        if (!message.isRead && userInfo && openId) {
          await api.message.markArticleRead(message.id)
          
          // 更新本地数据
          const messageList = [...this.data.messageList]
          messageList[messageIndex].isRead = true
          messageList[messageIndex].readAt = new Date().toISOString()
          this.setData({ messageList })
          
          // 更新缓存
          storage.setMessages(messageList)
          
          
          // 更新Tab栏红点
          this.checkTabBarBadge()
        } else if (!userInfo || !openId) {
        }

        // 跳转到消息详情页面
        wx.navigateTo({
          url: `/pages/message-detail/message-detail?id=${id}`
        })
      } catch (error) {
        console.error('标记资讯已读失败:', error)
        // 即使标记失败也跳转到详情页
        wx.navigateTo({
          url: `/pages/message-detail/message-detail?id=${id}`
        })
      }
    }
  },

  // 检查并更新Tab栏红点
  checkTabBarBadge() {
    const app = getApp()
    if (app && typeof app.checkAndUpdateTabBarBadge === 'function') {
      app.checkAndUpdateTabBarBadge()
    }
  }


}) 