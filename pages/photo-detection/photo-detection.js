// photo-detection.js
Page({
  data: {
    currentStep: 2, // 当前在大流程中的步骤
    steps: [
      { id: 1, title: "档案信息", icon: "✏️", active: false },
      { id: 2, title: "拍照检测", icon: "📷", active: true },
      { id: 3, title: "完成", icon: "✅", active: false }
    ],
    photoTaken: false,
    photoPath: ""
  },

  onLoad() {
    // 页面加载
  },

  // 拍照
  takePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      camera: 'back',
      success: (res) => {
        this.setData({
          photoTaken: true,
          photoPath: res.tempFiles[0].tempFilePath
        })
      },
      fail: (err) => {
        wx.showToast({
          title: '拍照失败',
          icon: 'none'
        })
      }
    })
  },

  // 重新拍照
  retakePhoto() {
    this.setData({
      photoTaken: false,
      photoPath: ""
    })
  },

  // 开始检测
  startDetection() {
    if (!this.data.photoTaken) {
      wx.showToast({
        title: '请先拍照',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '检测中...'
    })

    // 模拟检测过程
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '检测完成',
        icon: 'success'
      })

      // 跳转到完成页面
      setTimeout(() => {
        wx.navigateTo({
          url: `/pages/detection-result/detection-result?imagePath=${encodeURIComponent(this.data.photoPath)}`
        })
      }, 1500)
    }, 3000)
  }
}) 