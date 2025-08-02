// profile.js
const api = require('../../utils/api.js')
const storage = require('../../utils/storage.js')
const common = require('../../utils/common.js')
const config = require('../../utils/config.js')
const profileDebug = require('../../utils/profile-debug.js')

Page({
  data: {
    userInfo: {
      name: '',
      phone: '',
      avatar: '/images/default-avatar.png'
    },
    stats: {
      totalRecords: 0,
      totalReports: 0,
      familyMembers: 0,
      totalDetections: 0,
      unreadMessages: 0
    },
    showFeedbackPopup: false,
    feedbackType: 'bug',
    feedbackContent: '',
    contactInfo: '',
    loading: false // 加载状态
  },

  onLoad() {
    console.log('Profile页面加载')
    this.loadUserData()
    
    // 调试模式：自动运行调试
    if (this.data.debugMode) {
      this.debugProfile()
    }
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadUserData()
  },

  // 加载用户数据
  async loadUserData() {
    try {
      this.setData({ loading: true })
      
      // 并行加载用户信息和统计信息
      const [userInfoRes, statsRes] = await Promise.all([
        api.user.getProfile().catch(error => {
          console.warn('获取用户信息失败:', error)
          return null
        }),
        api.user.getStats().catch(error => {
          console.warn('获取用户统计失败:', error)
          return null
        })
      ])

      // 处理用户信息
      if (userInfoRes && userInfoRes.code === 200 && userInfoRes.data) {
        const userInfo = this.formatUserInfo(userInfoRes.data)
        this.setData({ userInfo })
        console.log('用户信息加载成功:', userInfo)
      } else {
        console.log('使用默认用户信息')
        this.setData({
          userInfo: {
            name: '未登录用户',
            phone: '',
            avatar: '/images/default-avatar.png'
          }
        })
      }

      // 处理统计信息
      if (statsRes && statsRes.code === 200 && statsRes.data) {
        const stats = this.formatStats(statsRes.data)
        this.setData({ stats })
        console.log('统计信息加载成功:', stats)
      } else {
        console.log('使用默认统计信息')
        this.setData({
          stats: {
            totalRecords: 0,
            totalReports: 0,
            familyMembers: 0,
            totalDetections: 0,
            unreadMessages: 0
          }
        })
      }

    } catch (error) {
      console.error('加载用户数据失败:', error)
      common.showError('加载数据失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 格式化用户信息
  formatUserInfo(data) {
    return {
      name: data.name || data.nickname || data.username || '未设置姓名',
      phone: data.phone ? this.maskPhone(data.phone) : '',
      avatar: this.formatAvatarUrl(data.avatar || data.avatarUrl)
    }
  },

  // 格式化统计信息
  formatStats(data) {
    return {
      totalRecords: data.totalRecords || data.photoRecords || 0,
      totalReports: data.totalReports || data.reportRecords || 0,
      familyMembers: data.familyMembers || data.profileRecords || 0,
      totalDetections: data.totalDetections || data.detectionCount || 0,
      unreadMessages: data.unreadMessages || data.unreadCount || 0
    }
  },

  // 处理头像URL
  formatAvatarUrl(avatarUrl) {
    if (!avatarUrl) {
      return '/images/default-avatar.png'
    }
    
    // 如果是相对路径，添加静态资源基础URL
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      const staticUrl = config.getCurrentConfig().staticUrl
      avatarUrl = staticUrl + avatarUrl
      console.log('处理头像URL:', avatarUrl)
    }
    
    return avatarUrl
  },

  // 手机号脱敏
  maskPhone(phone) {
    if (!phone || phone.length < 7) return phone
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  },

  // 留言反馈
  onEditProfile() {
    this.setData({
      showFeedbackPopup: true
    });
  },

  // 反馈弹窗状态变化
  onFeedbackPopupChange(e) {
    this.setData({
      showFeedbackPopup: e.detail.visible
    });
  },

  // 关闭反馈弹窗
  closeFeedbackPopup() {
    this.setData({
      showFeedbackPopup: false,
      feedbackType: 'bug',
      feedbackContent: '',
      contactInfo: ''
    });
  },

  // 选择反馈类型
  selectType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      feedbackType: type
    });
  },

  // 反馈内容输入
  onContentInput(e) {
    this.setData({
      feedbackContent: e.detail.value
    });
  },

  // 联系方式输入
  onContactInput(e) {
    this.setData({
      contactInfo: e.detail.value
    });
  },

  // 提交反馈
  async submitFeedback() {
    const { feedbackType, feedbackContent, contactInfo } = this.data;
    
    if (!feedbackContent.trim()) {
      wx.showToast({
        title: '请输入反馈内容',
        icon: 'error'
      });
      return;
    }

    // 显示提交中状态
    wx.showLoading({
      title: '提交中...'
    });

    try {
      // TODO: 调用反馈提交API
      // const response = await api.feedback.submit({
      //   type: feedbackType,
      //   content: feedbackContent,
      //   contact: contactInfo
      // })

      // 模拟提交反馈
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 重置表单
      this.setData({
        showFeedbackPopup: false,
        feedbackType: 'bug',
        feedbackContent: '',
        contactInfo: ''
      });

      wx.showToast({
        title: '反馈提交成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('提交反馈失败:', error)
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 查看检测记录
  onViewRecords() {
    wx.navigateTo({
      url: '/pages/records/records'
    })
  },

  // 查看报告记录
  onViewReports() {
    wx.navigateTo({
      url: '/pages/records/records'
    })
  },

  // 查看建档记录
  onViewFamily() {
    wx.navigateTo({
      url: '/pages/my-profile/my-profile'
    })
  },

  // 查看检测统计
  onViewPoints() {
    wx.showModal({
      title: '检测统计',
      content: `总检测次数：${this.data.stats.totalDetections}\n\n继续使用我们的服务，获得更多健康数据。`,
      showCancel: false
    })
  },

  // 我的档案
  onMyProfile() {
    wx.navigateTo({
      url: '/pages/my-profile/my-profile'
    })
  },

  // 我的检测记录
  onMyRecords() {
    wx.navigateTo({
      url: '/pages/records/records'
    })
  },

  // 我的优惠券
  onMyCoupons() {
    wx.navigateTo({
      url: '/pages/my-coupons/my-coupons'
    })
  },

  // 系统消息
  onSystemMessages() {
    wx.navigateTo({
      url: '/pages/system-messages/system-messages'
    })
  },

  // 关于我们
  onAboutUs() {
    wx.navigateTo({
      url: '/pages/about/about'
    })
  },

  // 分享有礼
  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '健康检测平台 - 专业AI健康分析',
      path: '/pages/index/index',
      imageUrl: '/images/share-cover.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '健康检测平台 - 专业AI健康分析',
      imageUrl: '/images/share-cover.png'
    }
  },

  // 调试方法
  async debugProfile() {
    try {
      console.log('开始调试个人中心...')
      const result = await profileDebug.debugProfile()
      
      // 显示调试结果
      wx.showModal({
        title: '调试结果',
        content: `Token: ${result.token ? '存在' : '不存在'}\nProfile接口: ${result.profile.success ? '成功' : '失败'}\nStats接口: ${result.stats.success ? '成功' : '失败'}`,
        showCancel: false
      })
    } catch (error) {
      console.error('调试失败:', error)
    }
  }
}) 