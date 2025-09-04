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
    error: false, // 错误状态
    wxLoginCode: null, // 微信登录code
    showUserProfileModal: false // 是否显示用户信息获取弹窗
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
      // 没有档案信息的情况（未登录用户或直接访问）
      console.log('未传递档案信息，允许无档案拍照')
      
      this.setData({ 
        loading: false,
        profile: null,
        // 设置默认档案信息用于显示
        defaultProfile: {
          name: '临时档案',
          bodyPart: '未指定',
          detailPart: '未指定'
        }
      })
    }

    // 如果有照片路径参数，说明是从相机页面返回的
    if (options.photoPath) {
      console.log('检测到照片路径参数:', options.photoPath)
      this.setData({
        photoTaken: true,
        photoPath: decodeURIComponent(options.photoPath)
      })
      console.log('设置拍照状态成功，photoTaken:', true, 'photoPath:', decodeURIComponent(options.photoPath))
    } else {
      console.log('没有照片路径参数，options:', options)
    }
  },

  onShow() {
    // 页面显示时的处理
    console.log('Photo-detection页面显示')
  },

  // 拍照
  takePhoto() {
    // 跳转到自定义相机页面
    const profile = this.data.profile || this.data.defaultProfile
    const profileParam = profile ? encodeURIComponent(JSON.stringify(profile)) : ''
    
    wx.navigateTo({
      url: `/pages/camera/camera?profile=${profileParam}`,
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

  // 上传图片 (临时功能)
  uploadPhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        console.log('选择的图片路径:', tempFilePath)
        
        // 设置选择的图片路径和状态
        this.setData({
          photoTaken: true,
          photoPath: tempFilePath
        })
        
        wx.showToast({
          title: '图片上传成功',
          icon: 'success'
        })
      },
      fail: (error) => {
        console.error('选择图片失败:', error)
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        })
      }
    })
  },

  // 重新拍照/上传
  retakePhoto() {
    wx.showActionSheet({
      itemList: ['重新拍照', '重新上传图片'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 重新拍照
          this.setData({
            photoTaken: false,
            photoPath: ""
          })
        } else if (res.tapIndex === 1) {
          // 重新上传
          this.uploadPhoto()
        }
      },
      fail: (res) => {
        console.log(res.errMsg)
      }
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

  // 用户授权
  async onUserAuth() {
    console.log('用户点击授权按钮')
    
    try {
      // 先获取微信登录code
      const loginResult = await wx.login()
      console.log('微信登录结果:', loginResult)
      
      if (loginResult.code) {
        // 保存code到页面数据中，用于后续获取用户信息
        this.setData({ 
          wxLoginCode: loginResult.code,
          showUserProfileModal: true 
        })
      } else {
        throw new Error('微信登录失败')
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      })
    }
  },

  // 获取用户信息（在用户点击事件中调用）
  async getUserProfile() {
    if (!this.data.wxLoginCode) {
      wx.showToast({
        title: '登录凭证获取失败',
        icon: 'none'
      })
      return
    }

    try {
      // 获取用户信息（必须在用户点击事件中调用）
      const userProfileResult = await wx.getUserProfile({
        desc: '用于完善用户资料和个性化服务'
      })
      console.log('用户信息获取结果:', userProfileResult)
      
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync()
      
      // 构建注册数据（与授权页面保持一致）
      const registerData = {
        code: this.data.wxLoginCode,
        userInfo: userProfileResult.userInfo,
        systemInfo: {
          platform: systemInfo.platform,
          system: systemInfo.system,
          version: systemInfo.version,
          SDKVersion: systemInfo.SDKVersion,
          brand: systemInfo.brand,
          model: systemInfo.model,
          screenWidth: systemInfo.screenWidth,
          screenHeight: systemInfo.screenHeight,
          windowWidth: systemInfo.windowWidth,
          windowHeight: systemInfo.windowHeight,
          pixelRatio: systemInfo.pixelRatio,
          language: systemInfo.language
        },
        registerTime: new Date().toISOString(),
        appVersion: '1.0.0'
      }

      console.log('开始注册用户...')
      console.log('注册数据:', registerData)

      // 调用后端注册接口
      const api = require('../../utils/api.js')
      const storage = require('../../utils/storage.js')
      const response = await api.user.miniProgramRegister(registerData)
      
      console.log('注册响应:', response)
      
      if (response.success || response.code === 200) {
        console.log('注册成功，保存用户数据')
        
        // 保存用户信息（与授权页面保持一致）
        const responseData = response.data || response
        console.log('注册响应数据:', responseData)
        
        // 从新接口格式中提取数据
        const user = responseData.user
        if (user) {
          // 保存openId（从user.openid获取）
          if (user.openid) {
            storage.setOpenId(user.openid)
            console.log('保存openId成功:', user.openid)
          } else {
            console.warn('响应中没有openid')
          }
          
          // 保存用户信息（使用user对象）
          storage.setUserInfo(user)
          console.log('保存用户信息成功:', user)
          
          // 保存子用户列表
          if (user.subUsers) {
            storage.setSubUsers(user.subUsers)
            console.log('保存子用户列表成功，数量:', user.subUsers.length)
          }
          
          // 保存当前子用户
          if (user.currentSubUser) {
            storage.setCurrentSubUser(user.currentSubUser)
            console.log('保存当前子用户成功:', user.currentSubUser)
          }
        } else {
          console.warn('响应中没有user对象')
        }
        
        // 验证保存的数据
        const savedUserInfo = storage.getUserInfo()
        const savedOpenId = storage.getOpenId()
        const savedSubUsers = storage.getSubUsers()
        const savedCurrentSubUser = storage.getCurrentSubUser()
        console.log('保存后的数据验证:', {
          userInfo: !!savedUserInfo,
          openId: !!savedOpenId,
          subUsers: !!savedSubUsers,
          currentSubUser: !!savedCurrentSubUser
        })
        
        // 如果用户提供了真实信息，调用同步接口
        if (userProfileResult.userInfo && userProfileResult.userInfo.nickName !== '微信用户') {
          try {
            console.log('调用同步用户信息接口')
            const syncResponse = await api.user.syncProfile(userProfileResult.userInfo)
            console.log('同步用户信息响应:', syncResponse.code, syncResponse.message)
          } catch (syncError) {
            console.warn('同步用户信息失败，但不影响使用:', syncError)
          }
        }
        
        // 关闭弹窗
        this.setData({
          showUserProfileModal: false,
          wxLoginCode: null
        })
        
        // 显示成功提示
        wx.showToast({
          title: '授权成功',
          icon: 'success',
          duration: 2000
        })

        // 验证数据完整性后跳转到首页（与授权页面保持一致）
        const finalUserInfo = storage.getUserInfo()
        const finalOpenId = storage.getOpenId()
        
        if (finalUserInfo && finalOpenId) {
          console.log('数据保存完整，准备跳转到首页')
          // 延迟跳转到首页
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/index/index'
            })
          }, 2000)
        } else {
          console.error('数据保存不完整，无法跳转:', {
            userInfo: !!finalUserInfo,
            openId: !!finalOpenId
          })
          wx.showToast({
            title: '登录数据保存失败，请重试',
            icon: 'none'
          })
        }
        
      } else {
        throw new Error(response.message || '注册失败')
      }
    } catch (error) {
      console.error('用户授权失败:', error)
      wx.showToast({
        title: error.message || '授权失败，请重试',
        icon: 'none'
      })
    }
  },

  // 关闭用户信息获取弹窗
  closeUserProfileModal() {
    this.setData({ 
      showUserProfileModal: false,
      wxLoginCode: null 
    })
  },

  // 开始检测（总是进行检测流程）
  async startDetection() {
    console.log('开始检测，当前状态:', {
      photoTaken: this.data.photoTaken,
      photoPath: this.data.photoPath
    })
    
    if (!this.data.photoTaken) {
      wx.showToast({
        title: '请先拍照',
        icon: 'none'
      })
      return
    }

    // 检查用户是否已登录
    const storage = require('../../utils/storage.js')
    const userInfo = storage.getUserInfo()
    const openId = storage.getOpenId()
    
    if (!userInfo || !openId) {
      // 未登录用户，提示需要授权
      wx.showModal({
        title: '需要授权',
        content: '检测功能需要用户授权，是否现在授权？',
        confirmText: '立即授权',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.onUserAuth()
          }
        }
      })
      return
    }

    const profile = this.data.profile
    if (!profile) {
      // 已登录但无档案信息用户，提示需要先创建档案
      wx.showModal({
        title: '提示',
        content: '检测功能需要档案信息，是否先创建档案？',
        confirmText: '创建档案',
        cancelText: '仅保存图片',
        success: (res) => {
          if (res.confirm) {
            // 跳转到创建档案页面
            wx.navigateTo({
              url: '/pages/create-profile/create-profile'
            })
          } else {
            // 仅保存图片
            this.savePhotoOnly()
          }
        }
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

    // 检查用户是否已登录
    const storage = require('../../utils/storage.js')
    const userInfo = storage.getUserInfo()
    const openId = storage.getOpenId()
    
    if (!userInfo || !openId) {
      // 未登录用户，提示需要授权
      wx.showModal({
        title: '需要授权',
        content: '保存图片需要用户授权，是否现在授权？',
        confirmText: '立即授权',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.onUserAuth()
          }
        }
      })
      return
    }

    const profile = this.data.profile
    if (!profile) {
      // 已登录但无档案信息用户，提示需要先创建档案
      wx.showModal({
        title: '提示',
        content: '保存图片需要档案信息，是否先创建档案？',
        confirmText: '创建档案',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 跳转到创建档案页面
            wx.navigateTo({
              url: '/pages/create-profile/create-profile'
            })
          }
        }
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