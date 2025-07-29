// JWT认证测试工具
const api = require('./api.js')
const storage = require('./storage.js')
const common = require('./common.js')

// 测试JWT认证功能
const testAuth = {
  // 测试获取token
  async testGetToken() {
    console.log('=== 测试获取Token ===')
    try {
      const response = await api.user.getToken()
      console.log('获取token成功:', response)
      
      const token = wx.getStorageSync('token')
      console.log('存储的token:', token ? '存在' : '不存在')
      
      return true
    } catch (error) {
      console.error('获取token失败:', error)
      return false
    }
  },

  // 测试带token的请求
  async testRequestWithToken() {
    console.log('=== 测试带Token的请求 ===')
    try {
      // 测试banner接口
      const bannerResponse = await api.system.getBanner()
      console.log('Banner请求成功:', bannerResponse)
      
      // 测试消息接口
      const messageResponse = await api.message.getList({ limit: 5 })
      console.log('消息请求成功:', messageResponse)
      
      return true
    } catch (error) {
      console.error('带token请求失败:', error)
      return false
    }
  },

  // 测试token过期处理
  async testTokenExpired() {
    console.log('=== 测试Token过期处理 ===')
    try {
      // 清除token
      wx.removeStorageSync('token')
      console.log('已清除token')
      
      // 尝试请求，应该自动获取新token
      const response = await api.system.getBanner()
      console.log('自动获取token后请求成功:', response)
      
      return true
    } catch (error) {
      console.error('Token过期处理失败:', error)
      return false
    }
  },

  // 完整测试流程
  async runFullTest() {
    console.log('🚀 开始JWT认证完整测试')
    
    const results = {
      getToken: false,
      requestWithToken: false,
      tokenExpired: false
    }
    
    // 测试1: 获取token
    results.getToken = await this.testGetToken()
    
    // 测试2: 带token请求
    if (results.getToken) {
      results.requestWithToken = await this.testRequestWithToken()
    }
    
    // 测试3: token过期处理
    if (results.requestWithToken) {
      results.tokenExpired = await this.testTokenExpired()
    }
    
    // 输出测试结果
    console.log('📊 测试结果:', results)
    
    const successCount = Object.values(results).filter(Boolean).length
    const totalCount = Object.keys(results).length
    
    console.log(`✅ 成功: ${successCount}/${totalCount}`)
    
    if (successCount === totalCount) {
      console.log('🎉 JWT认证测试全部通过！')
    } else {
      console.log('❌ 部分测试失败，请检查配置')
    }
    
    return results
  },

  // 显示当前token状态
  showTokenStatus() {
    const token = wx.getStorageSync('token')
    console.log('🔑 当前Token状态:')
    console.log('- Token存在:', !!token)
    console.log('- Token长度:', token ? token.length : 0)
    console.log('- Token前缀:', token ? token.substring(0, 20) + '...' : '无')
  }
}

module.exports = testAuth 