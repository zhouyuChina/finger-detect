// records.js
const api = require('../../utils/api.js')
const storage = require('../../utils/storage.js')
const common = require('../../utils/common.js')

Page({
  data: {
    searchValue: '',
    showDetailPopup: false,
    currentRecord: {},
    loading: false,

    // 检测记录数据
    detectionRecords: [],

    // 筛选后的数据
    filteredRecords: [],

    // 当前用户信息
    currentUser: null,
    currentSubUser: null
  },

  onLoad() {
    this.loadCurrentUser()
    this.loadDetectionRecords()
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadCurrentUser()
    this.loadDetectionRecords()
  },

  // 加载当前用户信息
  loadCurrentUser() {
    const userInfo = storage.getUserInfo()
    const currentSubUser = storage.getCurrentSubUser()

    this.setData({
      currentUser: userInfo,
      currentSubUser: currentSubUser
    })
  },

  // 加载检测记录
  async loadDetectionRecords() {
    try {
      this.setData({ loading: true })

      // 检查用户是否已登录
      const userInfo = storage.getUserInfo()
      const openId = storage.getOpenId()

      if (!userInfo || !openId) {
        this.setData({
          detectionRecords: [],
          filteredRecords: [],
          loading: false
        })
        return
      }

      // 获取当前子用户ID
      const currentSubUser = storage.getCurrentSubUser()
      const subUserId = currentSubUser?.id

      // 构建请求参数 - 只获取当前子用户的记录
      const params = {}
      if (subUserId) {
        params.subUserId = subUserId
      }

      // 调用API获取检测记录
      const response = await api.detection.getList(params)

      if (response.success && response.data) {
        const records = response.data.detections || response.data || []

        // 格式化检测记录
        const formattedRecords = this.formatDetectionRecords(records)

        this.setData({
          detectionRecords: formattedRecords,
          loading: false
        })

        // 执行筛选
        this.filterRecords()
      } else {
        this.setData({
          detectionRecords: [],
          filteredRecords: [],
          loading: false
        })
      }
    } catch (error) {
      console.error('加载检测记录失败:', error)
      this.setData({
        detectionRecords: [],
        filteredRecords: [],
        loading: false
      })
      common.showError('加载检测记录失败')
    }
  },

  // 格式化检测记录
  formatDetectionRecords(records) {
    if (!Array.isArray(records)) {
      return []
    }

    return records.map(record => {
      return {
        id: record.id,
        imagePath: record.imageUrl || record.imagePath || '/images/default-detection.png',
        description: record.description || record.result || '暂无描述',
        suggestions: record.suggestions || record.advice || '暂无建议',
        createTime: this.formatTime(record.createdAt || record.detectionTime),
        archiveName: record.archiveName || '未知档案',
        subUserName: record.subUserName || record.realName || '未知用户',
        subUserId: record.subUserId,
        // 保留原始数据
        originalData: record
      }
    })
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return '未知时间'

    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  // 搜索提交
  onSearch(e) {
    const value = e.detail.value
    this.setData({
      searchValue: value
    })
    this.filterRecords()
  },

  // 搜索内容变化
  onSearchChange(e) {
    const value = e.detail.value
    this.setData({
      searchValue: value
    })
    this.filterRecords()
  },

  // 筛选记录
  filterRecords() {
    const { detectionRecords, searchValue } = this.data
    
    // 根据搜索关键词筛选
    let filtered = detectionRecords
    if (searchValue) {
      filtered = detectionRecords.filter(item => 
        item.description.includes(searchValue) || 
        item.createTime.includes(searchValue) ||
        item.id.toString().includes(searchValue)
      )
    }
    
    this.setData({
      filteredRecords: filtered
    })
  },

  // 点击检测记录
  onRecordClick(e) {
    const id = e.currentTarget.dataset.id;
    const record = this.data.detectionRecords.find(r => r.id === id);
    
    if (!record) return;

    this.setData({
      currentRecord: record,
      showDetailPopup: true
    });
  },

  // 详情弹窗状态变化
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

  // 删除检测记录
  async deleteRecord(e) {
    const id = e.currentTarget.dataset.id;
    const record = this.data.detectionRecords.find(r => r.id === id);

    if (!record) return;

    wx.showModal({
      title: '确认删除',
      content: `确定要删除检测报告吗？此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#e34d59',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({
              title: '删除中...',
              mask: true
            })

            // 调用删除API
            const response = await api.detection.delete(id)

            wx.hideLoading()

            if (response.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })

              // 重新加载检测记录
              await this.loadDetectionRecords()
            } else {
              wx.showToast({
                title: response.message || '删除失败',
                icon: 'none'
              })
            }
          } catch (error) {
            wx.hideLoading()
            console.error('删除检测记录失败:', error)
            wx.showToast({
              title: '删除失败，请重试',
              icon: 'none'
            })
          }
        }
      }
    });
  },

  // 删除当前记录
  async deleteCurrentRecord() {
    const { currentRecord } = this.data;

    wx.showModal({
      title: '确认删除',
      content: `确定要删除检测报告吗？此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#e34d59',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({
              title: '删除中...',
              mask: true
            })

            // 调用删除API
            const response = await api.detection.delete(currentRecord.id)

            wx.hideLoading()

            if (response.success) {
              this.setData({
                showDetailPopup: false
              })

              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })

              // 重新加载检测记录
              await this.loadDetectionRecords()
            } else {
              wx.showToast({
                title: response.message || '删除失败',
                icon: 'none'
              })
            }
          } catch (error) {
            wx.hideLoading()
            console.error('删除检测记录失败:', error)
            wx.showToast({
              title: '删除失败，请重试',
              icon: 'none'
            })
          }
        }
      }
    });
  },

  // 预览图片
  previewImage() {
    const imagePath = this.data.currentRecord.imagePath;
    wx.previewImage({
      current: imagePath,
      urls: [imagePath]
    });
  },

  // 跳转到检测页面
  goToDetection() {
    wx.navigateTo({
      url: '/pages/photo-detection/photo-detection'
    });
  }
}) 