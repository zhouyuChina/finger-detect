// 通用工具方法
const config = require('./config.js')

// 格式化时间
const formatTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return ''
  
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second)
}

// 格式化数字
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

// 防抖函数
const debounce = (func, wait = 300) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
const throttle = (func, limit = 300) => {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 深拷贝
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 验证手机号
const validatePhone = (phone) => {
  const reg = /^1[3-9]\d{9}$/
  return reg.test(phone)
}

// 验证邮箱
const validateEmail = (email) => {
  const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return reg.test(email)
}

// 验证身份证号
const validateIdCard = (idCard) => {
  const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  return reg.test(idCard)
}

// 获取文件大小格式化
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取文件扩展名
const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

// 检查文件类型是否允许
const isAllowedFileType = (fileType) => {
  return config.upload.allowedTypes.includes(fileType)
}

// 检查文件大小是否允许
const isAllowedFileSize = (fileSize) => {
  return fileSize <= config.upload.maxSize
}

// 显示成功提示
const showSuccess = (title, duration = 2000) => {
  wx.showToast({
    title: title,
    icon: 'success',
    duration: duration
  })
}

// 显示错误提示
const showError = (title, duration = 2000) => {
  wx.showToast({
    title: title,
    icon: 'error',
    duration: duration
  })
}

// 显示加载提示
const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title: title,
    mask: true
  })
}

// 隐藏加载提示
const hideLoading = () => {
  wx.hideLoading()
}

// 显示确认对话框
const showConfirm = (title, content) => {
  return new Promise((resolve) => {
    wx.showModal({
      title: title,
      content: content,
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

// 显示操作菜单
const showActionSheet = (itemList) => {
  return new Promise((resolve, reject) => {
    wx.showActionSheet({
      itemList: itemList,
      success: (res) => {
        resolve(res.tapIndex)
      },
      fail: reject
    })
  })
}

// 获取系统信息
const getSystemInfo = () => {
  return new Promise((resolve, reject) => {
    wx.getSystemInfo({
      success: resolve,
      fail: reject
    })
  })
}

// 获取网络状态
const getNetworkType = () => {
  return new Promise((resolve, reject) => {
    wx.getNetworkType({
      success: resolve,
      fail: reject
    })
  })
}

// 检查网络连接
const checkNetwork = async () => {
  try {
    const networkType = await getNetworkType()
    return networkType.networkType !== 'none'
  } catch (error) {
    console.error('检查网络状态失败:', error)
    return false
  }
}

// 拨打电话
const makePhoneCall = (phoneNumber) => {
  wx.makePhoneCall({
    phoneNumber: phoneNumber,
    fail: (error) => {
      console.error('拨打电话失败:', error)
      showError('拨打电话失败')
    }
  })
}

// 复制到剪贴板
const setClipboardData = (data) => {
  return new Promise((resolve, reject) => {
    wx.setClipboardData({
      data: data,
      success: resolve,
      fail: reject
    })
  })
}

// 获取剪贴板内容
const getClipboardData = () => {
  return new Promise((resolve, reject) => {
    wx.getClipboardData({
      success: resolve,
      fail: reject
    })
  })
}

// 保存图片到相册
const saveImageToPhotosAlbum = (filePath) => {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath: filePath,
      success: resolve,
      fail: reject
    })
  })
}

// 选择图片
const chooseImage = (count = 1, sizeType = ['original'], sourceType = ['album', 'camera']) => {
  return new Promise((resolve, reject) => {
    wx.chooseImage({
      count: count,
      sizeType: sizeType,
      sourceType: sourceType,
      success: resolve,
      fail: reject
    })
  })
}

// 预览图片
const previewImage = (urls, current = '') => {
  wx.previewImage({
    urls: urls,
    current: current
  })
}

// 压缩图片
const compressImage = (src, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src: src,
      quality: quality,
      success: resolve,
      fail: reject
    })
  })
}

module.exports = {
  formatTime,
  formatNumber,
  debounce,
  throttle,
  deepClone,
  generateId,
  validatePhone,
  validateEmail,
  validateIdCard,
  formatFileSize,
  getFileExtension,
  isAllowedFileType,
  isAllowedFileSize,
  showSuccess,
  showError,
  showLoading,
  hideLoading,
  showConfirm,
  showActionSheet,
  getSystemInfo,
  getNetworkType,
  checkNetwork,
  makePhoneCall,
  setClipboardData,
  getClipboardData,
  saveImageToPhotosAlbum,
  chooseImage,
  previewImage,
  compressImage
} 