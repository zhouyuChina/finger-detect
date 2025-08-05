// about.js
const api = require('../../utils/api.js')

Page({
  data: {
    loading: true,
    aboutInfo: {
      name: '健康检测平台',
      logo: '',
      description: '我们致力于为用户提供专业、便捷的健康检测服务。通过先进的AI技术，为用户提供准确、快速的健康分析报告。',
      address: '',
      phone: '400-123-4567',
      email: '',
      website: 'www.healthdetect.com',
      wechat: '',
      version: '1.0.0',
      copyright: ''
    }
  },

  onLoad() {
    this.loadAboutInfo()
  },

  // 加载关于我们信息
  async loadAboutInfo() {
    try {
      this.setData({ loading: true })
      
      const res = await api.about.getInfo()
      
      if (res.success && res.data) {
        this.setData({
          aboutInfo: res.data,
          loading: false
        })
      } else {
        console.warn('获取关于我们信息失败:', res.message)
        this.setData({ loading: false })
      }
    } catch (error) {
      console.error('加载关于我们信息失败:', error)
      this.setData({ loading: false })
      
      wx.showToast({
        title: '加载失败，请稍后重试',
        icon: 'none'
      })
    }
  },

  // 拨打客服电话
  onCallService() {
    const phone = this.data.aboutInfo.phone
    if (!phone) {
      wx.showToast({
        title: '暂无客服电话',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '联系客服',
      content: `是否拨打客服电话：${phone}？`,
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: phone,
            fail: () => {
              wx.showToast({
                title: '拨打失败',
                icon: 'none'
              })
            }
          })
        }
      }
    })
  },

  // 访问官方网站
  onVisitWebsite() {
    const website = this.data.aboutInfo.website
    if (!website) {
      wx.showToast({
        title: '暂无官网信息',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '访问官网',
      content: `是否复制官网地址到剪贴板？\n${website}`,
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: website,
            success: () => {
              wx.showToast({
                title: '已复制到剪贴板',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },

  // 复制邮箱
  onCopyEmail() {
    const email = this.data.aboutInfo.email
    if (!email) {
      wx.showToast({
        title: '暂无邮箱信息',
        icon: 'none'
      })
      return
    }

    wx.setClipboardData({
      data: email,
      success: () => {
        wx.showToast({
          title: '邮箱已复制',
          icon: 'success'
        })
      }
    })
  },

  // 复制微信
  onCopyWechat() {
    const wechat = this.data.aboutInfo.wechat
    if (!wechat) {
      wx.showToast({
        title: '暂无微信信息',
        icon: 'none'
      })
      return
    }

    wx.setClipboardData({
      data: wechat,
      success: () => {
        wx.showToast({
          title: '微信号已复制',
          icon: 'success'
        })
      }
    })
  },

  // 意见反馈
  onFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '感谢您的反馈！我们会认真考虑您的建议。',
      showCancel: false
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadAboutInfo().then(() => {
      wx.stopPullDownRefresh()
    }).catch(() => {
      wx.stopPullDownRefresh()
    })
  }
}) 