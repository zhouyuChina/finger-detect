// detection-result.js
Page({
  data: {
    currentStep: 3, // 当前在大流程中的步骤
    steps: [
      { id: 1, title: "档案信息", icon: "✏️", active: false },
      { id: 2, title: "拍照检测", icon: "📷", active: false },
      { id: 3, title: "完成", icon: "✅", active: true }
    ],
    detectionResult: {
      status: "正常",
      details: "检测结果显示各项指标均在正常范围内",
      recommendations: [
        "建议定期进行健康检测",
        "保持良好的生活习惯",
        "适量运动，注意休息"
      ]
    }
  },

  onLoad() {
    // 页面加载
  },

  // 查看详细报告
  viewDetailedReport() {
    wx.showToast({
      title: '详细报告功能开发中',
      icon: 'none'
    })
  },

  // 保存到档案
  saveToProfile() {
    wx.showToast({
      title: '已保存到档案',
      icon: 'success'
    })
  },

  // 返回首页
  backToHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    })
  }
}) 