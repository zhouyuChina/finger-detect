// photo-detection.js
const api = require('../../utils/api.js')

Page({
  data: {
    currentStep: 2, // 当前在大流程中的步骤
    steps: [
      { id: 1, title: "档案信息", icon: "✏️", active: false },
      { id: 2, title: "拍照检测", icon: "📷", active: true },
      { id: 3, title: "完成", icon: "✅", active: false }
    ],
    photoTaken: false,
    photoPath: "",
    profile: null, // 当前档案信息
    hasReports: false, // 是否有报告
    loading: true, // 加载状态
    error: false // 错误状态
  },

  onLoad(options) {
    console.log('Photo-detection页面加载，参数:', options)
    
    // 获取传递的档案信息
    if (options.profile) {
      try {
        const profile = JSON.parse(decodeURIComponent(options.profile))
        console.log('解析到的档案信息:', profile)
        
        // 检查档案是否有ID
        if (!profile || !profile.id) {
          console.error('档案信息缺失或缺少ID:', profile)
          this.handleError('档案ID缺失')
          return
        }
        
        this.setData({ profile })
        console.log('设置档案信息成功，档案ID:', profile.id)
        
        // 检查档案是否有报告
        this.checkProfileReports(profile.id)
      } catch (error) {
        console.error('解析档案信息失败:', error)
        this.handleError('档案信息获取失败')
      }
    } else if (options.subUserId && options.archiveId && options.archiveName) {
      // 从record-gallery页面跳转过来的情况
      const profile = {
        id: options.archiveId,
        name: decodeURIComponent(options.archiveName),
        subUserId: options.subUserId,
        photoCount: 0 // 初始化为0，需要重新获取真实数据
      }
      this.setData({ profile })
      console.log('从record-gallery获取到档案信息:', profile)
      
      // 需要重新检查档案的真实检测数量
      this.checkProfileReports(profile.id)
    } else {
      console.warn('未传递档案信息')
      this.handleError('档案信息缺失')
    }
  },

  // 拍照
  takePhoto() {
    // 跳转到自定义相机页面
    wx.navigateTo({
      url: `/pages/camera/camera?profile=${encodeURIComponent(JSON.stringify(this.data.profile))}`,
      success: () => {
        console.log('跳转到相机页面成功')
      },
      fail: (error) => {
        console.error('跳转到相机页面失败:', error)
        wx.showToast({
          title: '相机启动失败',
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

  // 检查档案报告
  async checkProfileReports(profileId) {
    try {
      console.log('检查档案报告，档案ID:', profileId)
      
      // 获取档案信息，检查是否有报告
      const profile = this.data.profile
      if (!profile) {
        console.warn('档案信息不存在')
        this.setData({ 
          hasReports: false,
          loading: false
        })
        return
      }
      
      // 获取档案的真实检测数量
      const response = await api.profile.getArchiveDetections({
        subUserId: profile.subUserId,
        archiveId: profile.id,
        page: 1,
        limit: 1 // 只需要检查是否有记录，不需要获取所有数据
      })
      
      console.log('档案检测记录查询结果:', response)
      
      let hasReports = false
      let actualPhotoCount = 0
      
      if (response.success && response.data && response.data.images) {
        actualPhotoCount = response.data.images.length
        hasReports = actualPhotoCount > 0
        
        // 更新档案的photoCount
        const updatedProfile = {
          ...profile,
          photoCount: actualPhotoCount
        }
        this.setData({ profile: updatedProfile })
      }
      
      console.log('档案报告检查结果:', { 
        hasReports, 
        actualPhotoCount,
        archiveName: profile.name 
      })
      
      this.setData({ 
        hasReports,
        loading: false
      })
      
      // 不再自动跳转，让用户先拍照
      // 拍照确认后再根据是否有报告决定跳转逻辑
    } catch (error) {
      console.error('检查档案报告失败:', error)
      this.setData({ 
        hasReports: false,
        loading: false,
        error: true
      })
    }
  },

  // 跳转到记录页面
  navigateToRecords(profileId) {
    wx.showToast({
      title: '档案已有记录，正在跳转...',
      icon: 'none',
      duration: 1500
    })
    
    setTimeout(() => {
      wx.redirectTo({
        url: `/pages/records-compare/records-compare?profileId=${profileId}`
      })
    }, 1500)
  },

  // 处理错误
  handleError(message) {
    this.setData({ 
      loading: false,
      error: true
    })
    wx.showToast({
      title: message,
      icon: 'none'
    })
  },

  // 重试
  onRetry() {
    if (this.data.profile) {
      this.setData({ loading: true, error: false })
      this.checkProfileReports(this.data.profile.id)
    } else {
      wx.navigateBack()
    }
  },

  // 开始检测（总是进行检测流程）
  async startDetection() {
    if (!this.data.photoTaken) {
      wx.showToast({
        title: '请先拍照',
        icon: 'none'
      })
      return
    }

    const profile = this.data.profile
    if (!profile) {
      wx.showToast({
        title: '档案信息缺失',
        icon: 'none'
      })
      return
    }

    // 直接进行检测流程
    this.performDetection()
  },

  // 仅保存图片（新功能）
  async savePhotoOnly() {
    if (!this.data.photoTaken) {
      wx.showToast({
        title: '请先拍照',
        icon: 'none'
      })
      return
    }

    const profile = this.data.profile
    if (!profile) {
      wx.showToast({
        title: '档案信息缺失',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '保存中...'
    })

    try {
      // 验证必填参数
      if (!profile.subUserId) {
        throw new Error('子用户ID缺失')
      }
      
      if (!profile.id) {
        throw new Error('档案ID缺失')
      }
      
      if (!this.data.photoPath) {
        throw new Error('图片路径缺失')
      }

      // 将图片转换为base64
      const base64Image = await this.convertImageToBase64(this.data.photoPath)
      
      // 准备保存数据
      const saveData = {
        subUserId: profile.subUserId, // 子用户ID（必填）
        archiveId: profile.id, // 档案ID（必填）
        detectionType: this.getDetectionType(profile.name), // 获取检测类型
        base64Image: base64Image, // base64图片数据（必填）
        remark: '仅保存图片' // 备注信息
      }

      console.log('保存图片数据:', saveData)
      
      // 调用新的保存图片接口
      const response = await api.detection.savePhotoRecord(saveData)
      console.log('保存图片接口响应:', response)
      
      wx.hideLoading()
      
      if (response.success && response.data) {
        wx.showToast({
          title: '图片保存成功',
          icon: 'success'
        })

        // 延迟跳转到记录页面
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/record-gallery/record-gallery?subUserId=${profile.subUserId}&archiveId=${profile.id}&archiveName=${encodeURIComponent(profile.name)}`
          })
        }, 1500)
      } else {
        throw new Error(response.message || '保存失败')
      }
    } catch (error) {
      wx.hideLoading()
      console.error('保存图片失败:', error)
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      })
    }
  },

  // 保存到恢复记录（已有报告的情况）
  async saveToRecords() {
    wx.showLoading({
      title: '保存中...'
    })

    try {
      // 验证必填参数
      const profile = this.data.profile
      if (!profile) {
        throw new Error('档案信息缺失')
      }
      
      if (!profile.subUserId) {
        throw new Error('子用户ID缺失')
      }
      
      if (!profile.id) {
        throw new Error('档案ID缺失')
      }
      
      if (!this.data.photoPath) {
        throw new Error('图片路径缺失')
      }

      // 将图片转换为base64
      const base64Image = await this.convertImageToBase64(this.data.photoPath)
      
      // 准备检测数据
      const detectionData = {
        subUserId: profile.subUserId, // 子用户ID（必填）
        archiveId: profile.id, // 档案ID（必填）
        detectionType: this.getDetectionType(profile.name), // 获取检测类型
        base64Image: base64Image // base64图片数据（必填）
      }

      console.log('保存检测数据:', detectionData)
      
      // 调用检测接口保存照片
      const response = await api.detection.create(detectionData)
      console.log('检测保存接口响应:', response)
      
      wx.hideLoading()
      
      if (response.success && response.data) {
        const { detection, thirdPartyResult, isFirstReport, shouldSaveToDatabase } = response.data
        
        // 处理检测结果
        const finalResult = thirdPartyResult.final_result
        console.log('最终检测结果:', finalResult)
        
        // 根据检测结果进行不同处理
        if (finalResult === 'blurred') {
          // 图片模糊，提示重新拍照
          wx.showModal({
            title: '图片模糊',
            content: '检测到图片模糊，请重新拍照',
            showCancel: false,
            success: () => {
              // 返回拍照页面
              wx.navigateBack()
            }
          })
          return
        }
        
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })

        // 更新档案的照片数量
        this.updateProfilePhotoCount(this.data.profile.id)
        
        // 跳转到恢复记录页面（tabBar页面）
        console.log('准备跳转到恢复记录页面，profileId:', this.data.profile.id)
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/records-compare/records-compare',
            success: () => {
              console.log('跳转到tabBar页面成功')
            },
            fail: (error) => {
              console.error('跳转到tabBar页面失败:', error)
            }
          })
        }, 1500)
      } else {
        console.warn('检测保存接口返回错误:', response)
        console.error('错误详情:', {
          success: response.success,
          code: response.code,
          message: response.message,
          data: response.data
        })
        wx.showToast({
          title: response.message || '保存失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('保存失败，详细错误信息:', error)
      console.error('错误类型:', typeof error)
      console.error('错误消息:', error.message)
      console.error('错误堆栈:', error.stack)
      
      // 根据错误类型显示不同的提示
      let errorMessage = '保存失败，请重试'
      if (error.message) {
        errorMessage = error.message
      } else if (error.code) {
        errorMessage = `错误码: ${error.code}`
      }
      
      wx.showToast({
        title: errorMessage,
        icon: 'none'
      })
    }
  },

  // 执行检测（没有报告的情况）
  async performDetection() {
    wx.showLoading({
      title: '检测中...'
    })

    try {
      // 验证必填参数
      const profile = this.data.profile
      if (!profile) {
        throw new Error('档案信息缺失')
      }
      
      if (!profile.subUserId) {
        throw new Error('子用户ID缺失')
      }
      
      if (!profile.id) {
        throw new Error('档案ID缺失')
      }
      
      if (!this.data.photoPath) {
        throw new Error('图片路径缺失')
      }

      // 将图片转换为base64
      const base64Image = await this.convertImageToBase64(this.data.photoPath)
      
      // 准备检测数据
      const detectionData = {
        subUserId: profile.subUserId, // 子用户ID（必填）
        archiveId: profile.id, // 档案ID（必填）
        detectionType: this.getDetectionType(profile.name), // 检测类型
        base64Image: base64Image // base64图片数据（必填）
      }

      console.log('开始检测，数据:', detectionData)
      
      // 调用检测接口
      const response = await api.detection.create(detectionData)
      console.log('检测接口响应:', response)
      
      wx.hideLoading()
      
      if (response.success && response.data) {
        const { detection, thirdPartyResult, isFirstReport, shouldSaveToDatabase } = response.data
        
        console.log('检测完成，是否为第一次报告:', isFirstReport)
        console.log('是否需要保存到数据库:', shouldSaveToDatabase)
        
        // 处理检测结果
        const finalResult = thirdPartyResult.final_result
        console.log('最终检测结果:', finalResult)
        
        // 根据检测结果进行不同处理
        if (finalResult === 'blurred') {
          // 图片模糊，提示重新拍照
          wx.showModal({
            title: '图片模糊',
            content: '检测到图片模糊，请重新拍照',
            showCancel: false,
            success: () => {
              // 返回拍照页面
              wx.navigateBack()
            }
          })
          return
        }
        
        // 为检测结果添加 isFirstReport 字段
        const detectionWithReportFlag = {
          ...detection,
          isFirstReport: isFirstReport
        }
        
        wx.showToast({
          title: '检测完成',
          icon: 'success'
        })

        // 更新档案的照片数量
        this.updateProfilePhotoCount(profile.id)
        
        // 跳转到检测结果页面
        setTimeout(() => {
          wx.navigateTo({
            url: `/pages/detection-result/detection-result?detection=${encodeURIComponent(JSON.stringify(detectionWithReportFlag))}&thirdPartyResult=${encodeURIComponent(JSON.stringify(thirdPartyResult))}&imagePath=${encodeURIComponent(this.data.photoPath)}&finalResult=${encodeURIComponent(finalResult)}`
          })
        }, 1500)
      } else {
        console.warn('检测接口返回错误:', response)
        console.error('错误详情:', {
          success: response.success,
          code: response.code,
          message: response.message,
          data: response.data
        })
        wx.showToast({
          title: response.message || '检测失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('检测失败，详细错误信息:', error)
      console.error('错误类型:', typeof error)
      console.error('错误消息:', error.message)
      console.error('错误堆栈:', error.stack)
      
      // 根据错误类型显示不同的提示
      let errorMessage = '检测失败，请重试'
      if (error.message) {
        errorMessage = error.message
      } else if (error.code) {
        errorMessage = `错误码: ${error.code}`
      }
      
      wx.showToast({
        title: errorMessage,
        icon: 'none'
      })
    }
  },

  // 将图片转换为base64
  async convertImageToBase64(imagePath) {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath: imagePath,
        encoding: 'base64',
        success: (res) => {
          // 根据文件扩展名确定MIME类型
          const extension = imagePath.split('.').pop().toLowerCase()
          let mimeType = 'image/jpeg' // 默认
          if (extension === 'png') {
            mimeType = 'image/png'
          } else if (extension === 'jpg' || extension === 'jpeg') {
            mimeType = 'image/jpeg'
          }
          
          const base64Data = `data:${mimeType};base64,${res.data}`
          resolve(base64Data)
        },
        fail: (error) => {
          console.error('转换图片为base64失败:', error)
          reject(error)
        }
      })
    })
  },

  // 获取检测类型
  getDetectionType(archiveName) {
    // 根据档案名称映射到检测类型
    const detectionTypeMap = {
      // 左手检测类型
      '左手大拇指': 'left_hand_thumb',
      '左手食指': 'left_hand_index',
      '左手中指': 'left_hand_middle',
      '左手无名指': 'left_hand_ring',
      '左手小指': 'left_hand_little',
      
      // 右手检测类型
      '右手大拇指': 'right_hand_thumb',
      '右手食指': 'right_hand_index',
      '右手中指': 'right_hand_middle',
      '右手无名指': 'right_hand_ring',
      '右手小指': 'right_hand_little',
      
      // 左脚检测类型
      '左脚大脚趾': 'left_foot_big',
      '左脚第二脚趾': 'left_foot_second',
      '左脚第三脚趾': 'left_foot_third',
      '左脚第四脚趾': 'left_foot_fourth',
      '左脚小脚趾': 'left_foot_little',
      
      // 右脚检测类型
      '右脚大脚趾': 'right_foot_big',
      '右脚第二脚趾': 'right_foot_second',
      '右脚第三脚趾': 'right_foot_third',
      '右脚第四脚趾': 'right_foot_fourth',
      '右脚小脚趾': 'right_foot_little'
    }
    
    const detectionType = detectionTypeMap[archiveName]
    console.log('档案名称:', archiveName, '映射到检测类型:', detectionType)
    
    if (!detectionType) {
      console.warn('未找到对应的检测类型，使用默认值 left_hand_thumb')
      return 'left_hand_thumb'
    }
    
    return detectionType
  },

  // 获取身体部位值（用于档案接口）
  getBodyPartValue(archiveName) {
    // 根据档案名称映射到bodyPart值
    const bodyPartMap = {
      // 左手检测类型
      '左手大拇指': 'left_hand_thumb',
      '左手食指': 'left_hand_index',
      '左手中指': 'left_hand_middle',
      '左手无名指': 'left_hand_ring',
      '左手小指': 'left_hand_little',
      
      // 右手检测类型
      '右手大拇指': 'right_hand_thumb',
      '右手食指': 'right_hand_index',
      '右手中指': 'right_hand_middle',
      '右手无名指': 'right_hand_ring',
      '右手小指': 'right_hand_little',
      
      // 左脚检测类型
      '左脚大脚趾': 'left_foot_big',
      '左脚第二脚趾': 'left_foot_second',
      '左脚第三脚趾': 'left_foot_third',
      '左脚第四脚趾': 'left_foot_fourth',
      '左脚小脚趾': 'left_foot_little',
      
      // 右脚检测类型
      '右脚大脚趾': 'right_foot_big',
      '右脚第二脚趾': 'right_foot_second',
      '右脚第三脚趾': 'right_foot_third',
      '右脚第四脚趾': 'right_foot_fourth',
      '右脚小脚趾': 'right_foot_little'
    }
    
    const bodyPart = bodyPartMap[archiveName]
    console.log('档案名称:', archiveName, '映射到bodyPart:', bodyPart)
    
    if (!bodyPart) {
      console.warn('未找到对应的bodyPart，使用默认值 left_hand_thumb')
      return 'left_hand_thumb'
    }
    
    return bodyPart
  },

  // 更新档案照片数量
  updateProfilePhotoCount(profileId) {
    const profile = this.data.profile
    if (profile) {
      // 更新本地档案数据
      const updatedProfile = {
        ...profile,
        photoCount: (profile.photoCount || 0) + 1
      }
      this.setData({ profile: updatedProfile })
      
      console.log('更新档案照片数量:', updatedProfile.photoCount)
      
      // 通知上一页更新档案列表
      const pages = getCurrentPages()
      if (pages.length > 1) {
        const prevPage = pages[pages.length - 2]
        if (prevPage && prevPage.route.includes('create-profile')) {
          // 如果上一页是 create-profile，刷新档案列表
          prevPage.loadUserProfiles(profile.username)
        }
      }
    }
  }
}) 