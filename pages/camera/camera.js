// camera.js
Page({
  data: {
    devicePosition: 'back', // 摄像头方向
    showCamera: true,
    photoPath: '',
    profile: null
  },

  onLoad(options) {
    console.log('Camera页面加载，参数:', options)
    
    // 获取传递的档案信息
    if (options.profile) {
      try {
        const profile = JSON.parse(decodeURIComponent(options.profile))
        this.setData({ profile })
        console.log('设置档案信息成功:', profile)
      } catch (error) {
        console.error('解析档案信息失败:', error)
      }
    }
  },

  // 拍照
  takePhoto() {
    const ctx = wx.createCameraContext()
    ctx.takePhoto({
      quality: 'high',
      success: (res) => {
        console.log('拍照成功:', res)
        this.setData({
          photoPath: res.tempImagePath,
          showCamera: false
        })
      },
      fail: (err) => {
        console.error('拍照失败:', err)
        wx.showToast({
          title: '拍照失败',
          icon: 'none'
        })
      }
    })
  },

  // 切换摄像头
  switchCamera() {
    this.setData({
      devicePosition: this.data.devicePosition === 'back' ? 'front' : 'back'
    })
  },

  // 重新拍照
  retakePhoto() {
    this.setData({
      photoPath: '',
      showCamera: true
    })
  },

  // 确认使用照片
  confirmPhoto() {
    if (!this.data.photoPath) {
      wx.showToast({
        title: '请先拍照',
        icon: 'none'
      })
      return
    }

    // 返回上一页并传递照片路径
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    
    if (prevPage && prevPage.route.includes('photo-detection')) {
      // 更新上一页的数据
      prevPage.setData({
        photoTaken: true,
        photoPath: this.data.photoPath
      })
      
      wx.navigateBack()
    } else {
      // 如果无法找到上一页，直接跳转到拍照页面
      wx.redirectTo({
        url: `/pages/photo-detection/photo-detection?photoPath=${encodeURIComponent(this.data.photoPath)}`
      })
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 相机错误处理
  onCameraError(e) {
    console.error('相机错误:', e.detail)
    wx.showToast({
      title: '相机启动失败',
      icon: 'none'
    })
  }
})
