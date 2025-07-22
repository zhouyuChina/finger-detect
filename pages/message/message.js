// message.js
Page({
  data: {
    messageList: [
      {
        id: 1,
        title: "目前AI 在疾病的诊断和治疗上的应用",
        image: "",
        views: 1234,
        time: "2024-07-21"
      },
      {
        id: 2,
        title: "检测报告解读指南，让您更好地理解健康数据",
        image: "",
        views: 2345,
        time: "2024-07-20"
      },
      {
        id: 3,
        title: "健康生活小贴士，定期检测保持身体健康",
        image: "",
        views: 3456,
        time: "2024-07-19"
      },
      {
        id: 4,
        title: "检测流程优化通知，体验更流畅的检测服务",
        image: "",
        views: 4567,
        time: "2024-07-18"
      },
      {
        id: 5,
        title: "用户反馈收集，参与反馈可获得专属优惠",
        image: "",
        views: 5678,
        time: "2024-07-17"
      }
    ]
  },

  onLoad(options) {
    // 页面加载时的逻辑
    this.loadMessages()
  },

  // 加载消息数据
  loadMessages() {
    // 这里可以添加实际的API调用
  },

  // 下拉刷新
  onPullDownRefresh() {
    setTimeout(() => {
      wx.stopPullDownRefresh()
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      })
    }, 1000)
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