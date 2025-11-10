// record-gallery.js
const api = require('../../utils/api.js')
const common = require('../../utils/common.js')

Page({
  data: {
    // 档案信息
    archiveId: '',
    subUserId: '',
    archiveName: '',
    archive: {},
    
    // 检测记录
    detections: [],
    loading: false,
    
    // 首次检测图片
    firstDetectionImage: '',
    firstDetectionDate: '',
    
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
    const { subUserId, archiveId, archiveName } = options
    const decodedName = archiveName ? decodeURIComponent(archiveName) : ''
    
    this.setData({
      subUserId: subUserId || '',
      archiveId: archiveId || '',
      archiveName: decodedName
    })
    
    this.updateNavigationTitle(decodedName)
    
    if (!archiveId) {
      common.showError('缺少档案ID，无法加载检测记录')
      return
    }
    
    if (!subUserId) {
      common.showError('缺少用户信息，无法加载检测记录')
      return
    }
    
    // 加载档案检测记录
    this.loadArchiveDetections()
  },

  onShow() {
    if (this.data.archiveId && this.data.subUserId) {
      this.loadArchiveDetections()
    }
  },

  // 更新导航栏标题
  updateNavigationTitle(name) {
    const title = name ? `${name} - 检测历史` : '检测历史'
    wx.setNavigationBarTitle({ title })
  },

  // 加载档案检测记录
  async loadArchiveDetections() {
    try {
      this.setData({ loading: true })
      
      const { archiveId, subUserId } = this.data
      if (!archiveId || !subUserId) {
        common.showError('档案信息不完整，无法获取检测记录')
        this.setData({ loading: false })
        return
      }
      
      const params = {
        subUserId,
        archiveId,
        page: this.data.pagination.page,
        limit: this.data.pagination.limit
      }
      
      
      const response = await api.profile.getArchiveDetections(params)
      
      if (response.success && response.data) {
        const { report, pagination, subUser } = response.data
        const rawDetections = response.data.images || response.data.detections || []
        
        // 格式化检测记录
        const formattedDetections = this.formatDetections(rawDetections)
        
        
        // 设置首次检测图片数据（按时间排序，获取最早的检测记录）
        const sortedDetections = formattedDetections.sort((a, b) => {
          const timeA = new Date(a.originalData.createdAt || a.originalData.detectionTime || a.uploadTime)
          const timeB = new Date(b.originalData.createdAt || b.originalData.detectionTime || b.uploadTime)
          return timeA - timeB  // 升序排列，最早的在前
        })
        
        
        const firstDetection = sortedDetections.length > 0 ? sortedDetections[0] : null
        const firstDetectionImage = firstDetection ? firstDetection.imagePath : ''
        const firstDetectionDate = firstDetection ? firstDetection.uploadTime : ''
        
        const archiveInfo = report?.archive || report || {}
        const resolvedArchiveId = archiveInfo.id || archiveInfo.archiveId || archiveInfo._id || this.data.archiveId
        const resolvedArchiveName = archiveInfo.archiveName || archiveInfo.name || this.data.archiveName
        const resolvedSubUserId = archiveInfo.subUserId || archiveInfo.userId || subUser?.id || this.data.subUserId
        
        this.setData({
          archive: archiveInfo,
          archiveId: resolvedArchiveId,
          archiveName: resolvedArchiveName,
          subUserId: resolvedSubUserId,
          detections: sortedDetections,  // 使用排序后的检测记录
          firstDetectionImage: firstDetectionImage,
          firstDetectionDate: firstDetectionDate,
          pagination: pagination || this.data.pagination,
          currentIndex: Math.max(0, sortedDetections.length - 1) // 默认显示最后一张图片
        })
        
        this.updateNavigationTitle(resolvedArchiveName)
        
        // 如果有检测记录，滚动到最后一张图片的位置
        if (sortedDetections.length > 0) {
          const lastIndex = sortedDetections.length - 1
          this.scrollThumbnailToView(lastIndex)
        }
        
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
    
    // 获取静态资源基础URL
    const config = require('../../utils/config.js')
    const staticUrl = config.getCurrentConfig().staticUrl
    
    return detections.map(detection => {
      const confidence = detection.confidence || 0
      
      // 处理图片URL，如果是相对路径则拼接服务器地址
      let imagePath = detection.imageUrl || ''
      if (imagePath && !imagePath.startsWith('http') && !imagePath.startsWith('data:')) {
        imagePath = staticUrl + imagePath
      }
      
      return {
        id: detection.id,
        imagePath: imagePath,
        uploadTime: common.formatTime(detection.detectionTime || detection.createdAt, 'YYYY-MM-DD HH:mm:ss'),
        status: detection.result || 'normal',
        confidence: confidence,
        confidencePercent: confidence > 0 ? (confidence * 100).toFixed(1) : '0.0',
        detectionType: detection.detectionType,
        remark: detection.remark,
        originalData: detection
      }
    })
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
      url: `/pages/photo-detection/photo-detection?subUserId=${this.data.subUserId}&archiveId=${this.data.archiveId}`
    })
  },

  // 分享给朋友
  onShareAppMessage() {
    const { archiveName, detections } = this.data
    const title = archiveName ? `${archiveName} - 检测历史` : '检测历史'
    return {
      title,
      path: `/pages/record-gallery/record-gallery?subUserId=${this.data.subUserId}&archiveId=${this.data.archiveId}`,
      imageUrl: detections.length > 0 ? detections[0].imagePath : ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { archiveName, detections } = this.data
    return {
      title: archiveName ? `${archiveName} - 检测历史` : '检测历史',
      imageUrl: detections.length > 0 ? detections[0].imagePath : ''
    }
  },

  // 首次检测图片点击
  onFirstDetectionTap() {
    const { firstDetectionImage, detections } = this.data
    if (!firstDetectionImage || detections.length === 0) return
    
    // 预览首次检测图片
    wx.previewImage({
      current: firstDetectionImage,
      urls: [firstDetectionImage]
    })
  },

  // 首次检测图片加载成功
  onFirstDetectionLoad(e) {
  },

  // 首次检测图片加载失败
  onFirstDetectionError(e) {
    console.error('首次检测图片加载失败:', e.detail)
  }
}) 
