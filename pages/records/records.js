// records.js
Page({
  data: {
    searchValue: '',
    activeTab: 'all',
    totalCount: 0,
    lastDetectionTime: '2024-07-20 15:30',
    
    // 原始数据 - 档案列表
    recordList: [
      {
        id: 1,
        name: "张三",
        avatar: "/images/profile-avatar.png",
        type: "mine",
        updateTime: "2024-07-20",
        recordCount: 12,
      },
      {
        id: 2,
        name: "李四",
        avatar: "/images/profile-avatar.png",
        type: "others",
        updateTime: "2024-07-19",
        recordCount: 8,
      },
      {
        id: 3,
        name: "王五",
        avatar: "/images/profile-avatar.png",
        type: "others",
        updateTime: "2024-07-18",
        recordCount: 15,
      },
      {
        id: 4,
        name: "赵六",
        avatar: "/images/profile-avatar.png",
        type: "others",
        updateTime: "2024-07-17",
        recordCount: 6,     
      },
      {
        id: 5,
        name: "孙七",
        avatar: "/images/profile-avatar.png",
        type: "others",
        updateTime: "2024-07-16",
        recordCount: 10,
      },
      {
        id: 6,
        name: "周八",
        avatar: "/images/profile-avatar.png",
        type: "others",
        updateTime: "2024-07-15",
        recordCount: 7,
      },
      {
        id: 7,
        name: "吴九",
        avatar: "/images/profile-avatar.png",
        type: "others",
        updateTime: "2024-07-14",
        recordCount: 9,
      },
      {
        id: 8,
        name: "郑十",
        avatar: "/images/profile-avatar.png",
        type: "others",
        updateTime: "2024-07-13",
        recordCount: 5,
      },
      {
        id: 9,
        name: "谢芳",
        avatar: "/images/profile-avatar.png",
        type: "mine",
        updateTime: "2024-07-12",
        recordCount: 18,
      },
      {
        id: 10,
        name: "陈明",
        avatar: "/images/profile-avatar.png",
        type: "others",
        updateTime: "2024-07-11",
        recordCount: 11,
      }
    ],
    
    // 筛选后的数据
    filteredRecords: [],
    myRecords: [],
    otherRecords: []
  },

  onLoad() {
    this.filterRecords()
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
  },

  // 筛选记录
  filterRecords() {
    const { recordList, searchValue, activeTab } = this.data
    
    // 根据搜索关键词筛选
    let filtered = recordList
    if (searchValue) {
              filtered = recordList.filter(item => 
          item.name.includes(searchValue) || 
          item.updateTime.includes(searchValue)
        )
    }
    
    // 根据标签页筛选 - 始终计算所有分类的数据
    let myRecords = filtered.filter(item => item.type === 'mine')
    let otherRecords = filtered.filter(item => item.type === 'others')
    
    this.setData({
      filteredRecords: filtered,
      myRecords: myRecords,
      otherRecords: otherRecords,
      totalCount: filtered.length
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
    const record = this.data.recordList.find(item => item.id === id)
    
    if (record) {
      // 直接跳转到用户档案页面
      wx.navigateTo({
        url: `/pages/user-records/user-records?id=${id}&name=${record.name}`
      })
    }
  }
}) 