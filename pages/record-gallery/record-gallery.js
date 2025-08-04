// record-gallery.js
const api = require('../../utils/api.js')
const common = require('../../utils/common.js')

Page({
  data: {
    // 档案信息
    archiveId: '',
    username: '',
    archiveName: '',
    archive: {},
    
    // 检测记录
    detections: [],
    loading: false,
    
    // 图片浏览
    currentIndex: 0,
    scrollLeft: 0,
    
    // 分页信息
    pagination: {
      page: 1,
      limit: 1000, // 设置足够大的数，获取所有记录
      total: 0,
      totalPages: 1
    }
  },

  onLoad(options) {
    const { username, archiveName, archiveId } = options
    
    this.setData({
      username: decodeURIComponent(username || ''),
      archiveName: decodeURIComponent(archiveName || ''),
      archiveId: archiveId || ''
    })
    
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: `${decodeURIComponent(archiveName || '')} - 检测历史`
    })
    
    // 加载档案检测记录
    this.loadArchiveDetections()
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadArchiveDetections()
  },

  // 加载档案检测记录
  async loadArchiveDetections() {
    try {
      this.setData({ loading: true })
      
      const params = {
        username: this.data.username,
        archiveName: this.data.archiveName,
        page: this.data.pagination.page,
        limit: this.data.pagination.limit
      }
      
      console.log('加载档案检测记录，参数:', params)
      
      const response = await api.profile.getArchiveDetections(params)
      console.log('档案检测记录响应:', response)
      
      if (response.success && response.data) {
        const { report, images, pagination, subUser } = response.data
        
        console.log('原始检测记录数据:', images)
        console.log('检测记录数组长度:', images ? images.length : 0)
        
        // 格式化检测记录
        const formattedDetections = this.formatDetections(images)
        
        console.log('格式化后的检测记录:', formattedDetections)
        console.log('格式化后数组长度:', formattedDetections.length)
        
        this.setData({
          archive: report || {},
          detections: formattedDetections,
          pagination: pagination || this.data.pagination
        })
        
        console.log('档案检测记录加载成功，数量:', formattedDetections.length)
        console.log('当前页面数据状态:', {
          loading: this.data.loading,
          detectionsLength: this.data.detections.length,
          archive: this.data.archive
        })
      } else {
        console.warn('获取档案检测记录失败:', response)
        common.showError(response.message || '获取档案检测记录失败')
      }
    } catch (error) {
      console.error('加载档案检测记录失败:', error)
      common.showError('加载档案检测记录失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 格式化检测记录
  formatDetections(detections) {
    if (!Array.isArray(detections)) {
      return []
    }
    
    return detections.map(detection => {
      const confidence = detection.confidence || 0
      return {
        id: detection.id,
        imagePath: detection.imageUrl,
        uploadTime: this.formatTime(detection.detectionTime || detection.createdAt),
        status: detection.result || 'normal',
        confidence: confidence,
        confidencePercent: confidence > 0 ? (confidence * 100).toFixed(1) : '0.0',
        detectionType: detection.detectionType,
        remark: detection.remark,
        originalData: detection
      }
    })
  },

  // 格式化时间
  formatTime(timeStr) {
    if (!timeStr) return ''
    
    try {
      const date = new Date(timeStr)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return timeStr
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadArchiveDetections().then(() => {
      wx.stopPullDownRefresh()
    }).catch(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 返回上一页
  onBack() {
    wx.navigateBack()
  },

  // 轮播图切换
  onSwiperChange(e) {
    const current = e.detail.current
    this.setData({
      currentIndex: current
    })
    this.scrollThumbnailToView(current)
  },

  // 图片点击 - 预览大图
  onImageTap() {
    const { detections, currentIndex } = this.data
    if (detections.length === 0) return
    
    const currentImage = detections[currentIndex]
    if (!currentImage || !currentImage.imagePath) return
    
    // 准备预览图片列表
    const urls = detections
      .filter(item => item.imagePath)
      .map(item => item.imagePath)
    
    wx.previewImage({
      current: currentImage.imagePath,
      urls: urls
    })
  },

  // 缩略图点击
  onThumbnailTap(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      currentIndex: index
    })
    this.scrollThumbnailToView(index)
  },

  // 滚动缩略图到指定位置
  scrollThumbnailToView(index) {
    const { detections } = this.data
    if (detections.length === 0) return
    
    // 计算滚动位置
    const itemWidth = 120 // 缩略图宽度
    const containerWidth = 750 // 容器宽度（rpx）
    const scrollLeft = Math.max(0, index * itemWidth - containerWidth / 2 + itemWidth / 2)
    
    this.setData({
      scrollLeft: scrollLeft
    })
  },

  // 缩略图滚动
  onThumbnailScroll(e) {
    this.setData({
      scrollLeft: e.detail.scrollLeft
    })
  },

  // 上一张图片
  onPrevImage() {
    const { currentIndex, detections } = this.data
    if (detections.length === 0) return
    
    const newIndex = currentIndex > 0 ? currentIndex - 1 : detections.length - 1
    this.setData({
      currentIndex: newIndex
    })
    this.scrollThumbnailToView(newIndex)
  },

  // 下一张图片
  onNextImage() {
    const { currentIndex, detections } = this.data
    if (detections.length === 0) return
    
    const newIndex = currentIndex < detections.length - 1 ? currentIndex + 1 : 0
    this.setData({
      currentIndex: newIndex
    })
    this.scrollThumbnailToView(newIndex)
  },

  // 图片加载成功
  onImageLoad(e) {
    console.log('图片加载成功:', e.detail)
  },

  // 图片加载失败
  onImageError(e) {
    console.error('图片加载失败:', e.detail)
    // 可以设置默认图片
  },

  // 新增照片
  onNewPhoto() {
    // 跳转到拍照检测页面
    wx.navigateTo({
      url: `/pages/photo-detection/photo-detection?archiveId=${this.data.archiveId}&archiveName=${encodeURIComponent(this.data.archiveName)}&username=${encodeURIComponent(this.data.username)}`
    })
  },

  // 分享给朋友
  onShareAppMessage() {
    const { archiveName, detections } = this.data
    return {
      title: `${archiveName} - 检测历史`,
      path: `/pages/record-gallery/record-gallery?username=${encodeURIComponent(this.data.username)}&archiveName=${encodeURIComponent(archiveName)}&archiveId=${this.data.archiveId}`,
      imageUrl: detections.length > 0 ? detections[0].imagePath : ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { archiveName, detections } = this.data
    return {
      title: `${archiveName} - 检测历史`,
      imageUrl: detections.length > 0 ? detections[0].imagePath : ''
    }
  }
}) 