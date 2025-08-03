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
    console.log('Message页面加载')
    this.loadMessages()
  },

  // 加载消息数据
  async loadMessages() {
    try {
      this.setData({ loading: true })
      
      // 从服务器获取消息数据
      const response = await api.message.getList({ limit: 20 })
      console.log('Message页面消息响应:', response)
      
      if (response.code === 200 && response.data) {
        const messageList = this.formatMessageData(response.data)
        this.setData({ messageList })
        
        // 缓存数据
        storage.setMessages(messageList)
        console.log('Message页面加载成功，消息数量:', messageList.length)
      } else {
        console.warn('Message接口返回数据格式错误:', response)
        this.setData({ messageList: [] })
      }
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
    console.log('Message页面格式化消息数据，输入:', data)
    
    if (!Array.isArray(data)) {
      console.warn('消息数据不是数组格式:', data)
      return []
    }

    return data.map((item, index) => {
      // 处理封面图片URL，如果是相对路径则拼接完整URL
      let image = item.coverImage || item.image || item.img || ''
      if (image && !image.startsWith('http')) {
        // 如果是相对路径，拼接静态资源URL
        const staticUrl = config.getCurrentConfig().staticUrl
        image = staticUrl + image
        console.log('处理消息图片URL:', item.coverImage, '->', image)
      }

      // 处理发布时间
      const publishedAt = item.publishedAt || item.createdAt || item.createTime || new Date().toISOString()
      const time = common.formatTime(new Date(publishedAt), 'YYYY-MM-DD')

      return {
        id: item.id || index + 1,
        title: item.title || `消息 ${index + 1}`,
        image: image,
        views: item.readCount || 0,
        time: time
      }
    })
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
  onMessageClick(e) {
    const { id } = e.currentTarget.dataset
    const message = this.data.messageList.find(item => item.id === id)
    
    if (message) {
      // 跳转到消息详情页面
      wx.navigateTo({
        url: `/pages/message-detail/message-detail?id=${id}`
      })
    }
  },


}) 