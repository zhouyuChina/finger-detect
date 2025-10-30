// camera.js
Page({
  data: {
    devicePosition: 'back', // 摄像头方向
    showCamera: true,
    photoPath: '',
    profile: null,
    canvasWidth: 300, // canvas宽度
    canvasHeight: 500, // canvas高度
    cameraAuthorized: false, // 相机是否已授权
    isAuthorizing: false // 是否正在授权中
  },

  onLoad(options) {

    // 获取传递的档案信息
    if (options.profile) {
      try {
        const profile = JSON.parse(decodeURIComponent(options.profile))
        this.setData({ profile })
      } catch (error) {
        console.error('解析档案信息失败:', error)
      }
    }

    // 检查相机授权
    this.checkCameraAuth()
  },

  // 检查相机授权
  async checkCameraAuth() {
    try {
      const setting = await new Promise((resolve, reject) => {
        wx.getSetting({
          success: resolve,
          fail: reject
        })
      })

      // 检查是否已授权
      if (setting.authSetting['scope.camera'] === true) {
        // 已授权，显示相机
        this.setData({ cameraAuthorized: true })
      } else {
        // 未授权或被拒绝，显示引导页
        this.setData({ cameraAuthorized: false })
      }
    } catch (error) {
      console.error('检查相机权限失败:', error)
      this.setData({ cameraAuthorized: false })
    }
  },

  // 处理相机授权（用户点击"开启相机"按钮）
  handleCameraAuth() {
    // 设置授权中状态，避免闪现引导页
    this.setData({
      isAuthorizing: true,
      cameraAuthorized: false
    })

    // 使用 nextTick 确保状态更新后再显示相机
    // 这样可以避免从引导页到相机的闪烁
    wx.nextTick(() => {
      // 短暂延迟后设置为已授权，让微信弹出授权对话框
      setTimeout(() => {
        this.setData({
          cameraAuthorized: true,
          isAuthorizing: false
        })
      }, 100)
    })
  },

  // 拍照
  takePhoto() {
    const ctx = wx.createCameraContext()
    ctx.takePhoto({
      quality: 'high',
      success: (res) => {
        // 拍照后立即进行裁剪
        this.cropPhoto(res.tempImagePath)
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

    // 构建返回URL，需要传递档案信息和照片路径
    let url = `/pages/photo-detection/photo-detection?photoPath=${encodeURIComponent(this.data.photoPath)}`
    
    // 如果有档案信息，也一并传递
    if (this.data.profile) {
      const profileParam = encodeURIComponent(JSON.stringify(this.data.profile))
      url += `&profile=${profileParam}`
    }
    
    // 使用 redirectTo 返回拍照页面
    wx.redirectTo({
      url: url
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 相机错误处理
  onCameraError(e) {
    console.error('相机错误详情:', e.detail)
    console.error('错误对象:', e)

    // 判断错误类型
    const errMsg = e.detail.errMsg || e.detail.errCode || ''
    const errCode = e.detail.errCode || 0

    console.log('错误消息:', errMsg)
    console.log('错误代码:', errCode)

    // 权限相关错误码：
    // 10003: 用户拒绝授权
    // 10004: 相机被占用
    // 其他授权相关错误
    if (errMsg.includes('auth') ||
        errMsg.includes('authorize') ||
        errMsg.includes('user denied') ||
        errMsg.includes('privacy') ||
        errCode === 10003) {
      // 权限问题 - 用户拒绝了授权或隐私未配置
      this.setData({ cameraAuthorized: false })

      wx.showModal({
        title: '相机权限未授权',
        content: '需要开启相机权限才能进行拍照检测。\n\n如果您已经授权但仍无法使用，可能是小程序隐私设置问题，请联系客服。',
        confirmText: '去设置',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.openSetting({
              success: (settingRes) => {
                if (settingRes.authSetting['scope.camera']) {
                  // 用户开启了权限，重新显示相机
                  this.setData({ cameraAuthorized: true })
                }
              }
            })
          } else {
            wx.navigateBack()
          }
        }
      })
    } else {
      // 其他错误
      this.setData({ cameraAuthorized: false })

      wx.showModal({
        title: '相机启动失败',
        content: `相机暂时无法使用\n\n可能原因：\n1. 设备相机被其他应用占用\n2. 小程序隐私设置未完成\n3. 系统权限限制\n\n错误详情: ${errMsg || errCode}`,
        confirmText: '返回',
        showCancel: false,
        success: () => {
          wx.navigateBack()
        }
      })
    }
  },

  // 裁剪照片
  async cropPhoto(originalImagePath) {
    try {
      wx.showLoading({
        title: '处理中...'
      })

      // 获取系统信息用于计算裁剪区域
      const systemInfo = await this.getSystemInfo()
      const screenWidth = systemInfo.screenWidth
      const screenHeight = systemInfo.screenHeight
      const windowHeight = systemInfo.windowHeight // 可视区域高度，不包含状态栏等

      // 获取图片信息
      const imageInfo = await this.getImageInfo(originalImagePath)
      const imageWidth = imageInfo.width
      const imageHeight = imageInfo.height

      // 计算虚线框在屏幕上的实际位置和大小
      // 指甲框规格：280rpx × 360rpx，位置：top: 40%, left: 50%（居中）
      const rpxToPixel = screenWidth / 750 // rpx到px的转换比例
      const guideFrameWidth = 280 * rpxToPixel // 指甲框宽度(px)
      const guideFrameHeight = 360 * rpxToPixel // 指甲框高度(px)
      
      // 指甲框在相机视图中的位置
      // 相机组件占满全屏，指甲框位于相机中央上方46%（与CSS的nail-cutout位置一致）
      const guideFrameX = (screenWidth - guideFrameWidth) / 2 // 左边距（水平居中）
      const guideFrameY = windowHeight * 0.46 - guideFrameHeight / 2 // 上边距（垂直46%位置）

      // 计算相机视图与实际拍摄图片的缩放关系
      // 微信小程序camera组件默认会保持图片比例并居中显示
      let scaleX, scaleY, offsetX = 0, offsetY = 0
      
      const screenRatio = screenWidth / windowHeight
      const imageRatio = imageWidth / imageHeight
      
      if (imageRatio > screenRatio) {
        // 图片更宽，以高度为准进行缩放
        scaleY = imageHeight / windowHeight
        scaleX = scaleY
        offsetX = (imageWidth - screenWidth * scaleX) / 2 // 图片在水平方向的偏移
      } else {
        // 图片更高，以宽度为准进行缩放
        scaleX = imageWidth / screenWidth
        scaleY = scaleX
        offsetY = (imageHeight - windowHeight * scaleY) / 2 // 图片在垂直方向的偏移
      }

      // 计算在原图上的裁剪区域
      const actualCropX = Math.max(0, guideFrameX * scaleX + offsetX)
      const actualCropY = Math.max(0, guideFrameY * scaleY + offsetY)
      const actualCropWidth = Math.min(imageWidth - actualCropX, guideFrameWidth * scaleX)
      const actualCropHeight = Math.min(imageHeight - actualCropY, guideFrameHeight * scaleY)


      // 使用canvas进行裁剪
      const croppedImagePath = await this.performCrop(
        originalImagePath,
        actualCropX,
        actualCropY,
        actualCropWidth,
        actualCropHeight
      )

      wx.hideLoading()
      
      // 设置裁剪后的图片路径
      this.setData({
        photoPath: croppedImagePath,
        showCamera: false
      })

    } catch (error) {
      wx.hideLoading()
      console.error('图片裁剪失败:', error)
      
      // 裁剪失败时使用原图
      this.setData({
        photoPath: originalImagePath,
        showCamera: false
      })
      
      wx.showToast({
        title: '图片处理失败，使用原图',
        icon: 'none'
      })
    }
  },

  // 获取系统信息
  getSystemInfo() {
    return new Promise((resolve, reject) => {
      wx.getSystemInfo({
        success: resolve,
        fail: reject
      })
    })
  },

  // 获取图片信息
  getImageInfo(imagePath) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: imagePath,
        success: resolve,
        fail: reject
      })
    })
  },

  // 执行canvas裁剪
  performCrop(imagePath, x, y, width, height) {
    return new Promise((resolve, reject) => {
      const ctx = wx.createCanvasContext('cropCanvas', this)
      
      // 设置canvas尺寸
      this.setData({
        canvasWidth: Math.round(width),
        canvasHeight: Math.round(height)
      })

      // 等待canvas尺寸更新后再绘制
      setTimeout(() => {
        // 绘制裁剪后的图片 - 从源图片的指定区域裁剪到canvas
        ctx.drawImage(
          imagePath, 
          Math.round(x), Math.round(y), Math.round(width), Math.round(height), // 源图片裁剪区域
          0, 0, Math.round(width), Math.round(height) // canvas绘制区域
        )
        
        ctx.draw(false, () => {
          // 等待绘制完成后导出
          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvasId: 'cropCanvas',
              x: 0,
              y: 0,
              width: Math.round(width),
              height: Math.round(height),
              destWidth: Math.round(width),
              destHeight: Math.round(height),
              success: (res) => {
                resolve(res.tempFilePath)
              },
              fail: (error) => {
                console.error('Canvas导出失败:', error)
                reject(error)
              }
            }, this)
          }, 300)
        })
      }, 100)
    })
  }
})
