// 通用工具方法
const config = require('./config.js')

// 格式化时间 - 基础版本（支持自定义格式）
const formatTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return ''

  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

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

// 格式化时间 - 智能相对时间（中文友好）
// 显示规则：刚刚 -> X分钟前 -> X小时前 -> 今天 HH:mm -> 昨天 HH:mm -> 周X HH:mm -> MM-DD HH:mm -> YYYY-MM-DD
const formatTimeRelative = (timeStr) => {
  if (!timeStr) return ''

  try {
    const date = new Date(timeStr)
    if (isNaN(date.getTime())) return ''
    const now = new Date()
    const diff = now - date

    // 小于1分钟：刚刚
    if (diff < 60 * 1000) {
      return '刚刚'
    }

    // 小于1小时：X分钟前
    if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}分钟前`
    }

    // 小于24小时：X小时前 或 今天 HH:mm
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000))
      if (hours < 6) {
        return `${hours}小时前`
      } else {
        return '今天 ' + formatTime(date, 'HH:mm')
      }
    }

    // 昨天：昨天 HH:mm
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天 ' + formatTime(date, 'HH:mm')
    }

    // 一周内：周X HH:mm
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return days[date.getDay()] + ' ' + formatTime(date, 'HH:mm')
    }

    // 今年：MM-DD HH:mm
    if (date.getFullYear() === now.getFullYear()) {
      return formatTime(date, 'MM-DD HH:mm')
    }

    // 更早：YYYY-MM-DD
    return formatTime(date, 'YYYY-MM-DD')
  } catch (error) {
    console.error('formatTimeRelative error:', error)
    return timeStr
  }
}

// 格式化时间 - 简短相对时间
// 显示规则：刚刚 -> X分钟前 -> X小时前 -> X天前 -> YYYY-MM-DD
const formatTimeShort = (timeStr) => {
  if (!timeStr) return ''

  try {
    const date = new Date(timeStr)
    if (isNaN(date.getTime())) return ''
    const now = new Date()
    const diff = now - date

    // 小于1分钟
    if (diff < 60 * 1000) {
      return '刚刚'
    }

    // 小于1小时
    if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}分钟前`
    }

    // 小于24小时
    if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
    }

    // 小于30天
    if (diff < 30 * 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
    }

    // 超过30天显示具体日期
    return formatTime(date, 'YYYY-MM-DD')
  } catch (error) {
    console.error('formatTimeShort error:', error)
    return timeStr
  }
}

// 格式化时间 - 完整中文格式
// 显示规则：YYYY年MM月DD日 HH:mm:ss
const formatTimeChinese = (timeStr, includeTime = true) => {
  if (!timeStr) return ''

  try {
    const date = new Date(timeStr)
    if (isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    let result = `${year}年${month}月${day}日`

    if (includeTime) {
      const hour = String(date.getHours()).padStart(2, '0')
      const minute = String(date.getMinutes()).padStart(2, '0')
      const second = String(date.getSeconds()).padStart(2, '0')
      result += ` ${hour}:${minute}:${second}`
    }

    return result
  } catch (error) {
    console.error('formatTimeChinese error:', error)
    return timeStr
  }
}

// 格式化时间 - 标准日期格式（使用本地化）
// 显示规则：使用浏览器本地化设置
const formatTimeLocale = (timeStr, options = {}) => {
  if (!timeStr) return ''

  try {
    const date = new Date(timeStr)
    if (isNaN(date.getTime())) return ''
    const defaultOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    }
    return date.toLocaleString('zh-CN', defaultOptions)
  } catch (error) {
    console.error('formatTimeLocale error:', error)
    return timeStr
  }
}

// 格式化数字
const formatNumber = n => {
  if (n === null || n === undefined) return '00'
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

// 深拷贝（支持循环引用检测）
const deepClone = (obj, _visited = new WeakSet()) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (_visited.has(obj)) throw new Error('Circular reference detected')
  _visited.add(obj)
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item, _visited))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key], _visited)
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
  if (!bytes || bytes <= 0) return '0 B'
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
  formatTimeRelative,
  formatTimeShort,
  formatTimeChinese,
  formatTimeLocale,
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