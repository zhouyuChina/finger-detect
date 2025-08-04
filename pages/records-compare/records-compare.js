// records-compare.js
const api = require('../../utils/api.js')
const common = require('../../utils/common.js')

Page({
  data: {
    searchValue: '',
    activeTab: 'all',
    loading: false,
    
    // 分页参数
    page: 1,
    limit: 20,
    filter: 'all',
    
    // 档案数据
    ownArchives: [],
    otherArchives: [],
    subUsers: [],
    
    // 统计数据
    totalOwn: 0,
    totalOthers: 0,
    totalAll: 0,
    ownSubUserId: '',
    
    // 筛选后的数据
    filteredRecords: [],
    myRecords: [],
    otherRecords: []
  },

  onLoad() {
    this.loadArchives()
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadArchives()
  },

  // 加载档案数据
  async loadArchives() {
    try {
      this.setData({ loading: true })
      
      const params = {
        page: this.data.page,
        limit: this.data.limit,
        filter: this.data.filter
      }
      
      // console.log('加载档案数据，参数:', params)
      
      const response = await api.profile.getAllArchives(params)
      // console.log('档案数据响应:', response)
      
      if (response.success && response.data) {
        const { 
          ownArchives, 
          otherArchives, 
          totalOwn, 
          totalOthers, 
          totalAll, 
          subUsers, 
          ownSubUserId 
        } = response.data
        
        // 先设置ownSubUserId，然后格式化档案数据
        this.setData({
          ownSubUserId: ownSubUserId || ''
        })
        
        // 格式化档案数据
        const formattedOwnArchives = this.formatArchives(ownArchives, 'mine', ownSubUserId)
        const formattedOtherArchives = this.formatArchives(otherArchives, 'others', ownSubUserId)
        
        this.setData({
          ownArchives: formattedOwnArchives,
          otherArchives: formattedOtherArchives,
          subUsers: subUsers || [],
          totalOwn: totalOwn || 0,
          totalOthers: totalOthers || 0,
          totalAll: totalAll || 0
        })
        
        // 合并所有档案并筛选
        this.filterRecords()
      } else {
        console.warn('获取档案数据失败:', response)
        common.showError(response.message || '获取档案数据失败')
      }
    } catch (error) {
      console.error('加载档案数据失败:', error)
      common.showError('加载档案数据失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 格式化档案数据
  formatArchives(archives, type, ownSubUserId = '') {
    if (!Array.isArray(archives)) {
      return []
    }
    
    return archives.map(archive => ({
      id: archive.id,
      name: archive.archiveName || archive.name,
      avatar: archive.avatarUrl || "/images/profile-avatar.png",
      type: type,
      updateTime: this.formatTime(archive.updatedAt || archive.updateTime),
      recordCount: archive.totalDetections || archive.photoCount || archive.recordCount || 0,
      username: archive.username,
      subUserId: archive.subUserId || archive.userId || (type === 'mine' ? ownSubUserId : ''), // 添加subUserId字段
      bodyPart: archive.bodyPart,
      createdAt: this.formatTime(archive.createdAt),
      originalData: archive
    }))
  },

  // 格式化时间
  formatTime(timeStr) {
    if (!timeStr) return ''
    
    try {
      const date = new Date(timeStr)
      const now = new Date()
      const diff = now - date
      const oneDay = 24 * 60 * 60 * 1000
      
      if (diff < oneDay) {
        // 今天
        return date.toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      } else if (diff < 2 * oneDay) {
        // 昨天
        return '昨天 ' + date.toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      } else if (diff < 7 * oneDay) {
        // 一周内
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        return days[date.getDay()] + ' ' + date.toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      } else {
        // 更早
        return date.toLocaleDateString('zh-CN', { 
          month: '2-digit', 
          day: '2-digit' 
        })
      }
    } catch (error) {
      return timeStr
    }
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

  // 标签页切换
  onTabChange(e) {
    const value = e.detail.value
    this.setData({
      activeTab: value
    })
    this.filterRecords()
  },

  // 筛选记录
  filterRecords() {
    const { ownArchives, otherArchives, searchValue, activeTab } = this.data
    
    // 合并所有档案
    const allRecords = [...ownArchives, ...otherArchives]
    
    // 根据搜索关键词筛选
    let filtered = allRecords
    if (searchValue) {
      filtered = allRecords.filter(item => 
        item.name.includes(searchValue)
      )
    }
    
    // 根据标签页筛选
    let myRecords = filtered.filter(item => item.type === 'mine')
    let otherRecords = filtered.filter(item => item.type === 'others')
    
    this.setData({
      filteredRecords: filtered,
      myRecords: myRecords,
      otherRecords: otherRecords,
      totalCount: filtered.length
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadArchives().then(() => {
      wx.stopPullDownRefresh()
    }).catch(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 创建档案
  onCreateProfile() {
    wx.navigateTo({
      url: '/pages/create-profile/create-profile'
    })
  },

  // 档案项点击 - 查看历史记录
  onRecordClick(e) {
    const { id } = e.currentTarget.dataset
    const allRecords = [...this.data.ownArchives, ...this.data.otherArchives]
    const record = allRecords.find(item => item.id === id)
    
    if (record) {
      // 跳转到档案图片墙页面
      wx.navigateTo({
        url: `/pages/record-gallery/record-gallery?subUserId=${record.subUserId || ''}&archiveName=${encodeURIComponent(record.name)}&archiveId=${id}`
      })
    }
  },

  // 加载更多
  onLoadMore() {
    if (this.data.loading) return
    
    this.setData({
      page: this.data.page + 1
    })
    this.loadArchives()
  }
}) 