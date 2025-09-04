// index.js
const api = require('../../utils/api.js')
const storage = require('../../utils/storage.js')
const common = require('../../utils/common.js')
const config = require('../../utils/config.js')

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
    loading: false // 加载状态
  },

  // 页面加载时
  onLoad() {
    console.log('首页加载')
    this.checkAuthAndInit()
  },

  // 页面显示时
  onShow() {
    // 暂时禁用消息加载，避免404错误影响页面显示
    // this.loadMessages()
    
    // 检查并更新Tab栏红点
    this.checkTabBarBadge()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData()
  },

  // 检查授权并初始化（新接口格式）
  checkAuthAndInit() {
    // 先清除过期的数据
    storage.clearExpiredData()
    
    // 使用新的登录状态检查方法
    const isLoggedIn = storage.isUserLoggedIn()
    const userInfo = storage.getUserInfo()
    const openId = storage.getOpenId()
    
    console.log('index页面检查登录状态:', {
      isLoggedIn: isLoggedIn,
      hasUserInfo: !!userInfo,
      hasOpenId: !!openId,
      userInfo: userInfo ? '有效' : '无效或过期',
      openId: openId ? '有效' : '无效或过期'
    })
    
    // 不再强制跳转授权页面，允许用户正常浏览首页
    // 授权将在用户进行拍照检测时自动处理
    if (isLoggedIn) {
      console.log('index页面用户已登录，初始化页面')
    } else {
      console.log('index页面用户未登录，但允许正常浏览')
      console.log('授权将在用户进行拍照检测时自动处理')
    }
    this.initPage()
  },

   // 测试清除所有用户数据（开发调试用）
  testClearAllUserData() {
    console.log('=== 开始测试清除所有用户数据 ===')
    
    // 获取当前所有存储的键
    try {
      const storageInfo = wx.getStorageInfoSync()
      console.log('当前存储的所有键:', storageInfo.keys)
      
      // 显示当前用户信息
      const userInfo = storage.getUserInfo()
      const openId = storage.getOpenId()
      console.log('清除前的用户信息:', { userInfo, openId })
      
      // 调用app的清除方法
      const app = getApp()
      if (app && app.clearUserInfo) {
        app.clearUserInfo()
        console.log('已调用app.clearUserInfo()')
      }
      
      // 再次检查清除后的状态
      setTimeout(() => {
        const userInfoAfter = storage.getUserInfo()
        const openIdAfter = storage.getOpenId()
        console.log('清除后的用户信息:', { userInfoAfter, openIdAfter })
        
        // 刷新页面数据
        this.setData({
          userInfo: null,
          isLoggedIn: false
        })
        
        console.log('=== 测试清除完成 ===')
      }, 100)
      
    } catch (error) {
      console.error('测试清除失败:', error)
    }
  },

  // 检查当前状态（开发调试用）
  checkCurrentStatus() {
    console.log('=== 检查当前状态 ===')
    
    try {
      // 检查存储状态
      const storageInfo = wx.getStorageInfoSync()
      console.log('存储信息:', storageInfo)
      
      // 检查用户信息
      const userInfo = storage.getUserInfo()
      const openId = storage.getOpenId()
      const token = storage.getToken()
      
      console.log('用户数据状态:', {
        userInfo: userInfo ? '存在' : '不存在',
        openId: openId ? '存在' : '不存在',
        token: token ? '存在' : '不存在'
      })
      
      // 检查app全局数据
      const app = getApp()
      if (app) {
        console.log('App全局数据:', {
          userInfo: app.globalData.userInfo ? '存在' : '不存在',
          isLoggedIn: app.globalData.isLoggedIn
        })
      }
      
      // 检查当前页面数据
      console.log('当前页面数据:', {
        userInfo: this.data.userInfo ? '存在' : '不存在',
        isLoggedIn: this.data.isLoggedIn
      })
      
      // 显示状态信息
      wx.showModal({
        title: '当前状态',
        content: `用户信息: ${userInfo ? '存在' : '不存在'}\nOpenID: ${openId ? '存在' : '不存在'}\nToken: ${token ? '存在' : '不存在'}`,
        showCancel: false
      })
      
    } catch (error) {
      console.error('检查状态失败:', error)
    }
  },

  // 初始化页面
  async initPage() {
    try {
      this.setData({ loading: true })
      
      // 并行加载banner、消息数据和未读数量
      await Promise.all([
        this.loadBanner(),
        this.loadMessages().catch(error => {
          console.warn('消息加载失败，但不影响页面显示:', error)
        }),
        this.fetchUnreadCount().catch(error => {
          console.warn('未读数量获取失败，但不影响页面显示:', error)
        })
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
      // 刷新banner、消息数据和未读数量
      await Promise.all([
        this.loadBanner(),
        this.loadMessages().catch(error => {
          console.warn('消息刷新失败:', error)
        }),
        this.fetchUnreadCount().catch(error => {
          console.warn('未读数量刷新失败:', error)
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
          titlePosition: this.mapPosition(item.position) || 'center', // 映射position字段到titlePosition
          titleColor: item.textColor || item.titleColor || '#ffffff', // 优先使用textColor
          descColor: item.descColor || item.textColor || '#f0f0f0', // 描述颜色，如果没有单独设置则使用textColor
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
          titlePosition: this.mapPosition(item.position) || 'center', // 映射position字段到titlePosition
          titleColor: item.textColor || item.titleColor || '#ffffff', // 优先使用textColor
          descColor: item.descColor || item.textColor || '#f0f0f0', // 描述颜色，如果没有单独设置则使用textColor
          sort: item.sort || item.order || index,
          status: item.status || 1,
          createTime: item.createTime || item.createdAt || new Date().toISOString()
        }
      }).sort((a, b) => a.sort - b.sort)
    }
    
    console.warn('Banner数据格式不支持:', data)
    return []
  },

  // 映射position字段到标准的titlePosition
  mapPosition(position) {
    const positionMap = {
      'top': 'flex-start',
      'middle': 'center', 
      'bottom': 'flex-end'
    }
    return positionMap[position] || 'center'
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
      // 从服务器获取消息数据，只获取置顶信息
      const response = await api.message.getList({ limit: 50, isTop: true })
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

      // 过滤出置顶信息，如果没有置顶信息则显示前5条重要信息
      let topMessages = messages.filter(msg => msg.isTop)
      if (topMessages.length === 0) {
        topMessages = messages.filter(msg => msg.isImportant).slice(0, 5)
        console.log('没有置顶信息，显示重要信息数量:', topMessages.length)
      } else {
        console.log('首页显示置顶信息数量:', topMessages.length)
      }

      // 获取阅读状态
      try {
        // 提取文章ID列表
        const articleIds = topMessages.map(msg => msg.id)
        console.log('获取阅读状态，文章ID列表:', articleIds)
        
        if (articleIds.length > 0) {
          const readStatusResponse = await api.message.getReadStatus(articleIds)
          console.log('阅读状态接口响应:', readStatusResponse)
          
          if (readStatusResponse.success && readStatusResponse.data) {
            // 合并阅读状态到消息数据
            const messagesWithReadStatus = this.mergeReadStatus(topMessages, readStatusResponse.data)
            this.setData({ messages: messagesWithReadStatus })
          } else {
            this.setData({ messages: topMessages })
          }
        } else {
          this.setData({ messages: topMessages })
        }
      } catch (readError) {
        console.warn('获取阅读状态失败，使用默认状态:', readError)
        // 阅读状态获取失败不影响消息显示
        this.setData({ messages: topMessages })
      }

      this.calculateUnreadCount()
      // 缓存数据
      storage.setMessages(topMessages)
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
    console.log('未读消息数量:', unreadCount)
  },

  // 从服务器获取未读数量
  async fetchUnreadCount() {
    try {
      const response = await api.message.getUnreadCount()
      console.log('未读数量接口响应:', response)
      
      if (response.success && response.data) {
        const { unreadCount, totalArticles, readArticles } = response.data
        this.setData({ 
          unreadCount: unreadCount || 0,
          totalArticles: totalArticles || 0,
          readArticles: readArticles || 0
        })
        console.log('服务器未读数量:', unreadCount, '总数:', totalArticles, '已读:', readArticles)
      }
    } catch (error) {
      console.warn('获取未读数量失败，使用本地计算:', error)
      // 失败时使用本地计算
      this.calculateUnreadCount()
    }
  },

  // 拍照检测
  async onPhotoDetection() {
    // 检查用户是否已登录
    const userInfo = storage.getUserInfo()
    const openId = storage.getOpenId()
    
    if (!userInfo || !openId) {
      // 未登录用户，跳转到拍照检测页面，由该页面处理授权
      console.log('未登录用户，跳转到拍照检测页面进行授权')
      wx.navigateTo({
        url: '/pages/photo-detection/photo-detection'
      })
      return
    }

    // 已登录用户，检查用户信息是否完整
    if (!storage.isUserInfoComplete()) {
      console.log('用户信息不完整，需要完善信息')
      const missingFields = storage.getMissingUserInfoFields()
      console.log('缺失的字段:', missingFields)
      
      // 显示提示信息
      const result = await common.showConfirm(
        '完善个人信息', 
        '检测到您的个人信息不完整（性别、年龄、地址），需要先完善信息才能进行检测。是否现在完善？'
      )
      
      if (result) {
        // 跳转到完善信息页面
        wx.navigateTo({
          url: '/pages/create-profile/create-profile?mode=complete'
        })
      }
      return
    }

    // 用户信息完整，跳转到档案选择页面
    console.log('用户信息完整，跳转到档案选择页面')
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

      // 调用一键已读接口
      const response = await api.message.markAllRead()
      console.log('一键已读响应:', response)
      
      if (response.success && response.data) {
        const { markedCount, message } = response.data
        
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
        
        common.showSuccess(message || `已标记 ${markedCount} 条消息为已读`)
      } else {
        throw new Error(response.message || '标记已读失败')
      }
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







  // 检查并更新Tab栏红点
  checkTabBarBadge() {
    const app = getApp()
    if (app && typeof app.checkAndUpdateTabBarBadge === 'function') {
      app.checkAndUpdateTabBarBadge()
    }
  }
}) 