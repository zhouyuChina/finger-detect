// system-messages.js
Page({
  data: {
    messages: [
      {
        id: 1,
        type: 'unread',
        icon: 'notification',
        title: '优惠券功能上线通知',
        preview: '优惠券功能正式上线，现在可以使用优惠券享受各种服务...',
        content: '好消息！我们的优惠券功能正式上线了。现在您可以使用优惠券享受各种服务，包括检测费用减免、会员特权等。新用户还可以获得专属优惠券，快来体验吧！',
        time: '2024-01-15 10:30',
        isImportant: true,
        typeText: '系统通知',
        actions: [
          {
            action: 'goToCoupons',
            text: '查看优惠券',
            theme: 'primary'
          }
        ]
      },
      {
        id: 2,
        type: 'unread',
        icon: 'notification',
        title: '检测完成通知',
        preview: '恭喜您完成健康检测，获得专属优惠券...',
        content: '恭喜您完成健康检测！根据我们的活动规则，您获得了专属优惠券。优惠券可用于下次检测费用减免、会员特权等服务。继续使用我们的服务，获得更多专属优惠！',
        time: '2024-01-14 16:45',
        isImportant: false,
        typeText: '检测通知',
        actions: [
          {
            action: 'goToCoupons',
            text: '查看优惠券',
            theme: 'primary'
          }
        ]
      },
      {
        id: 3,
        title: '检测报告已生成',
        preview: '您的最新健康检测报告已生成完成，请及时查看...',
        content: '您的健康检测报告已生成完成，检测结果显示各项指标正常。建议您定期进行健康检测，保持良好的生活习惯。如需详细解读报告内容，请联系我们的专业医生。',
        time: '2024-01-13 16:45',
        type: 'read',
        typeText: '检测报告',
        icon: 'file',
        isImportant: false,
        actions: [
          {
            text: '查看报告',
            theme: 'primary',
            action: 'viewReport'
          }
        ]
      },
      {
        id: 4,
        title: '积分到账通知',
        preview: '恭喜您完成健康检测，获得50积分奖励...',
        content: '恭喜您完成健康检测！根据我们的积分规则，您获得了50积分奖励。积分可用于兑换优惠券、会员特权等服务。继续使用我们的服务，获得更多积分奖励！',
        time: '2024-01-12 09:20',
        type: 'read',
        typeText: '积分通知',
        icon: 'gift',
        isImportant: false
      },
      {
        id: 5,
        title: '账号安全提醒',
        preview: '检测到您的账号在新设备登录，如非本人操作请及时修改密码...',
        content: '我们检测到您的账号在2024-01-11 15:30在新设备上登录。登录地点：北京市朝阳区。如非本人操作，请立即修改密码并联系客服。为了账号安全，建议您定期更换密码。',
        time: '2024-01-11 15:35',
        type: 'read',
        typeText: '安全提醒',
        icon: 'shield',
        isImportant: true,
        actions: [
          {
            text: '修改密码',
            theme: 'danger',
            action: 'changePassword'
          }
        ]
      }
    ],
    showDetailPopup: false,
    currentMessage: {},
    hasUnreadMessages: false
  },

  onLoad() {
    this.calculateUnreadCount();
  },

  onShow() {
    // 页面显示时刷新数据
    this.calculateUnreadCount();
  },

  // 计算未读消息数量
  calculateUnreadCount() {
    const unreadCount = this.data.messages.filter(msg => msg.type === 'unread').length;
    this.setData({
      hasUnreadMessages: unreadCount > 0
    });
  },

  // 点击消息
  onMessageClick(e) {
    const id = e.currentTarget.dataset.id;
    const message = this.data.messages.find(msg => msg.id === id);
    
    if (!message) return;

    this.setData({
      currentMessage: message,
      showDetailPopup: true
    });

    // 如果是未读消息，自动标记为已读
    if (message.type === 'unread') {
      this.markMessageAsRead(id);
    }
  },

  // 标记单条消息为已读
  markMessageAsRead(messageId) {
    const messages = this.data.messages.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, type: 'read' };
      }
      return msg;
    });

    this.setData({ messages });
    this.calculateUnreadCount();
  },

  // 标记当前消息为已读
  markAsRead() {
    const { currentMessage } = this.data;
    this.markMessageAsRead(currentMessage.id);
    
    // 更新当前消息状态
    this.setData({
      'currentMessage.type': 'read'
    });

    wx.showToast({
      title: '已标记为已读',
      icon: 'success'
    });
  },

  // 一键已读
  markAllAsRead() {
    wx.showModal({
      title: '确认操作',
      content: '确定要将所有未读消息标记为已读吗？',
      success: (res) => {
        if (res.confirm) {
          const messages = this.data.messages.map(msg => {
            if (msg.type === 'unread') {
              return { ...msg, type: 'read' };
            }
            return msg;
          });

          this.setData({ messages });
          this.calculateUnreadCount();

          wx.showToast({
            title: '已全部标记为已读',
            icon: 'success'
          });
        }
      }
    });
  },

  // 弹窗状态变化
  onDetailPopupChange(e) {
    this.setData({
      showDetailPopup: e.detail.visible
    });
  },

  // 关闭详情弹窗
  closeDetailPopup() {
    this.setData({
      showDetailPopup: false
    });
  },

  // 处理消息中的操作按钮
  onActionClick(e) {
    const action = e.currentTarget.dataset.action;
    
    switch (action.action) {
      case 'goToCoupons':
        wx.navigateTo({
          url: '/pages/my-coupons/my-coupons'
        });
        break;
      default:
        wx.showToast({
          title: '功能暂未开放',
          icon: 'none'
        });
    }

    // 关闭弹窗
    this.closeDetailPopup();
  },

  // 跳转到首页
  goToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
}); 