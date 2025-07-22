// index.js
Page({
  data: {
    // 轮播图数据 - 使用背景色
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
    ],

    unreadCount: 0, // 未读消息数量

    // 消息列表
    messages: [
      {
        id: 1,
        title: '健康检测新功能上线',
        content: '我们推出了全新的AI智能检测功能，提供更准确的健康分析。支持多种检测模式，检测时间缩短50%，准确率提升至98%。',
        type: 'system', // system: 系统消息, notice: 通知, tip: 小贴士
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
      },
      {
        id: 3,
        title: '健康生活小贴士',
        content: '定期进行健康检测是保持身体健康的重要方式。建议每半年进行一次全面检测，及时发现潜在健康问题。',
        type: 'tip',
        time: '2024-07-18 09:15',
        isRead: true,
        priority: 'low'
      },
      {
        id: 4,
        title: '检测流程优化通知',
        content: '我们对检测流程进行了全面优化，现在检测时间更短，结果更准确，体验更流畅。新流程已上线，欢迎体验。',
        type: 'notice',
        time: '2024-07-17 14:45',
        isRead: false,
        priority: 'medium'
      },
      {
        id: 5,
        title: '用户反馈收集',
        content: '为了更好地服务用户，我们正在收集用户反馈。您的建议对我们非常重要，参与反馈可获得积分奖励。',
        type: 'system',
        time: '2024-07-16 11:30',
        isRead: true,
        priority: 'low'
      }
    ],
  },

  // 页面加载时计算未读消息数量
  onLoad() {
    this.calculateUnreadCount()
  },

  // 计算未读消息数量
  calculateUnreadCount() {
    const unreadCount = this.data.messages.filter(msg => !msg.isRead).length
    this.setData({
      unreadCount: unreadCount
    })
  },

  // 拍照检测
  onPhotoDetection() {
    wx.navigateTo({
      url: '/pages/create-profile/create-profile'
    })
  },

  // 查看全部消息
  onViewAll() {
    wx.showActionSheet({
      itemList: ['全部标记已读', '查看全部消息',],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.markAllAsRead()
            break
          case 1:
            wx.navigateTo({
              url: '/pages/message/message'
            })
            break
        }
      }
    })
  },

  // 点击消息
  onMessageTap(e) {
    const index = e.currentTarget.dataset.index
    const message = this.data.messages[index]

    // 标记消息为已读
    if (!message.isRead) {
      const messages = this.data.messages
      messages[index].isRead = true
      this.setData({
        messages: messages
      })
      this.calculateUnreadCount()
    }

    // 跳转到消息详情页面
    wx.navigateTo({
      url: `/pages/message-detail/message-detail?id=${message.id}`
    })
  },

  // 全部标记已读
  markAllAsRead() {
    const messages = this.data.messages.map(msg => ({ ...msg, isRead: true }))
    this.setData({
      messages: messages
    })
    this.calculateUnreadCount()
    wx.showToast({
      title: '已全部标记为已读',
      icon: 'success'
    })
  },

  // 清空所有消息
  clearAllMessages() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有消息吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            messages: []
          })
          this.calculateUnreadCount()
          wx.showToast({
            title: '消息已清空',
            icon: 'success'
          })
        }
      }
    })
  },
}) 