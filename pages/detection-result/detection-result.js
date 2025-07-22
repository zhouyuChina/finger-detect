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
      imagePath: '/images/banner1.png', // 检测照片路径
      description: '这里是文字描述,这里是文字描述,这里是文字描述,这里是文字描述,这里是文字描述,这里是文字描述,这里是文字描述,这里是文字描述,这里是文字描述,这里是文字描述,这里是文字描述,',
      suggestions: '处于这种情况下常见的治愈时长为一个月,处于这种情况下常见的治愈时长为一个月,处于这种情况下常见的治愈时长为一个月,处于这种情况下常见的治愈时长为一个月,'
    }
  },

  onLoad(options) {
    // 如果有传递的图片路径，使用传递的路径
    if (options.imagePath) {
      this.setData({
        'detectionResult.imagePath': decodeURIComponent(options.imagePath)
      });
    }
  },

  // 预览图片
  previewImage() {
    const imagePath = this.data.detectionResult.imagePath;
    wx.previewImage({
      current: imagePath,
      urls: [imagePath]
    });
  },

  // 保存到档案
  saveToProfile() {
    wx.showToast({
      title: '已保存到档案',
      icon: 'success'
    });
  },

  // 返回首页
  backToHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  }
}); 