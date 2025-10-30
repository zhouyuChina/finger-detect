// detection-result.js
const common = require('../../utils/common.js')

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
    },
    detection: null, // 检测记录
    thirdPartyResult: null, // 第三方检测结果
    loading: true
  },

  onLoad(options) {

    // 从 localStorage 获取当前用户信息
    const storage = require('../../utils/storage.js')
    const userInfo = storage.getUserInfo()
    const currentSubUser = storage.getCurrentSubUser()

    // 获取用户昵称，优先级：currentSubUser > userInfo
    // 同时过滤掉"微信用户"这个默认值
    let userNickname = ''

    // 尝试从 currentSubUser 获取
    if (currentSubUser?.realName && currentSubUser.realName !== '微信用户' && currentSubUser.realName.trim() !== '') {
      userNickname = currentSubUser.realName
    } else if (currentSubUser?.nickname && currentSubUser.nickname !== '微信用户' && currentSubUser.nickname.trim() !== '') {
      userNickname = currentSubUser.nickname
    } else if (currentSubUser?.username && currentSubUser.username !== '微信用户' && currentSubUser.username.trim() !== '') {
      userNickname = currentSubUser.username
    }

    // 如果还是空的，尝试从 userInfo 获取
    if (!userNickname) {
      if (userInfo?.nickname && userInfo.nickname !== '微信用户' && userInfo.nickname.trim() !== '') {
        userNickname = userInfo.nickname
      } else if (userInfo?.realName && userInfo.realName !== '微信用户' && userInfo.realName.trim() !== '') {
        userNickname = userInfo.realName
      } else if (userInfo?.nickName && userInfo.nickName !== '微信用户' && userInfo.nickName.trim() !== '') {
        userNickname = userInfo.nickName
      }
    }

    // 如果还是空的，使用默认值
    if (!userNickname) {
      userNickname = '用户'
    }

    // 获取用户性别，优先级：currentSubUser > userInfo
    const userGender = currentSubUser?.gender || userInfo?.gender || '0'

    // 保存到页面数据中
    this.setData({
      userNickname: userNickname,
      userGender: userGender
    })

    // 如果有传递的图片路径，使用传递的路径
    if (options.imagePath) {
      this.setData({
        'detectionResult.imagePath': decodeURIComponent(options.imagePath)
      });
    }

    // 如果有传递的检测结果，解析并显示
    if (options.detection && options.thirdPartyResult) {
      try {
        const detection = JSON.parse(decodeURIComponent(options.detection))
        const thirdPartyResult = JSON.parse(decodeURIComponent(options.thirdPartyResult))
        const finalResult = options.finalResult ? decodeURIComponent(options.finalResult) : null

        // 格式化检测时间
        const detectionTime = detection.detectionTime || detection.createdAt || detection.createTime || detection.updatedAt
        const formattedTime = detectionTime ? common.formatTime(detectionTime, 'YYYY-MM-DD HH:mm:ss') : '—'

        // 根据检测结果生成描述和建议
        let description = ''
        let suggestions = ''

        if (finalResult === 'onychomycosis') {
          description = '检测结果显示存在灰指甲症状，建议尽早治疗或到医疗机构进一步检测。'
          suggestions = '建议及时就医治疗，保持指甲清洁干燥，避免共用个人用品'
        } else if (finalResult === 'Normal' || finalResult === 'normal') {
          description = '检测结果显示指甲状态正常'
          suggestions = '建议继续保持良好的卫生习惯'
        } else if (finalResult === 'UNKNOWN') {
          description = `可能相片模糊；可能灰指甲特征不明显；可能拍照光线不足；可能背景复杂，拍摄到的指甲偏小等其他原因导致，可尝试重新拍照检测。`
          suggestions = '未能识别'
        } else {
          description = '检测完成'
          suggestions = '请查看详细结果'
        }

        // 更新检测结果数据
        this.setData({
          detection,
          thirdPartyResult,
          finalResult,
          detectionTime: formattedTime,
          'detectionResult.description': description,
          'detectionResult.suggestions': suggestions,
          loading: false
        })

        // 根据是否为第一次报告显示不同的提示
        if (detection.isFirstReport) {
        } else {
        }
      } catch (error) {
        console.error('解析检测结果失败:', error)
        this.setData({ loading: false })
      }
    } else {
      this.setData({ loading: false })
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
    // 通知上一页更新档案列表
    this.updateProfileList()
    
    const isFirstReport = this.data.detection?.isFirstReport
    const toastTitle = isFirstReport ? '报告已保存' : '记录已保存'
    
    wx.showToast({
      title: toastTitle,
      icon: 'success'
    });
  },

  // 更新档案列表
  updateProfileList() {
    const pages = getCurrentPages()
    if (pages.length > 2) {
      const createProfilePage = pages[pages.length - 3] // photo-detection 的上一页
      if (createProfilePage && createProfilePage.route.includes('create-profile')) {
        const profile = this.data.detection
        if (profile && profile.username) {
          createProfilePage.loadUserProfiles(profile.username)
        }
      }
    }
  },

  // 返回首页
  backToHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  }
}); 