// feedback.js
const api = require('../../utils/api.js')

Page({
  data: {
    activeTab: 'message', // 当前激活的标签页：message(留言) / feedback(反馈)
    

    
    // 留言表单数据
    messageContent: '',
    messageTitle: '',
    
    // 反馈板块数据
    feedbacks: [],
    feedbackLoading: false,
    feedbackHasMore: true,
    feedbackPage: 1,
    feedbackLimit: 10,
    
    // 反馈详情弹窗
    showDetailPopup: false,
    currentFeedback: {},
    
    refreshing: false
  },

  onLoad() {
    this.loadFeedbacks(true)
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ refreshing: true })
    
    this.loadFeedbacks(true).then(() => {
      wx.stopPullDownRefresh()
      this.setData({ refreshing: false })
    }).catch(() => {
      wx.stopPullDownRefresh()
      this.setData({ refreshing: false })
    })
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.feedbackHasMore && !this.data.feedbackLoading) {
      this.loadFeedbacks(false)
    }
  },

  // 切换标签页
  onTabChange(e) {
    const activeTab = e.detail.value
    this.setData({ activeTab })
    // 不发送请求，只是切换显示内容
  },



  // 加载反馈列表
  async loadFeedbacks(refresh = false) {
    if (this.data.feedbackLoading) return

    this.setData({ feedbackLoading: true })

    try {
      const page = refresh ? 1 : this.data.feedbackPage
      const params = {
        page: page,
        pageSize: this.data.feedbackLimit
      }

      const res = await api.feedback.getList(params)
      
      if (res.success && res.data) {
        const newFeedbacks = res.data.list || []
        const feedbacks = refresh ? newFeedbacks : [...this.data.feedbacks, ...newFeedbacks]
        
        this.setData({
          feedbacks: feedbacks,
          feedbackPage: page + 1,
          feedbackHasMore: newFeedbacks.length === this.data.feedbackLimit
        })
      } else {
        wx.showToast({
          title: res.message || '获取反馈失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('加载反馈失败:', error)
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      })
    } finally {
      this.setData({ feedbackLoading: false })
    }
  },

  // 留言标题输入
  onMessageTitleInput(e) {
    this.setData({
      messageTitle: e.detail.value
    })
  },

  // 留言内容输入
  onMessageContentInput(e) {
    this.setData({
      messageContent: e.detail.value
    })
  },

  // 提交留言
  async submitMessage() {
    const { messageTitle, messageContent } = this.data
    
    if (!messageTitle.trim()) {
      wx.showToast({
        title: '请输入留言标题',
        icon: 'error'
      })
      return
    }
    
    if (!messageContent.trim()) {
      wx.showToast({
        title: '请输入留言内容',
        icon: 'error'
      })
      return
    }

    wx.showLoading({
      title: '提交中...'
    })

    try {
      const response = await api.feedback.submit({
        type: 'bug', // 统一设为bug类型
        title: messageTitle,
        content: messageContent,
        images: [] // 添加空的图片数组
      })

      if (response.success) {
        wx.showToast({
          title: '反馈提交成功，我们会尽快处理',
          icon: 'success'
        })
        
        // 重置表单
        this.setData({
          messageTitle: '',
          messageContent: ''
        })
        
        // 刷新反馈列表（系统回复）
        this.loadFeedbacks(true)
      } else {
        console.error('提交失败响应:', response)
        wx.showToast({
          title: response.message || '反馈失败，请重新提交',
          icon: 'error'
        })
      }
    } catch (error) {
      console.error('提交留言失败:', error)
      wx.showToast({
        title: '反馈失败，请重新提交',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 点击反馈查看详情
  async onFeedbackClick(e) {
    const feedbackId = e.currentTarget.dataset.id
    
    
    wx.showLoading({
      title: '加载中...'
    })

    try {
      const res = await api.feedback.getDetailByQuery(feedbackId)
      
      
      if (res.success && res.data && res.data.list && res.data.list.length > 0) {
        // 从列表中取第一个匹配的反馈（按ID匹配）
        const feedbackDetail = res.data.list.find(item => item.id === feedbackId) || res.data.list[0]
        
        
        this.setData({
          currentFeedback: feedbackDetail,
          showDetailPopup: true
        })
      } else {
        console.error('获取详情失败:', res)
        wx.showToast({
          title: res.message || '获取反馈详情失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('获取反馈详情失败:', error)
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 反馈详情弹窗变化
  onDetailPopupChange(e) {
    this.setData({
      showDetailPopup: e.detail.visible
    })
  },

  // 关闭详情弹窗
  closeDetailPopup() {
    this.setData({
      showDetailPopup: false,
      currentFeedback: {}
    })
  },

  // 获取反馈类型文本
  getFeedbackTypeText(type) {
    const typeMap = {
      'bug': '问题',
      'suggestion': '建议',
      'complaint': '投诉'
    }
    return typeMap[type] || '未知类型'
  },

  // 获取反馈类型图标
  getFeedbackTypeIcon(type) {
    const iconMap = {
      'bug': 'error-circle',
      'suggestion': 'lightbulb',
      'complaint': 'help-circle'
    }
    return iconMap[type] || 'help-circle'
  },



  // 格式化时间
  formatTime(timeString) {
    if (!timeString) return ''
    
    const date = new Date(timeString)
    const now = new Date()
    const diff = now - date
    
    // 小于1分钟
    if (diff < 60 * 1000) {
      return '刚刚'
    }
    
    // 小于1小时
    if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}分钟前`
    }
    
    // 小于24小时
    if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
    }
    
    // 小于30天
    if (diff < 30 * 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
    }
    
    // 超过30天显示具体日期
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    if (year === now.getFullYear()) {
      return `${month}-${day}`
    } else {
      return `${year}-${month}-${day}`
    }
  }
}) 