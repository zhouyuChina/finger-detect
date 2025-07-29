// HTTP请求工具类
const config = require('./config.js')

class Request {
  constructor() {
    this.baseUrl = config.getCurrentConfig().baseUrl
    this.timeout = config.timeout
    this.retryCount = config.retryCount
    this.requestQueue = [] // 请求队列
    this.isRefreshing = false // 是否正在刷新token
  }

  // 获取请求头
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }

    // 添加token
    const token = wx.getStorageSync('token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  // 显示加载提示
  showLoading(title = '加载中...') {
    wx.showLoading({
      title: title,
      mask: true
    })
  }

  // 隐藏加载提示
  hideLoading() {
    wx.hideLoading()
  }

  // 显示错误提示
  showError(message) {
    wx.showToast({
      title: message,
      icon: 'error',
      duration: 2000
    })
  }

  // 处理响应
  handleResponse(response, resolve, reject) {
    const { statusCode, data } = response

    if (statusCode === 200) {
      if (data.code === config.errorCodes.SUCCESS) {
        resolve(data)
      } else if (data.code === config.errorCodes.UNAUTHORIZED) {
        // token过期，尝试刷新
        this.handleTokenExpired(resolve, reject)
      } else {
        const errorMsg = data.message || config.errorMessages[data.code] || config.errorMessages.default
        this.showError(errorMsg)
        reject(data)
      }
    } else {
      const errorMsg = config.errorMessages[statusCode] || config.errorMessages.default
      this.showError(errorMsg)
      reject({
        code: statusCode,
        message: errorMsg
      })
    }
  }

  // 处理token过期
  handleTokenExpired(resolve, reject) {
    if (this.isRefreshing) {
      // 如果正在刷新，将请求加入队列
      this.requestQueue.push({ resolve, reject })
      return
    }

    this.isRefreshing = true

    // 尝试刷新token
    this.refreshToken()
      .then(() => {
        // 刷新成功，重试队列中的请求
        this.requestQueue.forEach(({ resolve, reject }) => {
          resolve()
        })
        this.requestQueue = []
        this.isRefreshing = false
      })
      .catch(() => {
        // 刷新失败，跳转到登录页
        this.requestQueue.forEach(({ resolve, reject }) => {
          reject()
        })
        this.requestQueue = []
        this.isRefreshing = false
        
        // 清除本地存储
        wx.removeStorageSync('token')
        wx.removeStorageSync('userInfo')
        
        // 跳转到登录页
        wx.reLaunch({
          url: '/pages/login/login'
        })
      })
  }

  // 刷新token
  refreshToken() {
    return new Promise((resolve, reject) => {
      const refreshToken = wx.getStorageSync('refreshToken')
      if (!refreshToken) {
        reject()
        return
      }

      wx.request({
        url: `${this.baseUrl}/user/refresh-token`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === config.errorCodes.SUCCESS) {
            wx.setStorageSync('token', res.data.data.token)
            wx.setStorageSync('refreshToken', res.data.data.refreshToken)
            resolve()
          } else {
            reject()
          }
        },
        fail: () => {
          reject()
        }
      })
    })
  }

  // 发送请求
  request(options) {
    return new Promise((resolve, reject) => {
      const { url, method = 'GET', data = {}, showLoading = true, retry = 0 } = options

      if (showLoading) {
        this.showLoading()
      }

      wx.request({
        url: `${this.baseUrl}${url}`,
        method: method,
        data: data,
        header: this.getHeaders(),
        timeout: this.timeout,
        success: (response) => {
          if (showLoading) {
            this.hideLoading()
          }
          this.handleResponse(response, resolve, reject)
        },
        fail: (error) => {
          if (showLoading) {
            this.hideLoading()
          }

          // 网络错误，尝试重试
          if (retry < this.retryCount) {
            console.log(`请求失败，第${retry + 1}次重试:`, url)
            setTimeout(() => {
              this.request({
                ...options,
                retry: retry + 1
              }).then(resolve).catch(reject)
            }, 1000 * (retry + 1)) // 递增延迟
          } else {
            this.showError(config.errorMessages.NETWORK_ERROR)
            reject({
              code: config.errorCodes.NETWORK_ERROR,
              message: config.errorMessages.NETWORK_ERROR
            })
          }
        }
      })
    })
  }

  // GET请求
  get(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'GET',
      data,
      ...options
    })
  }

  // POST请求
  post(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'POST',
      data,
      ...options
    })
  }

  // PUT请求
  put(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'PUT',
      data,
      ...options
    })
  }

  // DELETE请求
  delete(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'DELETE',
      data,
      ...options
    })
  }

  // 文件上传
  upload(filePath, options = {}) {
    return new Promise((resolve, reject) => {
      const { url = '/upload', name = 'file', formData = {}, showLoading = true } = options

      if (showLoading) {
        this.showLoading('上传中...')
      }

      wx.uploadFile({
        url: `${config.getCurrentConfig().uploadUrl}${url}`,
        filePath: filePath,
        name: name,
        formData: formData,
        header: this.getHeaders(),
        success: (response) => {
          if (showLoading) {
            this.hideLoading()
          }
          
          try {
            const data = JSON.parse(response.data)
            this.handleResponse({
              statusCode: response.statusCode,
              data: data
            }, resolve, reject)
          } catch (error) {
            this.showError('上传失败')
            reject(error)
          }
        },
        fail: (error) => {
          if (showLoading) {
            this.hideLoading()
          }
          this.showError('上传失败')
          reject(error)
        }
      })
    })
  }
}

// 创建单例实例
const request = new Request()

module.exports = request 