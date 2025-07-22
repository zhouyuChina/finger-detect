// profile.js
Page({
  data: {
    userInfo: {
      name: "谢芳",
      phone: "159****3314",
      avatar: "/images/default-avatar.png"
    },
    stats: {
      totalRecords: 12,
      totalReports: 8,
      familyMembers: 3,
      totalDetections: 25,
      unreadMessages: 2
    },
    showFeedbackPopup: false,
    feedbackType: 'bug',
    feedbackContent: '',
    contactInfo: ''
  },

  onLoad() {
    // 页面加载
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
  submitFeedback() {
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

    // 模拟提交反馈
    setTimeout(() => {
      wx.hideLoading();
      
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
    }, 1500);
  },

  // 查看检测记录
  onViewRecords() {
    wx.navigateTo({
      url: '/pages/records/records'
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
  }
}) 