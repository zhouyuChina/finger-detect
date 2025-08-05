// my-coupons.js
const api = require('../../utils/api.js')
const couponHelper = require('../../utils/coupon-helper.js')

Page({
  data: {
    activeTab: 'unused', // 当前激活的标签页
    coupons: [], // 用户优惠券列表
    filteredCoupons: [], // 过滤后的优惠券
    loading: false, // 加载状态
    page: 1, // 当前页码
    pageSize: 10, // 每页数量
    hasMore: true // 是否有更多数据
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadData();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData();
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreData();
    }
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
    this.filterCoupons();
  },

  // 加载数据
  async loadData() {
    this.setData({ loading: true });
    
    try {
      await this.loadUserCoupons();
    } catch (error) {
      console.error('加载数据失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 刷新数据
  async refreshData() {
    this.setData({
      page: 1,
      hasMore: true,
      coupons: []
    });
    
    await this.loadData();
    wx.stopPullDownRefresh();
  },

  // 加载更多数据
  async loadMoreData() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({ loading: true });
    
    try {
      await this.loadUserCoupons(true);
    } catch (error) {
      console.error('加载更多数据失败:', error);
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载用户优惠券
  async loadUserCoupons(isLoadMore = false) {
    try {
      const params = {
        page: isLoadMore ? this.data.page + 1 : 1,
        pageSize: this.data.pageSize,
        status: this.data.activeTab
      };

      const response = await api.coupon.getUserCoupons(params);
      
      if (response.success && response.data) {
        const formattedCoupons = response.data.data.map(coupon => {
          const formatted = couponHelper.formatUserCoupon(coupon);
          // 为优惠券添加剩余时间文本
          if (formatted.coupon) {
            formatted.coupon.remainingTimeText = couponHelper.formatRemainingTime(formatted.coupon.endTime);
          }
          return formatted;
        });

        if (isLoadMore) {
          // 加载更多
          this.setData({
            coupons: [...this.data.coupons, ...formattedCoupons],
            page: this.data.page + 1,
            hasMore: response.data.pagination.page < response.data.pagination.totalPages
          });
        } else {
          // 首次加载
          this.setData({
            coupons: formattedCoupons,
            page: 1,
            hasMore: response.data.pagination.page < response.data.pagination.totalPages
          });
        }

        this.filterCoupons();
      }
    } catch (error) {
      console.error('加载用户优惠券失败:', error);
      throw error;
    }
  },

  // 过滤优惠券
  filterCoupons() {
    const { coupons, activeTab } = this.data;
    let filtered = [];

    switch (activeTab) {
      case 'unused':
        filtered = coupons.filter(coupon => coupon.status === couponHelper.userCouponStatus.UNUSED);
        break;
      case 'used':
        filtered = coupons.filter(coupon => coupon.status === couponHelper.userCouponStatus.USED);
        break;
      case 'expired':
        filtered = coupons.filter(coupon => coupon.status === couponHelper.userCouponStatus.EXPIRED);
        break;
      default:
        filtered = coupons;
    }

    this.setData({
      filteredCoupons: filtered
    });
  },



  // 点击优惠券
  onCouponClick(e) {
    const id = e.currentTarget.dataset.id;
    const userCoupon = this.data.filteredCoupons.find(c => c.id === id);
    
    if (!userCoupon || !userCoupon.coupon) return;

    const coupon = userCoupon.coupon;
    const statusText = couponHelper.getStatusText(userCoupon.status);
    const typeText = couponHelper.getTypeText(coupon.type);
    const expireDate = couponHelper.formatTime(coupon.endTime);
    const remainingTime = couponHelper.formatRemainingTime(coupon.endTime);

    let content = `优惠券：${coupon.name}\n`;
    content += `类型：${typeText}\n`;
    content += `面值：${couponHelper.getDisplayValue(coupon)}\n`;
    content += `使用条件：${couponHelper.getDisplayCondition(coupon)}\n`;
    content += `说明：${couponHelper.getDisplayDescription(coupon)}\n`;
    content += `状态：${statusText}\n`;
    content += `有效期：${expireDate}\n`;
    content += `剩余时间：${remainingTime}`;

    wx.showModal({
      title: '优惠券详情',
      content: content,
      showCancel: false
    });
  },

  // 领取优惠券
  async claimCoupon(e) {
    const couponId = e.currentTarget.dataset.id;
    const coupon = this.data.availableCoupons.find(c => c.id === couponId);
    
    if (!coupon) return;

    // 检查是否可以领取
    if (!couponHelper.canClaimCoupon(coupon, this.data.coupons)) {
      wx.showToast({
        title: '无法领取该优惠券',
        icon: 'error'
      });
      return;
    }

    wx.showModal({
      title: '确认领取',
      content: `确定要领取这张${couponHelper.getDisplayValue(coupon)}的优惠券吗？`,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '领取中...'
          });

          try {
            const response = await api.coupon.claimCoupon(couponId);
            
            wx.hideLoading();
            
            if (response.success) {
              wx.showToast({
                title: '领取成功',
                icon: 'success'
              });
              
              // 刷新数据
              this.loadData();
            } else {
              wx.showToast({
                title: response.message || '领取失败',
                icon: 'error'
              });
            }
          } catch (error) {
            wx.hideLoading();
            console.error('领取优惠券失败:', error);
            wx.showToast({
              title: '领取失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 跳转到首页
  goToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

}); 