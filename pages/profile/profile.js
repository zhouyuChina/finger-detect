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
    }
  },

  onLoad() {
    // 页面加载
  },

  // 编辑资料
  onEditProfile() {
    wx.showModal({
      title: '编辑资料',
      content: '编辑个人资料功能开发中',
      showCancel: false
    })
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