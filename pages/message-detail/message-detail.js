// message-detail.js
const api = require('../../utils/api.js')
const storage = require('../../utils/storage.js')
const common = require('../../utils/common.js')
const config = require('../../utils/config.js')

Page({
  data: {
    articleId: null,
    articleDetail: {},
    loading: false,
    error: false,
    errorMessage: ''
  },

  onLoad(options) {
    const { id } = options
    console.log('Message详情页面加载，文章ID:', id)
    
    if (!id) {
      this.setData({ 
        error: true, 
        errorMessage: '缺少文章ID参数' 
      })
      return
    }
    
    this.setData({ articleId: id })
    this.loadArticleDetail(id)
  },

  // 加载文章详情
  async loadArticleDetail(id) {
    try {
      this.setData({ loading: true, error: false })
      
      console.log('开始加载文章详情，ID:', id)
      const response = await api.message.getNewsDetail(id)
      console.log('文章详情接口响应:', response)
      
      if (response.success && response.data) {
        const articleDetail = this.formatArticleData(response.data)
        this.setData({ articleDetail })
        
        // 缓存文章详情
        storage.setArticleDetail(id, articleDetail)
        console.log('文章详情加载成功:', articleDetail.title)
      } else {
        console.warn('文章详情接口返回错误:', response)
        this.handleError(response.message || '获取文章详情失败')
      }
    } catch (error) {
      console.error('加载文章详情失败:', error)
      this.handleError('网络错误，请稍后重试')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 格式化文章数据
  formatArticleData(data) {
    console.log('格式化文章数据，输入:', data)
    
    // 处理封面图片URL，如果是相对路径则拼接完整URL
    let coverImage = data.coverImage || data.image || ''
    if (coverImage && !coverImage.startsWith('http')) {
      const staticUrl = config.getCurrentConfig().staticUrl
      coverImage = staticUrl + coverImage
      console.log('处理文章图片URL:', data.coverImage, '->', coverImage)
    }

    // 处理发布时间
    const publishedAt = data.publishedAt || data.createdAt || new Date().toISOString()
    const publishTime = common.formatTime(new Date(publishedAt), 'YYYY-MM-DD HH:mm')

    return {
      id: data.id,
      title: data.title || '无标题',
      content: data.content || '',
      summary: data.summary || '',
      coverImage: coverImage,
      author: data.author || '系统',
      category: data.category || '资讯',
      tags: data.tags || [],
      readCount: data.readCount || 0,
      isPublished: data.isPublished || false,
      publishedAt: publishedAt,
      publishTime: publishTime,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    }
  },

  // 处理错误
  handleError(message) {
    this.setData({ 
      error: true, 
      errorMessage: message 
    })
    common.showError(message)
  },

  // 重新加载
  onRetry() {
    if (this.data.articleId) {
      this.loadArticleDetail(this.data.articleId)
    }
  },

  // 分享
  onShareAppMessage() {
    const { articleDetail } = this.data
    return {
      title: articleDetail.title || '健康检测资讯',
      path: `/pages/message-detail/message-detail?id=${this.data.articleId}`,
      imageUrl: articleDetail.coverImage
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { articleDetail } = this.data
    return {
      title: articleDetail.title || '健康检测资讯',
      imageUrl: articleDetail.coverImage
    }
  }
}) 