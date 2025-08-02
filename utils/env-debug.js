// 环境调试工具
const config = require('./config.js')

// 环境调试工具类
class EnvDebugger {
  constructor() {
    this.currentEnv = 'TEST'
    this.envConfigs = {
      LOCAL: {
        baseUrl: 'localhost:3001',
        name: '本地环境',
        description: '本地开发环境，通常运行在 localhost:3001'
      },
      TEST: {
        baseUrl: '47.76.126.85:4000',
        name: '测试环境',
        description: '测试服务器环境，运行在 47.76.126.85:4000'
      },
      PRODUCTION: {
        baseUrl: 'your-production-domain.com',
        name: '生产环境',
        description: '生产环境，正式部署的服务器'
      }
    }
  }

  // 获取当前环境信息
  getCurrentEnvInfo() {
    const env = this.envConfigs[this.currentEnv]
    return {
      name: env.name,
      baseUrl: env.baseUrl,
      description: env.description,
      apiUrl: `http://${env.baseUrl}/api`,
      staticUrl: `http://${env.baseUrl}`
    }
  }

  // 切换环境
  switchEnv(envName) {
    if (this.envConfigs[envName]) {
      this.currentEnv = envName
      console.log(`=== 环境切换 ===`)
      console.log(`切换到: ${this.envConfigs[envName].name}`)
      console.log(`基础URL: ${this.envConfigs[envName].baseUrl}`)
      console.log(`================`)
      return true
    } else {
      console.error(`环境 ${envName} 不存在`)
      return false
    }
  }

  // 测试环境连接
  async testConnection() {
    const envInfo = this.getCurrentEnvInfo()
    console.log(`=== 测试环境连接 ===`)
    console.log(`环境: ${envInfo.name}`)
    console.log(`API地址: ${envInfo.apiUrl}`)
    
    try {
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: `${envInfo.apiUrl}/miniprogram/auth`,
          method: 'GET',
          timeout: 5000,
          success: resolve,
          fail: reject
        })
      })
      
      console.log(`连接成功:`, response)
      return {
        success: true,
        statusCode: response.statusCode,
        data: response.data
      }
    } catch (error) {
      console.error(`连接失败:`, error)
      return {
        success: false,
        error: error
      }
    }
  }

  // 对比环境
  async compareEnvs() {
    console.log(`=== 环境对比测试 ===`)
    
    for (const [envName, envConfig] of Object.entries(this.envConfigs)) {
      console.log(`\n测试环境: ${envConfig.name}`)
      const result = await this.testConnection()
      console.log(`结果: ${result.success ? '成功' : '失败'}`)
      if (!result.success) {
        console.log(`错误: ${result.error.errMsg}`)
      }
    }
  }

  // 打印所有环境信息
  printAllEnvs() {
    console.log(`=== 所有环境配置 ===`)
    for (const [envName, envConfig] of Object.entries(this.envConfigs)) {
      console.log(`${envName}:`)
      console.log(`  名称: ${envConfig.name}`)
      console.log(`  地址: ${envConfig.baseUrl}`)
      console.log(`  描述: ${envConfig.description}`)
      console.log(`  API: http://${envConfig.baseUrl}/api`)
      console.log(`  静态资源: http://${envConfig.baseUrl}`)
      console.log(``)
    }
  }
}

// 创建全局实例
const envDebugger = new EnvDebugger()

// 导出工具
module.exports = {
  EnvDebugger,
  envDebugger,
  
  // 便捷方法
  switchToLocal: () => envDebugger.switchEnv('LOCAL'),
  switchToTest: () => envDebugger.switchEnv('TEST'),
  switchToProduction: () => envDebugger.switchEnv('PRODUCTION'),
  
  testCurrentEnv: () => envDebugger.testConnection(),
  compareAllEnvs: () => envDebugger.compareEnvs(),
  printEnvs: () => envDebugger.printAllEnvs(),
  
  getCurrentEnv: () => envDebugger.getCurrentEnvInfo()
} 