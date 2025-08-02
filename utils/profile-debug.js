// 个人中心调试工具
const config = require('./config.js')

class ProfileDebugger {
  constructor() {
    this.baseUrl = config.getCurrentConfig().baseUrl
  }

  // 测试用户信息接口
  async testProfileApi() {
    console.log('=== 测试 /api/miniprogram/profile 接口 ===')
    
    try {
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: `${this.baseUrl}/miniprogram/profile`,
          method: 'GET',
          header: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          timeout: 10000,
          success: resolve,
          fail: reject
        })
      })
      
      console.log('Profile接口响应:')
      console.log('状态码:', response.statusCode)
      console.log('响应数据:', response.data)
      console.log('响应头:', response.header)
      
      return {
        success: response.statusCode === 200 && (response.data.success === true || response.data.code === 200),
        statusCode: response.statusCode,
        data: response.data,
        headers: response.header
      }
    } catch (error) {
      console.error('Profile接口失败:', error)
      return {
        success: false,
        error: error
      }
    }
  }

  // 测试用户统计接口
  async testStatsApi() {
    console.log('=== 测试 /api/miniprogram/stats 接口 ===')
    
    try {
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: `${this.baseUrl}/miniprogram/stats`,
          method: 'GET',
          header: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          timeout: 10000,
          success: resolve,
          fail: reject
        })
      })
      
      console.log('Stats接口响应:')
      console.log('状态码:', response.statusCode)
      console.log('响应数据:', response.data)
      console.log('响应头:', response.header)
      
      return {
        success: response.statusCode === 200 && (response.data.success === true || response.data.code === 200),
        statusCode: response.statusCode,
        data: response.data,
        headers: response.header
      }
    } catch (error) {
      console.error('Stats接口失败:', error)
      return {
        success: false,
        error: error
      }
    }
  }

  // 检查token
  checkToken() {
    const token = wx.getStorageSync('token')
    console.log('=== 检查Token ===')
    console.log('Token存在:', !!token)
    if (token) {
      console.log('Token前缀:', token.substring(0, 20) + '...')
      console.log('Token长度:', token.length)
    }
    return token
  }

  // 检查用户数据
  checkUserData() {
    console.log('=== 检查本地用户数据 ===')
    const userInfo = wx.getStorageSync('userInfo')
    const openId = wx.getStorageSync('openId')
    
    console.log('用户信息存在:', !!userInfo)
    console.log('OpenId存在:', !!openId)
    
    if (userInfo) {
      console.log('用户信息:', userInfo)
    }
    if (openId) {
      console.log('OpenId:', openId)
    }
    
    return { userInfo, openId }
  }

  // 完整调试
  async debugProfile() {
    console.log('=== 个人中心完整调试 ===')
    
    // 1. 检查本地数据
    const token = this.checkToken()
    const userData = this.checkUserData()
    
    console.log('\n')
    
    // 2. 测试接口
    const profileResult = await this.testProfileApi()
    console.log('\n')
    const statsResult = await this.testStatsApi()
    
    console.log('\n=== 调试结果 ===')
    console.log('Token状态:', token ? '✅ 存在' : '❌ 不存在')
    console.log('用户信息状态:', userData.userInfo ? '✅ 存在' : '❌ 不存在')
    console.log('OpenId状态:', userData.openId ? '✅ 存在' : '❌ 不存在')
    console.log('Profile接口:', profileResult.success ? '✅ 成功' : '❌ 失败')
    console.log('Stats接口:', statsResult.success ? '✅ 成功' : '❌ 失败')
    
    // 3. 分析问题
    if (!token) {
      console.log('\n🔍 问题分析: Token不存在')
      console.log('可能原因: 注册时没有保存token')
    } else if (!profileResult.success) {
      console.log('\n🔍 问题分析: Profile接口失败')
      console.log('可能原因:')
      console.log('1. Token无效或过期')
      console.log('2. 后端接口未实现')
      console.log('3. 用户数据未正确保存到数据库')
    } else if (profileResult.success && (!userData.userInfo || !userData.openId)) {
      console.log('\n🔍 问题分析: 接口成功但本地数据不完整')
      console.log('可能原因: 注册时没有保存完整的用户数据')
    }
    
    return {
      token,
      userData,
      profile: profileResult,
      stats: statsResult
    }
  }
}

// 创建全局实例
const profileDebugger = new ProfileDebugger()

// 导出工具
module.exports = {
  ProfileDebugger,
  profileDebugger,
  
  // 便捷方法
  debugProfile: () => profileDebugger.debugProfile(),
  testProfile: () => profileDebugger.testProfileApi(),
  testStats: () => profileDebugger.testStatsApi(),
  checkToken: () => profileDebugger.checkToken(),
  checkUserData: () => profileDebugger.checkUserData()
} 