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
    errorMessage: '',
    richTextLinks: [] // 存储富文本中的链接
  },

  onLoad(options) {
    const { id } = options
    
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

      const response = await api.message.getNewsDetail(id)

      if (response.success && response.data) {
        const articleDetail = this.formatArticleData(response.data)
        this.setData({ articleDetail })

        // 缓存文章详情
        storage.setArticleDetail(id, articleDetail)

        // 标记文章为已读
        this.markArticleAsRead(id)
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

  // 标记文章为已读
  async markArticleAsRead(articleId) {
    try {
      // 检查用户是否已登录
      const userInfo = storage.getUserInfo()
      const openId = storage.getOpenId()

      if (!userInfo || !openId) {
        // 未登录用户不标记已读
        return
      }

      // 调用标记已读接口
      await api.message.markArticleRead(articleId)

      // 更新Tab栏红点
      this.checkTabBarBadge()
    } catch (error) {
      console.error('标记文章已读失败:', error)
      // 标记失败不影响正常浏览
    }
  },

  // 检查并更新Tab栏红点
  checkTabBarBadge() {
    const app = getApp()
    if (app && typeof app.checkAndUpdateTabBarBadge === 'function') {
      app.checkAndUpdateTabBarBadge()
    }
  },

  // 格式化文章数据
  formatArticleData(data) {

    // 获取静态资源URL
    const staticUrl = config.getCurrentConfig().staticUrl

    // 处理封面图片URL，如果是相对路径则拼接完整URL
    let coverImage = data.coverImage || data.image || ''
    if (coverImage && !coverImage.startsWith('http')) {
      coverImage = staticUrl + coverImage
    }

    // 处理富文本内容中的图片URL
    let content = data.content || ''
    if (content) {
      // 替换 <img> 标签中的相对路径为完整URL
      content = content.replace(/<img\s+([^>]*?)src=["'](?!http)([^"']+)["']/gi, (match, attrs, src) => {
        // 如果src不是以http开头，则拼接完整URL
        const fullUrl = staticUrl + src
        return `<img ${attrs}src="${fullUrl}"`
      })

      // 同时处理可能存在的背景图片
      content = content.replace(/url\(["']?(?!http)([^"')]+)["']?\)/gi, (match, url) => {
        const fullUrl = staticUrl + url
        return `url("${fullUrl}")`
      })

      // mp-html 会自动处理链接，不需要手动提取
    }

    // 处理发布时间
    const publishedAt = data.publishedAt || data.createdAt || new Date().toISOString()
    const publishTime = common.formatTime(new Date(publishedAt), 'YYYY-MM-DD HH:mm')

    return {
      id: data.id,
      title: data.title || '无标题',
      content: content, // 使用处理后的内容
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

  // 处理富文本链接点击（mp-html 版本）
  onLinkTap(e) {
    const url = e.detail.href;
    console.log('点击链接:', url);

    if (!url) {
      wx.showToast({
        title: '链接地址无效',
        icon: 'none'
      });
      return;
    }

    // 判断链接类型
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // 外部链接：提示用户并复制到剪贴板
      wx.showModal({
        title: '打开外部链接',
        content: `即将复制链接到剪贴板：\n${url}`,
        confirmText: '复制链接',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.setClipboardData({
              data: url,
              success: () => {
                wx.showToast({
                  title: '链接已复制，请到浏览器打开',
                  icon: 'success',
                  duration: 2500
                });
              },
              fail: () => {
                wx.showToast({
                  title: '复制失败',
                  icon: 'none'
                });
              }
            });
          }
        }
      });
    } else {
      // 小程序内部链接：直接跳转
      wx.navigateTo({
        url: url,
        fail: (err) => {
          console.error('页面跳转失败:', err);
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      });
    }
  },

  // 视频播放事件（可选，用于统计）
  onVideoPlay(e) {
    const videoSrc = e.detail.src;
    console.log('视频开始播放:', videoSrc);
    // 这里可以添加视频播放统计逻辑
    // 例如：上报播放数据到服务器
  },

  // 打开链接
  openLink(e) {
    const index = e.currentTarget.dataset.index
    const url = this.data.richTextLinks[index]

    if (!url) {
      wx.showToast({
        title: '链接地址无效',
        icon: 'none'
      })
      return
    }

    console.log('打开链接:', url)

    // 判断链接类型
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // 外部链接：提示用户并复制到剪贴板
      wx.showModal({
        title: '打开外部链接',
        content: `即将复制链接到剪贴板：\n${url}`,
        confirmText: '复制链接',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.setClipboardData({
              data: url,
              success: () => {
                wx.showToast({
                  title: '链接已复制，请到浏览器打开',
                  icon: 'success',
                  duration: 2500
                })
              },
              fail: () => {
                wx.showToast({
                  title: '复制失败',
                  icon: 'none'
                })
              }
            })
          }
        }
      })
    } else {
      // 小程序内部链接：直接跳转
      wx.navigateTo({
        url: url,
        fail: (err) => {
          console.error('页面跳转失败:', err)
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          })
        }
      })
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