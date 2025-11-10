// records-compare.js
const api = require('../../utils/api.js')
const common = require('../../utils/common.js')
const storage = require('../../utils/storage.js')

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
    otherRecords: [],
    filteredUserArchives: [],

    // 其他档案用户选择相关
    selectedUserId: '', // 当前选中的用户ID
    selectedUserName: '', // 当前选中的用户名
    userArchives: [], // 选中用户的档案列表
    showUserList: true, // 是否显示用户列表（true显示用户列表，false显示用户档案）
    userListLoading: false, // 用户列表加载状态
    userArchivesLoading: false, // 用户档案加载状态

    // 下拉选择相关
    showDropdown: false, // 是否显示下拉列表
    presetOptions: [ // 预设的检测部位选项
      { label: '大拇指', value: '大拇指' },
      { label: '食指', value: '食指' },
      { label: '中指', value: '中指' },
      { label: '无名指', value: '无名指' },
      { label: '小指', value: '小指' },
    ],
    filteredPresetOptions: [] // 过滤后的预设选项
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
      
      // 检查用户是否已登录
      const storage = require('../../utils/storage.js')
      const userInfo = storage.getUserInfo()
      const openId = storage.getOpenId()
      
      if (!userInfo || !openId) {
        this.setData({ 
          loading: false,
          ownArchives: [],
          otherArchives: [],
          subUsers: [],
          totalOwn: 0,
          totalOthers: 0,
          totalAll: 0
        })
        return
      }
      
      const params = {
        page: this.data.page,
        limit: this.data.limit,
        filter: this.data.filter
      }
      
      
      const response = await api.profile.getAllArchives(params)
      
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
        
        // 计算每个用户的档案数量（排除本人档案）
        const userArchiveCounts = this.calculateUserArchiveCounts(formattedOtherArchives, ownSubUserId)
        
        // 为subUsers添加档案数量信息（排除本人）
        const subUsersWithCounts = (subUsers || []).filter(user => user.id !== ownSubUserId).map(user => ({
          ...user,
          archiveCount: userArchiveCounts[user.id] || 0
        }))
        
        this.setData({
          ownArchives: formattedOwnArchives,
          otherArchives: formattedOtherArchives,
          subUsers: subUsersWithCounts,
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
      updateTime: common.formatTimeRelative(archive.updatedAt || archive.updateTime),
      recordCount: archive.totalDetections || archive.photoCount || archive.recordCount || 0,
      username: archive.username,
      subUserId: archive.subUserId || archive.userId || (type === 'mine' ? ownSubUserId : ''), // 添加subUserId字段
      bodyPart: archive.bodyPart,
      createdAt: common.formatTimeRelative(archive.createdAt),
      originalData: archive
    }))
  },

  // 计算每个用户的档案数量（排除本人档案）
  calculateUserArchiveCounts(archives, ownSubUserId) {
    const counts = {}
    archives.forEach(archive => {
      const userId = archive.subUserId || archive.userId
      if (userId && userId !== ownSubUserId) {
        counts[userId] = (counts[userId] || 0) + 1
      }
    })
    return counts
  },

  // 搜索提交
  onSearch(e) {
    const value = e.detail.value
    this.setData({
      searchValue: value,
      showDropdown: false
    })
    this.filterRecords()
  },

  // 搜索内容变化
  onSearchChange(e) {
    const value = e.detail.value
    this.setData({
      searchValue: value
    })
    this.updatePresetOptions(value)
    this.filterRecords()
  },

  // 搜索框聚焦
  onSearchFocus() {
    this.updatePresetOptions(this.data.searchValue)
  },

  // 搜索框失焦
  onSearchBlur() {
    // 延迟隐藏下拉列表，以便点击事件能够触发
    setTimeout(() => {
      this.setData({ showDropdown: false })
    }, 200)
  },

  // 更新预设选项
  updatePresetOptions(searchValue) {
    const { presetOptions } = this.data

    let filtered = presetOptions

    // 如果有搜索关键词，则筛选匹配的选项
    if (searchValue) {
      filtered = presetOptions.filter(item =>
        item.label.includes(searchValue)
      )
    }

    this.setData({
      filteredPresetOptions: filtered,
      showDropdown: filtered.length > 0
    })
  },

  // 选择预设选项
  onPresetSelect(e) {
    const { value } = e.currentTarget.dataset
    this.setData({
      searchValue: value,
      showDropdown: false
    })
    this.filterRecords()
  },

  // 标签页切换
  onTabChange(e) {
    const value = e.detail.value
    this.setData({
      activeTab: value,
      // 切换到其他档案时，重置用户选择状态
      selectedUserId: '',
      selectedUserName: '',
      userArchives: [],
      showUserList: true
    })
    this.filterRecords()
  },

  // 筛选记录
  filterRecords() {
    const { ownArchives, otherArchives, userArchives, searchValue, activeTab, showUserList } = this.data

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

    // 对用户档案也应用搜索筛选
    let filteredUserArchives = userArchives
    if (searchValue && !showUserList) {
      filteredUserArchives = userArchives.filter(item =>
        item.name.includes(searchValue)
      )
    }

    this.setData({
      filteredRecords: filtered,
      myRecords: myRecords,
      otherRecords: otherRecords,
      filteredUserArchives: filteredUserArchives,
      totalCount: filtered.length
    })
  },

  // 用户选择
  onUserSelect(e) {
    const { userid, username } = e.currentTarget.dataset
    this.setData({
      selectedUserId: userid,
      selectedUserName: username,
      showUserList: false,
      userArchives: []
    })
    
    // 更新 currentSubUser 缓存
    const user = { id: userid, nickname: username };
    storage.setCurrentSubUser(user);
    
    // 同时更新全局用户信息中的 currentSubUser
    const currentUserInfo = storage.getUserInfo();
    if (currentUserInfo) {
      currentUserInfo.currentSubUser = user;
      storage.setUserInfo(currentUserInfo);
    }
    
    this.loadUserArchives(userid)
  },

  // 返回用户列表
  onBackToUserList() {
    this.setData({
      selectedUserId: '',
      selectedUserName: '',
      userArchives: [],
      showUserList: true
    })
  },

  // 加载指定用户的档案
  async loadUserArchives(userId) {
    try {
      this.setData({ userArchivesLoading: true })

      const params = {
        page: 1,
        limit: 50
      }

      const response = await api.profile.getArchives(userId, params)

      if (response.success && response.data) {
        const formattedArchives = this.formatArchives(response.data.archives || response.data.list || [], 'others', userId)
        this.setData({
          userArchives: formattedArchives
        })
        // 应用搜索筛选
        this.filterRecords()
      } else {
        console.warn('获取用户档案失败:', response)
        common.showError(response.message || '获取用户档案失败')
      }
    } catch (error) {
      console.error('加载用户档案失败:', error)
      common.showError('加载用户档案失败')
    } finally {
      this.setData({ userArchivesLoading: false })
    }
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
    const allRecords = [...this.data.ownArchives, ...this.data.otherArchives, ...this.data.userArchives]
    const record = allRecords.find(item => item.id === id)
    
    if (record) {
      // 跳转到档案图片墙页面
      wx.navigateTo({
        url: `/pages/record-gallery/record-gallery?subUserId=${record.subUserId || ''}&archiveId=${id}`
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
