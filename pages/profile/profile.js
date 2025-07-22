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
      points: 12,
      unreadMessages: 2
    },
    settings: {
      notifications: true
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

      // 这里可以添加实际的提交逻辑
      console.log('提交反馈:', {
        type: feedbackType,
        content: feedbackContent,
        contact: contactInfo,
        timestamp: new Date().toISOString()
      });
    }, 1500);
  },



  // 查看检测记录
  onViewRecords() {
    wx.switchTab({
      url: '/pages/records/records'
    })
  },

  // 查看健康报告
  onViewReports() {
    wx.showToast({
      title: '健康报告功能开发中',
      icon: 'none'
    })
  },

  // 查看家庭成员
  onViewFamily() {
    wx.showToast({
      title: '家庭成员管理功能开发中',
      icon: 'none'
    })
  },

  // 查看积分
  onViewPoints() {
    wx.showModal({
      title: '我的积分',
      content: `当前积分：${this.data.stats.points}\n\n积分可用于兑换优惠券和特权服务。`,
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
    wx.switchTab({
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

  // 我的健康报告
  onMyReports() {
    wx.showToast({
      title: '健康报告功能开发中',
      icon: 'none'
    })
  },

  // 家庭成员管理
  onFamilyMembers() {
    wx.showToast({
      title: '家庭成员管理功能开发中',
      icon: 'none'
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