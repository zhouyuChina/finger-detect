// API调试工具
const config = require('./config.js')

class ApiDebugger {
  constructor() {
    this.baseUrl = config.getCurrentConfig().baseUrl
  }

  // 测试auth接口
  async testAuthApi() {
    console.log('=== 测试 /api/miniprogram/auth 接口 ===')
    
    try {
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: `${this.baseUrl}/miniprogram/auth`,
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
      
      console.log('Auth接口成功:')
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
      console.error('Auth接口失败:', error)
      return {
        success: false,
        error: error
      }
    }
  }

  // 测试register接口
  async testRegisterApi() {
    console.log('=== 测试 /api/miniprogram/register 接口 ===')
    
    // 模拟注册数据
    const registerData = {
      code: 'test_code_123456',
      userInfo: {
        nickName: '测试用户',
        avatarUrl: '/images/default-avatar.png',
        gender: 0,
        country: '',
        province: '',
        city: ''
      },
      systemInfo: {
        platform: 'ios',
        system: 'iOS 14.0',
        version: '1.0.0',
        SDKVersion: '2.0.0',
        brand: 'iPhone',
        model: 'iPhone 12',
        screenWidth: 375,
        screenHeight: 812,
        windowWidth: 375,
        windowHeight: 812,
        pixelRatio: 3,
        language: 'zh_CN'
      },
      registerTime: new Date().toISOString(),
      appVersion: '1.0.0'
    }
    
    console.log('注册数据:', registerData)
    
    try {
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: `${this.baseUrl}/miniprogram/register`,
          method: 'POST',
          data: registerData,
          header: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          timeout: 10000,
          success: resolve,
          fail: reject
        })
      })
      
      console.log('Register接口成功:')
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
      console.error('Register接口失败:', error)
      return {
        success: false,
        error: error
      }
    }
  }

  // 对比两个接口
  async compareApis() {
    console.log('=== 对比 Auth 和 Register 接口 ===')
    console.log('当前环境:', config.getCurrentConfig().baseUrl)
    
    const authResult = await this.testAuthApi()
    console.log('\n')
    const registerResult = await this.testRegisterApi()
    
    console.log('\n=== 对比结果 ===')
    console.log('Auth接口:', authResult.success ? '✅ 成功' : '❌ 失败')
    console.log('Register接口:', registerResult.success ? '✅ 成功' : '❌ 失败')
    
    if (authResult.success && !registerResult.success) {
      console.log('\n🔍 分析: Auth成功但Register失败，可能的原因:')
      console.log('1. Register接口需要额外的认证或权限')
      console.log('2. Register接口的请求数据格式有问题')
      console.log('3. Register接口的数据库操作失败')
      console.log('4. Register接口的微信code2Session调用失败')
      console.log('5. Register接口的环境变量配置问题')
    }
    
    return {
      auth: authResult,
      register: registerResult
    }
  }

  // 测试不同的注册数据格式
  async testDataFormats() {
    console.log('=== 测试不同的注册数据格式 ===')
    
    const testCases = [
      {
        name: '最小数据',
        data: {
          code: 'test_code_123456'
        }
      },
      {
        name: '只有code和userInfo',
        data: {
          code: 'test_code_123456',
          userInfo: {
            nickName: '测试用户',
            avatarUrl: '/images/default-avatar.png'
          }
        }
      },
      {
        name: '完整数据',
        data: {
          code: 'test_code_123456',
          userInfo: {
            nickName: '测试用户',
            avatarUrl: '/images/default-avatar.png',
            gender: 0,
            country: '',
            province: '',
            city: ''
          },
          systemInfo: {
            platform: 'ios',
            system: 'iOS 14.0'
          },
          registerTime: new Date().toISOString(),
          appVersion: '1.0.0'
        }
      }
    ]
    
    for (const testCase of testCases) {
      console.log(`\n测试: ${testCase.name}`)
      try {
        const response = await new Promise((resolve, reject) => {
          wx.request({
            url: `${this.baseUrl}/miniprogram/register`,
            method: 'POST',
            data: testCase.data,
            header: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            timeout: 10000,
            success: resolve,
            fail: reject
          })
        })
        
        console.log(`✅ ${testCase.name} 成功:`, response.statusCode, response.data)
      } catch (error) {
        console.log(`❌ ${testCase.name} 失败:`, error.errMsg)
      }
    }
  }
}

// 创建全局实例
const apiDebugger = new ApiDebugger()

// 导出工具
module.exports = {
  ApiDebugger,
  apiDebugger,
  
  // 便捷方法
  testAuth: () => apiDebugger.testAuthApi(),
  testRegister: () => apiDebugger.testRegisterApi(),
  compareApis: () => apiDebugger.compareApis(),
  testDataFormats: () => apiDebugger.testDataFormats()
} 