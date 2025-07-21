// record-gallery.js
Page({
  data: {
    recordId: null,
    userId: null,
    part: '',
    currentIndex: 0,
    scrollLeft: 0,
    currentRecord: {},
    photoList: [
      {
        id: 1,
        imagePath: 'https://picsum.photos/400/600?random=1',
        date: '2025年7月2日 15:30',
        description: '检测结果：正常',
        analysis: '各项指标均在正常范围内'
      },
      {
        id: 2,
        imagePath: 'https://picsum.photos/400/600?random=2',
        date: '2025年6月28日 14:20',
        description: '检测结果：轻微异常',
        analysis: '建议定期复查'
      },
      {
        id: 3,
        imagePath: 'https://picsum.photos/400/600?random=3',
        date: '2025年6月25日 10:15',
        description: '检测结果：正常',
        analysis: '恢复情况良好'
      },
      {
        id: 4,
        imagePath: 'https://picsum.photos/400/600?random=4',
        date: '2025年6月20日 16:45',
        description: '检测结果：正常',
        analysis: '治疗效果显著'
      },
      {
        id: 5,
        imagePath: 'https://picsum.photos/400/600?random=5',
        date: '2025年6月15日 09:30',
        description: '检测结果：异常',
        analysis: '需要进一步治疗'
      },
      {
        id: 6,
        imagePath: 'https://picsum.photos/400/600?random=6',
        date: '2025年6月10日 11:20',
        description: '检测结果：正常',
        analysis: '恢复进展良好'
      },
      {
        id: 7,
        imagePath: 'https://picsum.photos/400/600?random=7',
        date: '2025年6月5日 16:30',
        description: '检测结果：轻微异常',
        analysis: '需要继续观察'
      },
      {
        id: 8,
        imagePath: 'https://picsum.photos/400/600?random=8',
        date: '2025年5月30日 13:45',
        description: '检测结果：正常',
        analysis: '治疗效果良好'
      },
      {
        id: 9,
        imagePath: 'https://picsum.photos/400/600?random=9',
        date: '2025年5月25日 09:15',
        description: '检测结果：轻微异常',
        analysis: '需要继续观察'
      },
      {
        id: 10,
        imagePath: 'https://picsum.photos/400/600?random=10',
        date: '2025年5月20日 14:30',
        description: '检测结果：正常',
        analysis: '恢复情况良好'
      }
    ]
  },

  onLoad(options) {
    console.log('record-gallery onLoad options:', options)
    
    const { recordId, userId, part } = options
    this.setData({
      recordId: recordId,
      userId: userId,
      part: part,
      currentRecord: {
        part: part
      }
    })
    
    console.log('record-gallery data set:', this.data)
    
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: `${part} - 检测历史`
    })
    
    // 直接更新数据，不模拟加载延迟
    this.updatePhotoList()
  },

  // 直接更新图片列表
  updatePhotoList() {
    console.log('更新图片列表：', this.data.part)
    
    // 根据部位更新描述
    const updatedPhotoList = this.data.photoList.map(item => ({
      ...item,
      description: `${this.data.part} - ${item.description}`,
      analysis: `${this.data.part}检测：${item.analysis}`
    }))
    
    this.setData({
      photoList: updatedPhotoList
    })
    
    console.log('图片列表更新完成，共', updatedPhotoList.length, '张图片')
  },

  // 加载拍照历史（保留用于后续API调用）
  loadPhotoHistory() {
    console.log('加载拍照历史：', this.data.part)
    
    // 模拟API调用延迟
    wx.showLoading({
      title: '加载中...'
    })
    
    setTimeout(() => {
      // 根据部位生成不同的mock数据
      const mockData = this.generateMockData()
      
      this.setData({
        photoList: mockData
      })
      
      wx.hideLoading()
      console.log('拍照历史加载完成，共', mockData.length, '张图片')
    }, 1000)
  },

  // 生成mock数据
  generateMockData() {
    const { part } = this.data
    const baseData = [
      {
        id: 1,
        imagePath: 'https://picsum.photos/400/600?random=1',
        date: '2025年7月2日 15:30',
        description: '检测结果：正常',
        analysis: '各项指标均在正常范围内'
      },
      {
        id: 2,
        imagePath: 'https://picsum.photos/400/600?random=2',
        date: '2025年6月28日 14:20',
        description: '检测结果：轻微异常',
        analysis: '建议定期复查'
      },
      {
        id: 3,
        imagePath: 'https://picsum.photos/400/600?random=3',
        date: '2025年6月25日 10:15',
        description: '检测结果：正常',
        analysis: '恢复情况良好'
      },
      {
        id: 4,
        imagePath: 'https://picsum.photos/400/600?random=4',
        date: '2025年6月20日 16:45',
        description: '检测结果：正常',
        analysis: '治疗效果显著'
      },
      {
        id: 5,
        imagePath: 'https://picsum.photos/400/600?random=5',
        date: '2025年6月15日 09:30',
        description: '检测结果：异常',
        analysis: '需要进一步治疗'
      },
      {
        id: 6,
        imagePath: 'https://picsum.photos/400/600?random=6',
        date: '2025年6月10日 11:20',
        description: '检测结果：正常',
        analysis: '恢复进展良好'
      },
      {
        id: 7,
        imagePath: 'https://picsum.photos/400/600?random=7',
        date: '2025年6月5日 16:30',
        description: '检测结果：轻微异常',
        analysis: '需要继续观察'
      },
      {
        id: 8,
        imagePath: 'https://picsum.photos/400/600?random=8',
        date: '2025年5月30日 13:45',
        description: '检测结果：正常',
        analysis: '治疗效果良好'
      },
      {
        id: 9,
        imagePath: 'https://picsum.photos/400/600?random=9',
        date: '2025年5月25日 09:15',
        description: '检测结果：轻微异常',
        analysis: '需要继续观察'
      },
      {
        id: 10,
        imagePath: 'https://picsum.photos/400/600?random=10',
        date: '2025年5月20日 14:30',
        description: '检测结果：正常',
        analysis: '恢复情况良好'
      }
    ]
    
    // 根据部位添加特定的描述
    return baseData.map(item => ({
      ...item,
      description: `${part} - ${item.description}`,
      analysis: `${part}检测：${item.analysis}`
    }))
  },

  // 返回上一页
  onBack() {
    wx.navigateBack()
  },

  // 分享
  onShare() {
    wx.showToast({
      title: '分享功能开发中',
      icon: 'none'
    })
  },

  // Swiper切换事件
  onSwiperChange(e) {
    
    const { current } = e.detail
    this.setData({
      currentIndex: current
    })
  },

  // 点击大图片
  onImageTap() {
    // console.log('e', e)
    // // 取消点击大图片的刷新功能，只保留预览功能
    // const { index } = e.currentTarget.dataset
    // const currentPhoto = this.data.photoList[index]
    
    // 预览图片
    // wx.previewImage({
    //   urls: this.data.photoList.map(item => item.imagePath),
    //   current: currentPhoto.imagePath
    // })
  },

  // 点击缩略图
  onThumbnailTap(e) {
    const { index } = e.currentTarget.dataset
    this.setData({
      currentIndex: index
    })
    
    // 滚动缩略图到可见区域
    this.scrollThumbnailToView(index)
  },

  // 滚动缩略图到可见区域
  scrollThumbnailToView(index) {
    // 使用选择器获取缩略图元素并滚动到可见区域
    const query = wx.createSelectorQuery()
    query.select('.thumbnail-list').boundingClientRect()
    query.selectAll('.thumbnail-item').boundingClientRect()
    query.exec((res) => {
      if (res[0] && res[1]) {
        const container = res[0]
        const items = res[1]
        if (items[index]) {
          const item = items[index]
          const scrollLeft = item.left - container.left - (container.width - item.width) / 2
          
          // 使用scroll-left属性滚动
          this.setData({
            scrollLeft: scrollLeft
          })
        }
      }
    })
  },

  // 处理scroll-view的滚动事件
  onThumbnailScroll(e) {
    // 可以在这里处理滚动事件，比如更新当前可见的缩略图
    console.log('缩略图滚动:', e.detail)
  },

  // 上一张图片
  onPrevImage() {

    console.log('currentIndex', this.data.currentIndex)

    // 如果是第一张，直接返回，不执行任何操作
    if (this.data.currentIndex === 0) {
      wx.showToast({
        title: '已经是第一张了',
        icon: 'none',
        duration: 1000
      })
      return
    }
    
    const newIndex = this.data.currentIndex - 1
    this.setData({
      currentIndex: newIndex
    })
    // 滚动缩略图到可见区域
    setTimeout(() => {
      this.scrollThumbnailToView(newIndex)
    }, 100)
  },

  // 下一张图片
  onNextImage() {
    // 如果是最后一张，直接返回，不执行任何操作
    if (this.data.currentIndex === this.data.photoList.length - 1) {
      wx.showToast({
        title: '已经是最后一张了',
        icon: 'none',
        duration: 1000
      })
      return
    }
    
    const newIndex = this.data.currentIndex + 1
    this.setData({
      currentIndex: newIndex
    })
    // 滚动缩略图到可见区域
    setTimeout(() => {
      this.scrollThumbnailToView(newIndex)
    }, 100)
  },

  // 图片加载成功
  onImageLoad(e) {
    console.log('图片加载成功:', e.detail)
  },

  // 图片加载失败
  onImageError(e) {
    console.log('图片加载失败:', e.detail)
    const { index } = e.currentTarget.dataset
    
    // 设置默认图片
    const photoList = this.data.photoList
    photoList[index].imagePath = 'https://picsum.photos/400/600?random=' + (index + 100)
    
    this.setData({
      photoList: photoList
    })
  },

  // 新增拍照
  onNewPhoto() {
    wx.showModal({
      title: '新增拍照',
      content: `确定要为${this.data.part}新增拍照检测吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/photo-detection/photo-detection?userId=${this.data.userId}&part=${this.data.part}&recordId=${this.data.recordId}`
          })
        }
      }
    })
  },

  // 对比分析
  onCompare() {
    if (this.data.photoList.length < 2) {
      wx.showToast({
        title: '至少需要2张图片才能对比',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '对比分析',
      content: '对比分析功能正在开发中，敬请期待！',
      showCancel: false
    })
  },

  // 分享给朋友
  onShareAppMessage() {
    const currentPhoto = this.data.photoList[this.data.currentIndex]
    return {
      title: `${this.data.part}检测历史 - ${currentPhoto.date}`,
      path: `/pages/record-gallery/record-gallery?recordId=${this.data.recordId}&userId=${this.data.userId}&part=${this.data.part}`,
      imageUrl: currentPhoto.imagePath
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const currentPhoto = this.data.photoList[this.data.currentIndex]
    return {
      title: `${this.data.part}检测历史 - ${currentPhoto.date}`,
      imageUrl: currentPhoto.imagePath
    }
  }
}) 