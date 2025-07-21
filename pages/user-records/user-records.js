// user-records.js
Page({
  data: {
    userId: null,
    userName: '',
    userRecords: [
      {
        id: 1,
        part: '左手无名指',
        description: '检测部位的描述 (左手无名指)',
        date: '2025年7月20日',
        hasImage: false,
        imagePath: ''
      },
      {
        id: 2,
        part: '右脚大拇指',
        description: '右脚大拇指',
        date: '2025年7月2日',
        hasImage: false,
        imagePath: ''
      },
      {
        id: 3,
        part: '左手食指',
        description: '左手食指',
        date: '2025年6月28日',
        hasImage: false,
        imagePath: ''
      },
      {
        id: 4,
        part: '右手小指',
        description: '右手小指',
        date: '2025年6月25日',
        hasImage: false,
        imagePath: ''
      },
      {
        id: 5,
        part: '左脚小指',
        description: '左脚小指',
        date: '2025年6月20日',
        hasImage: true,
        imagePath: '/images/banner1.png'
      },
      {
        id: 6,
        part: '右手大拇指',
        description: '右手大拇指',
        date: '2025年6月15日',
        hasImage: true,
        imagePath: '/images/banner2.png'
      },
      {
        id: 7,
        part: '左脚大拇指',
        description: '左脚大拇指',
        date: '2025年6月10日',
        hasImage: false,
        imagePath: ''
      },
      {
        id: 8,
        part: '左手小指',
        description: '左手小指',
        date: '2025年6月5日',
        hasImage: true,
        imagePath: '/images/banner3.png'
      },
      {
        id: 9,
        part: '右脚小指',
        description: '右脚小指',
        date: '2025年5月30日',
        hasImage: false,
        imagePath: ''
      },
      {
        id: 10,
        part: '右手无名指',
        description: '右手无名指',
        date: '2025年5月25日',
        hasImage: true,
        imagePath: '/images/banner1.png'
      }
    ]
  },

  onLoad(options) {
    const { id, name } = options
    this.setData({
      userId: id,
      userName: name || '用户档案'
    })
    
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: `${this.data.userName}的档案`
    })
  },

  // 返回上一页
  onBack() {
    wx.navigateBack()
  },

  // 日期筛选
  onDateFilter() {
    wx.showActionSheet({
      itemList: ['全部', '最近7天', '最近30天', '最近3个月'],
      success: (res) => {
        const filterOptions = ['全部', '最近7天', '最近30天', '最近3个月']
        const selectedFilter = filterOptions[res.tapIndex]
        
        wx.showToast({
          title: `已选择：${selectedFilter}`,
          icon: 'none'
        })
        
        // 这里可以添加实际的筛选逻辑
        this.filterRecords(selectedFilter)
      }
    })
  },

  // 筛选记录
  filterRecords(filter) {
    // 根据筛选条件过滤记录
    console.log('筛选条件：', filter)
    // 实际项目中这里会调用API获取筛选后的数据
  },

  // 开始拍照
  onStartPhoto(e) {
    const { part, id } = e.currentTarget.dataset

    wx.navigateTo({
      url: `/pages/record-gallery/record-gallery?recordId=${id}&userId=${this.data.userId}&part=${part}`
    })
  },

  // 查看图片详情
  onViewImage(e) {
    const { id } = e.currentTarget.dataset
    const record = this.data.userRecords.find(item => item.id === id)
    
    if (record && record.hasImage) {
      wx.previewImage({
        urls: [record.imagePath],
        current: record.imagePath
      })
    } else {
      wx.showToast({
        title: '暂无图片',
        icon: 'none'
      })
    }
  },

  // 分享记录
  onShareRecord(e) {
    const { id } = e.currentTarget.dataset
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: `${this.data.userName}的健康检测记录`,
      path: `/pages/user-records/user-records?id=${this.data.userId}&name=${this.data.userName}`,
      imageUrl: '/images/share-cover.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: `${this.data.userName}的健康检测记录`,
      imageUrl: '/images/share-cover.png'
    }
  }
}) 