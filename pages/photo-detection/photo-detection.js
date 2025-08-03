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
        this.setData({ profile })
        console.log('获取到档案信息:', profile)
        
        // 检查档案是否有报告
        this.checkProfileReports(profile.id)
      } catch (error) {
        console.error('解析档案信息失败:', error)
        this.handleError('档案信息获取失败')
      }
    } else {
      console.warn('未传递档案信息')
      this.handleError('档案信息缺失')
    }
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
      
      // 根据档案的 photoCount 判断是否有报告
      const hasReports = profile.photoCount > 0
      
      console.log('档案报告检查结果:', { 
        hasReports, 
        photoCount: profile.photoCount,
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

  // 开始检测
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

    // 根据是否有报告决定处理逻辑
    if (this.data.hasReports) {
      // 已有报告：直接保存照片到恢复记录，不进行检测
      this.saveToRecords()
    } else {
      // 没有报告：进行检测流程
      this.performDetection()
    }
  },

  // 保存到恢复记录（已有报告的情况）
  async saveToRecords() {
    wx.showLoading({
      title: '保存中...'
    })

    try {
      // 这里应该调用保存照片到记录的接口
      // 暂时模拟保存过程
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })

      // 更新档案的照片数量
      this.updateProfilePhotoCount(this.data.profile.id)
      
      // 跳转到恢复记录页面
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/records-compare/records-compare?profileId=${this.data.profile.id}`
        })
      }, 1500)
    } catch (error) {
      wx.hideLoading()
      console.error('保存失败:', error)
      wx.showToast({
        title: '保存失败，请重试',
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
      // 准备检测数据
      const profile = this.data.profile
      const detectionData = {
        username: profile.username,
        archiveName: profile.name,
        detectionType: this.getDetectionType(profile.name),
        imageUrl: this.data.photoPath // 这里应该上传图片后获取URL
      }

      console.log('开始检测，数据:', detectionData)
      
      // 调用检测接口
      const response = await api.detection.create(detectionData)
      console.log('检测接口响应:', response)
      
      wx.hideLoading()
      
      if (response.success && response.data) {
        const { detection, thirdPartyResult } = response.data
        
        // 前端自行判断是否为第一次报告
        const isFirstReport = this.data.profile.photoCount === 0
        
        // 为检测结果添加 isFirstReport 字段
        const detectionWithReportFlag = {
          ...detection,
          isFirstReport: isFirstReport
        }
        
        console.log('检测完成，是否为第一次报告:', isFirstReport)
        
        wx.showToast({
          title: '检测完成',
          icon: 'success'
        })

        // 更新档案的照片数量
        this.updateProfilePhotoCount(profile.id)
        
        // 跳转到检测结果页面
        setTimeout(() => {
          wx.navigateTo({
            url: `/pages/detection-result/detection-result?detection=${encodeURIComponent(JSON.stringify(detectionWithReportFlag))}&thirdPartyResult=${encodeURIComponent(JSON.stringify(thirdPartyResult))}&imagePath=${encodeURIComponent(this.data.photoPath)}`
          })
        }, 1500)
      } else {
        console.warn('检测接口返回错误:', response)
        wx.showToast({
          title: response.message || '检测失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('检测失败:', error)
      wx.showToast({
        title: '检测失败，请重试',
        icon: 'none'
      })
    }
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