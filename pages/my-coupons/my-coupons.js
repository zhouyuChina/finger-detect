// my-coupons.js
Page({
  data: {
    activeTab: 'unused', // 当前激活的标签页
    redeemCode: '', // 兑换码
    coupons: [
      {
        id: 1,
        value: '50',
        condition: '满500元可用',
        description: '仅可购买XXXX部分商品',
        image: '/images/banner1.png',
        status: 'unused', // unused, claimed, used, expired
        statusText: '未使用',
        expireDate: '2024-12-31'
      },
      {
        id: 2,
        value: '100',
        condition: '满1000元可用',
        description: '仅可购买XXXX部分商品',
        image: '/images/banner2.png',
        status: 'claimed', // 已领取
        statusText: '已领取',
        expireDate: '2024-12-31'
      },
      {
        id: 3,
        value: '30',
        condition: '满300元可用',
        description: '仅可购买XXXX部分商品',
        image: '/images/banner3.png',
        status: 'used', // 已使用
        statusText: '已使用',
        expireDate: '2024-12-31'
      },
      {
        id: 4,
        value: '20',
        condition: '满200元可用',
        description: '仅可购买XXXX部分商品',
        image: '/images/default-avatar.png',
        status: 'expired', // 已过期
        statusText: '已过期',
        expireDate: '2024-01-01'
      }
    ],
    filteredCoupons: []
  },

  onLoad() {
    this.filterCoupons();
  },

  onShow() {
    // 页面显示时刷新数据
    this.filterCoupons();
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
    this.filterCoupons();
  },

  // 过滤优惠券
  filterCoupons() {
    const { coupons, activeTab } = this.data;
    let filtered = [];

    switch (activeTab) {
      case 'unused':
        filtered = coupons.filter(coupon => coupon.status === 'unused');
        break;
      case 'used':
        filtered = coupons.filter(coupon => coupon.status === 'used');
        break;
      case 'expired':
        filtered = coupons.filter(coupon => coupon.status === 'expired');
        break;
      default:
        filtered = coupons;
    }

    this.setData({
      filteredCoupons: filtered
    });
  },

  // 兑换码输入
  onRedeemInput(e) {
    this.setData({
      redeemCode: e.detail.value
    });
  },

  // 兑换优惠券
  redeemCoupon() {
    const { redeemCode } = this.data;
    
    if (!redeemCode.trim()) {
      wx.showToast({
        title: '请输入兑换码',
        icon: 'error'
      });
      return;
    }

    wx.showLoading({
      title: '兑换中...'
    });

    // 模拟兑换过程
    setTimeout(() => {
      wx.hideLoading();
      
      // 模拟兑换成功
      wx.showModal({
        title: '兑换成功',
        content: `成功兑换优惠券：${redeemCode}`,
        showCancel: false,
        success: () => {
          // 清空输入框
          this.setData({
            redeemCode: ''
          });
          
          // 刷新优惠券列表
          this.loadCoupons();
        }
      });
    }, 1500);
  },

  // 点击优惠券
  onCouponClick(e) {
    const id = e.currentTarget.dataset.id;
    const coupon = this.data.coupons.find(c => c.id === id);
    
    if (!coupon) return;

    wx.showModal({
      title: '优惠券详情',
      content: `优惠券：¥${coupon.value}\n使用条件：${coupon.condition}\n说明：${coupon.description}\n状态：${coupon.statusText}`,
      showCancel: false
    });
  },

  // 领取优惠券
  claimCoupon(e) {
    const id = e.currentTarget.dataset.id;
    const coupon = this.data.coupons.find(c => c.id === id);
    
    if (!coupon) return;

    wx.showModal({
      title: '确认领取',
      content: `确定要领取这张¥${coupon.value}的优惠券吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '领取中...'
          });

          setTimeout(() => {
            wx.hideLoading();
            
            // 更新优惠券状态
            const coupons = this.data.coupons.map(c => {
              if (c.id === id) {
                return { ...c, status: 'claimed', statusText: '已领取' };
              }
              return c;
            });

            this.setData({ coupons });
            this.filterCoupons();

            wx.showToast({
              title: '领取成功',
              icon: 'success'
            });
          }, 1000);
        }
      }
    });
  },

  // 加载优惠券数据
  loadCoupons() {
    // 这里可以调用API获取优惠券数据
    // 暂时使用模拟数据
    this.filterCoupons();
  },

  // 跳转到首页
  goToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
}); 