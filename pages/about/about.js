// about.js
Page({
  data: {
    version: "v 1.0.0",
    platformName: "健康检测平台",
    updateDate: "2024-07-20"
  },

  onLoad() {
    // 页面加载
  },

  // 拨打客服电话
  onCallService() {
    wx.showModal({
      title: '联系客服',
      content: '是否拨打客服电话：400-123-4567？',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '400-123-4567',
            fail: () => {
              wx.showToast({
                title: '拨打失败',
                icon: 'none'
              })
            }
          })
        }
      }
    })
  },

  // 访问官方网站
  onVisitWebsite() {
    wx.showModal({
      title: '访问官网',
      content: '是否复制官网地址到剪贴板？',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: 'www.healthdetect.com',
            success: () => {
              wx.showToast({
                title: '已复制到剪贴板',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },

  // 意见反馈
  onFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '感谢您的反馈！我们会认真考虑您的建议。',
      showCancel: false
    })
  },


}) 