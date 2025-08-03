// HTTP请求工具类
const config = require('./config.js')
const storage = require('./storage.js')

class Request {
  constructor() {
    this.baseUrl = config.getCurrentConfig().baseUrl
    this.timeout = config.timeout
    this.retryCount = config.retryCount
    this.requestQueue = [] // 请求队列
    this.isRefreshing = false // 是否正在刷新token
    this.isGettingToken = false // 是否正在获取token
  }

  // 获取请求头
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }

    // 添加token
    const token = storage.getToken()
    console.log('当前存储的token:', token)
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
      console.log('添加Authorization头:', headers['Authorization'])
    } else {
      console.log('没有找到token，请求头中不包含Authorization')
    }

    // 添加openId
    const openId = storage.getOpenId()
    if (openId) {
      headers['X-Openid'] = openId
      console.log('添加X-Openid头:', openId)
    } else {
      console.log('没有找到openId，请求头中不包含X-Openid')
    }

    return headers
  }

  // 检查token是否存在
  hasToken() {
    return !!storage.getToken()
  }

  // 获取小程序token
  async getToken() {
    if (this.isGettingToken) {
      // 如果正在获取token，等待完成
      return new Promise((resolve, reject) => {
        const checkToken = () => {
          if (this.hasToken()) {
            resolve()
          } else if (!this.isGettingToken) {
            reject(new Error('获取token失败'))
          } else {
            setTimeout(checkToken, 100)
          }
        }
        checkToken()
      })
    }

    this.isGettingToken = true

    try {
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: `${this.baseUrl}${config.api.user.getToken}`,
          method: 'GET',
          timeout: this.timeout,
          success: resolve,
          fail: reject
        })
      })

      console.log('Token接口响应:', response)
      console.log('Token接口响应数据:', response.data)

      if (response.statusCode === 200) {
        const data = response.data
        console.log('处理Token响应数据:', data)
        
        // 检查响应格式
        if (data.success) {
          // 成功格式：{success: true, data: {...}, message: "xxx"}
          console.log('检测到success格式响应')
          
          if (data.data && data.data.token) {
            const token = data.data.token
            storage.setToken(token)
            console.log('获取token成功:', token)
          } else if (data.data && data.data.access_token) {
            // 有些接口使用access_token字段
            const token = data.data.access_token
            storage.setToken(token)
            console.log('获取access_token成功:', token)
          } else {
            // 开发模式可能没有token，生成一个临时token
            const tempToken = 'dev_token_' + Date.now()
            storage.setToken(tempToken)
            console.log('开发模式生成临时token:', tempToken)
          }
        } else if (data.code === config.errorCodes.SUCCESS) {
          // 标准格式：{code: 200, data: {...}, message: "xxx"}
          console.log('检测到code格式响应')
          
          if (data.data && data.data.token) {
            const token = data.data.token
            storage.setToken(token)
            console.log('获取token成功:', token)
          } else if (data.data && data.data.access_token) {
            const token = data.data.access_token
            storage.setToken(token)
            console.log('获取access_token成功:', token)
          } else {
            // 开发模式可能没有token，生成一个临时token
            const tempToken = 'dev_token_' + Date.now()
            storage.setToken(tempToken)
            console.log('开发模式生成临时token:', tempToken)
          }
        } else {
          console.log('未知响应格式，生成临时token')
          // 未知格式，生成临时token
          const tempToken = 'dev_token_' + Date.now()
          storage.setToken(tempToken)
          console.log('生成临时token:', tempToken)
        }
      } else {
        throw new Error(`HTTP ${response.statusCode}: ${response.data?.message || '获取token失败'}`)
      }
    } catch (error) {
      console.error('获取token失败:', error)
      // 开发模式下不抛出错误，静默处理
      console.log('开发模式：静默处理token获取失败')
    } finally {
      this.isGettingToken = false
    }
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
      // 支持开发模式测试接口格式：{success: true, data: {...}, message: "xxx"}
      if (data.success === true) {
        console.log('检测到开发模式成功响应')
        resolve(data)
      } else if (data.code === config.errorCodes.SUCCESS) {
        // 标准格式：{code: 200, data: {...}, message: "xxx"}
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
  async handleTokenExpired(resolve, reject) {
    if (this.isRefreshing) {
      // 如果正在刷新，将请求加入队列
      this.requestQueue.push({ resolve, reject })
      return
    }

    this.isRefreshing = true

    try {
      // 尝试获取新token
      await this.getToken()
      
      // 获取成功，重试队列中的请求
      this.requestQueue.forEach(({ resolve, reject }) => {
        resolve()
      })
      this.requestQueue = []
      this.isRefreshing = false
    } catch (error) {
      // 获取失败，清除本地存储
      this.requestQueue.forEach(({ resolve, reject }) => {
        reject(error)
      })
      this.requestQueue = []
      this.isRefreshing = false
      
      // 清除本地存储
      wx.removeStorageSync('token')
      wx.removeStorageSync('userInfo')
      
      console.error('Token获取失败，请重新登录')
      this.showError('登录已过期，请重新登录')
    }
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
  async request(options) {
    const { url, method = 'GET', data = {}, showLoading = true, retry = 0, needToken = true } = options

    // 如果需要token但没有token，先获取token
    if (needToken && !this.hasToken()) {
      try {
        await this.getToken()
      } catch (error) {
        console.error('获取token失败:', error)
        this.showError('获取认证失败，请重试')
        throw error
      }
    }

    return new Promise((resolve, reject) => {
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

          console.error('请求失败详情:', {
            url: `${this.baseUrl}${url}`,
            method: method,
            error: error,
            errMsg: error.errMsg,
            errno: error.errno
          })

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
            // 根据错误类型显示不同的错误信息
            let errorMessage = config.errorMessages.NETWORK_ERROR
            if (error.errno === 600001) {
              errorMessage = '网络连接失败，请检查网络设置或联系客服'
            } else if (error.errMsg && error.errMsg.includes('CONNECTION_REFUSED')) {
              errorMessage = '服务器连接失败，请稍后重试'
            }
            
            this.showError(errorMessage)
            reject({
              code: config.errorCodes.NETWORK_ERROR,
              message: errorMessage,
              originalError: error
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
      needToken: options.needToken !== false, // 默认需要token
      ...options
    })
  }

  // POST请求
  post(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'POST',
      data,
      needToken: options.needToken !== false, // 默认需要token
      ...options
    })
  }

  // PUT请求
  put(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'PUT',
      data,
      needToken: options.needToken !== false, // 默认需要token
      ...options
    })
  }

  // DELETE请求
  delete(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'DELETE',
      data,
      needToken: options.needToken !== false, // 默认需要token
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