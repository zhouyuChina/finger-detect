// index.js
const api = require('../../utils/api.js')
const storage = require('../../utils/storage.js')
const common = require('../../utils/common.js')
const config = require('../../utils/config.js')
const envDebug = require('../../utils/env-debug.js')
const apiDebug = require('../../utils/api-debug.js')

Page({
  data: {
    // 轮播图数据
    bannerList: [],
    bannerConfig: {
      autoplay: true,
      interval: 3000
    },
    unreadCount: 0, // 未读消息数量
    messages: [], // 消息列表
    loading: false, // 加载状态
    
    // 调试相关
    showDebug: false,
    currentEnv: {
      name: '测试环境',
      apiUrl: 'http://47.76.126.85:4000/api'
    },
    connectionStatus: {
      success: false,
      message: '未测试'
    }
  },

  // 页面加载时
  onLoad() {
    console.log('首页加载')
    this.initPage()
  },

  // 页面显示时
  onShow() {
    // 暂时禁用消息加载，避免404错误影响页面显示
    // this.loadMessages()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData()
  },

  // 初始化页面
  async initPage() {
    try {
      this.setData({ loading: true })
      
      // 直接加载真实的banner数据
      await this.loadBanner()
      
      // 加载消息列表
      await this.loadMessages().catch(error => {
        console.warn('消息加载失败，但不影响页面显示:', error)
      })
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
      // 刷新banner和消息数据
      await Promise.all([
        this.loadBanner(),
        this.loadMessages().catch(error => {
          console.warn('消息刷新失败:', error)
        })
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
      console.log('Banner响应:', response.code, response.message)
      
      // 处理接口返回的数据
      if (response.code === 200 && response.data) {
        const bannerList = this.formatBannerData(response.data)
        const bannerConfig = this.formatBannerConfig(response.data)
        
        console.log('格式化后的bannerList:', bannerList)
        console.log('格式化后的bannerConfig:', bannerConfig)
        
        this.setData({ 
          bannerList,
          bannerConfig
        })
        
        console.log('设置数据后的bannerList长度:', this.data.bannerList.length)
        
        // 缓存数据
        storage.setBanner(bannerList)
        storage.setBannerConfig(bannerConfig)
      } else {
        console.warn('Banner接口返回数据格式错误:', response)
        this.setData({ 
          bannerList: [],
          bannerConfig: { ...config.ui.banner }
        })
      }
    } catch (error) {
      console.error('加载轮播图失败:', error)
      this.setData({ 
        bannerList: [],
        bannerConfig: { ...config.ui.banner }
      })
    }
  },

  // 格式化Banner数据
  formatBannerData(data) {
    console.log('格式化Banner数据，输入:', data)
    
    // 处理新的数据结构：{banners: [...], config: {...}}
    if (typeof data === 'object' && data !== null && data.banners) {
      console.log('检测到banners字段，处理banners数组')
      const banners = data.banners
      
      if (!Array.isArray(banners)) {
        console.warn('banners字段不是数组格式:', banners)
        return []
      }

      return banners.map((item, index) => {
        // 处理图片URL，如果是相对路径则拼接完整URL
        let imageUrl = item.imageUrl || item.image || item.img || ''
        if (imageUrl && !imageUrl.startsWith('http')) {
          // 如果是相对路径，拼接静态资源URL
          const staticUrl = config.getCurrentConfig().staticUrl
          imageUrl = staticUrl + imageUrl
          console.log('处理图片URL:', item.imageUrl, '->', imageUrl)
        }
        
        // 根据接口返回的数据结构进行适配
        return {
          id: item.id || index + 1,
          title: item.title || item.name || `Banner ${index + 1}`,
          desc: item.description || item.desc || item.subtitle || '',
          imageUrl: imageUrl,
          linkUrl: item.linkUrl || item.link || item.url || '',
          background: item.background || item.bgColor || this.getDefaultBackground(index),
          sort: item.sort || item.order || index,
          status: item.status || 1,
          createTime: item.createTime || item.createdAt || new Date().toISOString()
        }
      }).sort((a, b) => a.sort - b.sort) // 按排序字段排序
    }
    
    // 兼容旧的数据结构：直接是数组
    if (Array.isArray(data)) {
      console.log('检测到数组格式，直接处理')
      return data.map((item, index) => {
        // 处理图片URL，如果是相对路径则拼接完整URL
        let imageUrl = item.imageUrl || item.image || item.img || ''
        if (imageUrl && !imageUrl.startsWith('http')) {
          // 如果是相对路径，拼接静态资源URL
          const staticUrl = config.getCurrentConfig().staticUrl
          imageUrl = staticUrl + imageUrl
          console.log('处理图片URL:', item.imageUrl, '->', imageUrl)
        }
        
        return {
          id: item.id || index + 1,
          title: item.title || item.name || `Banner ${index + 1}`,
          desc: item.description || item.desc || item.subtitle || '',
          imageUrl: imageUrl,
          linkUrl: item.linkUrl || item.link || item.url || '',
          background: item.background || item.bgColor || this.getDefaultBackground(index),
          sort: item.sort || item.order || index,
          status: item.status || 1,
          createTime: item.createTime || item.createdAt || new Date().toISOString()
        }
      }).sort((a, b) => a.sort - b.sort)
    }
    
    console.warn('Banner数据格式不支持:', data)
    return []
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

  // 格式化Banner配置
  formatBannerConfig(data) {
    console.log('格式化Banner配置，输入:', data)
    
    // 从配置文件获取默认配置
    const defaultConfig = config.ui.banner
    console.log('配置文件默认配置:', defaultConfig)
    
    // 处理新的数据结构：{banners: [...], config: {...}}
    if (typeof data === 'object' && data !== null && data.config) {
      console.log('检测到config字段，合并接口配置')
      const apiConfig = data.config
      return {
        autoplay: apiConfig.autoplay !== undefined ? apiConfig.autoplay : defaultConfig.autoplay,
        interval: apiConfig.interval || defaultConfig.interval,
        circular: apiConfig.circular !== undefined ? apiConfig.circular : defaultConfig.circular,
        indicatorDots: apiConfig.indicatorDots !== undefined ? apiConfig.indicatorDots : defaultConfig.indicatorDots,
        duration: apiConfig.duration || defaultConfig.duration,
        easingFunction: apiConfig.easingFunction || defaultConfig.easingFunction
      }
    }
    
    // 如果data是数组，尝试从第一个元素获取配置
    if (Array.isArray(data)) {
      console.log('检测到数组格式，从第一个元素获取配置')
      const firstItem = data[0]
      return {
        autoplay: firstItem?.autoplay !== undefined ? firstItem.autoplay : defaultConfig.autoplay,
        interval: firstItem?.interval || defaultConfig.interval,
        circular: firstItem?.circular !== undefined ? firstItem.circular : defaultConfig.circular,
        indicatorDots: firstItem?.indicatorDots !== undefined ? firstItem.indicatorDots : defaultConfig.indicatorDots,
        duration: firstItem?.duration || defaultConfig.duration,
        easingFunction: firstItem?.easingFunction || defaultConfig.easingFunction
      }
    }
    
    // 如果data是对象，可能包含配置信息
    if (typeof data === 'object' && data !== null) {
      console.log('检测到对象格式，合并配置')
      return {
        autoplay: data.autoplay !== undefined ? data.autoplay : defaultConfig.autoplay,
        interval: data.interval || defaultConfig.interval,
        circular: data.circular !== undefined ? data.circular : defaultConfig.circular,
        indicatorDots: data.indicatorDots !== undefined ? data.indicatorDots : defaultConfig.indicatorDots,
        duration: data.duration || defaultConfig.duration,
        easingFunction: data.easingFunction || defaultConfig.easingFunction
      }
    }
    
    console.log('使用配置文件默认配置')
    return { ...defaultConfig }
  },

  // 加载消息列表
  async loadMessages() {
    try {
      // 从服务器获取消息数据
      const response = await api.message.getList({ limit: 10 })
      console.log('消息响应:', response.code, response.message)
      
      let messages = []
      
      if (response.success && response.data && response.data.list) {
        // 处理新的数据结构：{success: true, data: {list: [...], pagination: {...}}}
        messages = this.formatMessageData(response.data.list)
      } else if (response.code === 200 && response.data) {
        // 兼容旧的数据结构
        messages = this.formatMessageData(response.data)
      } else {
        console.warn('消息接口返回数据格式错误:', response)
        this.setData({ messages: [] })
        this.calculateUnreadCount()
        return
      }

      // 获取阅读状态
      try {
        // 提取文章ID列表
        const articleIds = messages.map(msg => msg.id)
        console.log('获取阅读状态，文章ID列表:', articleIds)
        
        const readStatusResponse = await api.message.getReadStatus(articleIds)
        console.log('阅读状态接口响应:', readStatusResponse)
        
        if (readStatusResponse.success && readStatusResponse.data) {
          // 合并阅读状态到消息数据
          messages = this.mergeReadStatus(messages, readStatusResponse.data)
        }
      } catch (readError) {
        console.warn('获取阅读状态失败，使用默认状态:', readError)
        // 阅读状态获取失败不影响消息显示
      }

      this.setData({ messages })
      this.calculateUnreadCount()
      // 缓存数据
      storage.setMessages(messages)
    } catch (error) {
      console.error('加载消息失败:', error)
      this.setData({ messages: [] })
      this.calculateUnreadCount()
    }
  },

  // 格式化消息数据
  formatMessageData(data) {
    console.log('格式化消息数据，输入:', data)
    
    if (!Array.isArray(data)) {
      console.warn('消息数据不是数组格式:', data)
      return []
    }

    return data.map((item, index) => {
      // 处理封面图片URL，如果是相对路径则拼接完整URL
      let coverImage = item.coverImage || item.image || item.img || ''
      if (coverImage && !coverImage.startsWith('http')) {
        // 如果是相对路径，拼接静态资源URL
        const staticUrl = config.getCurrentConfig().staticUrl
        coverImage = staticUrl + coverImage
        console.log('处理消息图片URL:', item.coverImage, '->', coverImage)
      }

      // 处理发布时间
      const publishedAt = item.publishedAt || item.createdAt || item.createTime || new Date().toISOString()
      const publishTime = common.formatTime(new Date(publishedAt), 'MM-DD HH:mm')

      // 处理标签和类型
      const tags = item.tags || []
      const types = item.types || []
      const isTop = types.includes('置顶')
      const isImportant = types.includes('重要')

      return {
        id: item.id || index + 1,
        title: item.title || `消息 ${index + 1}`,
        summary: item.summary || item.content || item.desc || '',
        coverImage: coverImage,
        author: item.author || '系统',
        category: item.category || '资讯',
        tags: tags,
        types: types,
        isTop: isTop,
        isImportant: isImportant,
        readCount: item.readCount || 0,
        isRead: item.isRead || false,
        publishedAt: publishedAt,
        publishTime: publishTime,
        createdAt: item.createdAt || item.createTime || publishedAt
      }
    }).sort((a, b) => {
      // 排序：置顶 > 重要 > 发布时间倒序
      if (a.isTop && !b.isTop) return -1
      if (!a.isTop && b.isTop) return 1
      if (a.isImportant && !b.isImportant) return -1
      if (!a.isImportant && b.isImportant) return 1
      return new Date(b.publishedAt) - new Date(a.publishedAt)
    })
  },

  // 合并阅读状态到消息数据
  mergeReadStatus(messages, readStatusList) {
    console.log('合并阅读状态，消息数量:', messages.length, '阅读状态数量:', readStatusList.length)
    
    if (!Array.isArray(readStatusList)) {
      console.warn('阅读状态数据不是数组格式:', readStatusList)
      return messages
    }

    // 创建阅读状态映射表
    const readStatusMap = {}
    readStatusList.forEach(item => {
      readStatusMap[item.articleId] = {
        isRead: item.isRead,
        readAt: item.readAt
      }
    })

    // 合并阅读状态到消息数据
    return messages.map(message => {
      const readStatus = readStatusMap[message.id]
      if (readStatus) {
        return {
          ...message,
          isRead: readStatus.isRead,
          readAt: readStatus.readAt
        }
      }
      return message
    })
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
      // 标记资讯为已读
      if (!message.isRead) {
        await api.message.markArticleRead(message.id)
        
        const messages = this.data.messages
        messages[index].isRead = true
        messages[index].readAt = new Date().toISOString()
        this.setData({ messages })
        this.calculateUnreadCount()
        
        // 更新缓存
        storage.setMessages(messages)
        
        console.log('标记资讯已读成功:', message.id)
      }

      // 跳转到消息详情页面
      wx.navigateTo({
        url: `/pages/message-detail/message-detail?id=${message.id}`
      })
    } catch (error) {
      console.error('标记资讯已读失败:', error)
      // 即使标记失败也跳转到详情页
      wx.navigateTo({
        url: `/pages/message-detail/message-detail?id=${message.id}`
      })
    }
  },

  // 全部标记已读
  async markAllAsRead() {
    try {
      // 获取所有未读消息的ID
      const unreadMessages = this.data.messages.filter(msg => !msg.isRead)
      
      if (unreadMessages.length === 0) {
        common.showSuccess('没有未读消息')
        return
      }

      // 批量标记已读
      const markPromises = unreadMessages.map(msg => 
        api.message.markArticleRead(msg.id).catch(error => {
          console.warn(`标记消息 ${msg.id} 已读失败:`, error)
          return null
        })
      )

      await Promise.all(markPromises)
      
      // 更新本地状态
      const messages = this.data.messages.map(msg => ({
        ...msg,
        isRead: true,
        readAt: msg.readAt || new Date().toISOString()
      }))
      
      this.setData({ messages })
      this.calculateUnreadCount()
      
      // 更新缓存
      storage.setMessages(messages)
      
      common.showSuccess(`已标记 ${unreadMessages.length} 条消息为已读`)
    } catch (error) {
      console.error('全部标记已读失败:', error)
      common.showError('标记已读失败')
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
  },

  // 调试相关方法
  toggleDebug() {
    this.setData({
      showDebug: !this.data.showDebug
    })
    if (this.data.showDebug) {
      this.updateEnvInfo()
    }
  },

  updateEnvInfo() {
    const envInfo = envDebug.getCurrentEnv()
    this.setData({
      currentEnv: envInfo
    })
  },

  async testConnection() {
    try {
      this.setData({
        'connectionStatus.success': false,
        'connectionStatus.message': '测试中...'
      })
      
      const result = await envDebug.testCurrentEnv()
      
      this.setData({
        connectionStatus: {
          success: result.success,
          message: result.success ? '连接正常' : result.error.errMsg
        }
      })
      
      wx.showToast({
        title: result.success ? '连接成功' : '连接失败',
        icon: result.success ? 'success' : 'error'
      })
    } catch (error) {
      console.error('测试连接失败:', error)
      this.setData({
        connectionStatus: {
          success: false,
          message: '测试失败'
        }
      })
    }
  },

  switchToLocal() {
    envDebug.switchToLocal()
    this.updateEnvInfo()
    wx.showToast({
      title: '已切换到本地环境',
      icon: 'success'
    })
  },

  switchToTest() {
    envDebug.switchToTest()
    this.updateEnvInfo()
    this.updateEnvInfo()
    wx.showToast({
      title: '已切换到测试环境',
      icon: 'success'
    })
  },

  async compareEnvs() {
    try {
      wx.showLoading({ title: '对比中...' })
      await envDebug.compareAllEnvs()
      wx.hideLoading()
      wx.showToast({
        title: '对比完成，查看控制台',
        icon: 'none'
      })
    } catch (error) {
      wx.hideLoading()
      console.error('环境对比失败:', error)
    }
  },

  async compareApis() {
    try {
      wx.showLoading({ title: '对比接口中...' })
      const result = await apiDebug.compareApis()
      wx.hideLoading()
      
      if (result.auth.success && !result.register.success) {
        wx.showToast({
          title: 'Auth成功，Register失败',
          icon: 'none',
          duration: 3000
        })
      } else if (result.auth.success && result.register.success) {
        wx.showToast({
          title: '两个接口都成功',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: '两个接口都失败',
          icon: 'error'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('接口对比失败:', error)
    }
  },

  async testDataFormats() {
    try {
      wx.showLoading({ title: '测试数据格式...' })
      await apiDebug.testDataFormats()
      wx.hideLoading()
      wx.showToast({
        title: '测试完成，查看控制台',
        icon: 'none'
      })
    } catch (error) {
      wx.hideLoading()
      console.error('数据格式测试失败:', error)
    }
  }
}) 