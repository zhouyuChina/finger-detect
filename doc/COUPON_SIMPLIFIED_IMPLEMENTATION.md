# 微信小程序优惠券功能简化实现文档

## 概述

根据最新的接口文档要求，优惠券功能已简化为纯展示功能，只提供获取当前用户拥有的优惠券信息。

## 功能特性

### 1. 优惠券展示
- ✅ 获取当前用户拥有的优惠券列表
- ✅ 按状态筛选（未使用/已使用/已过期）
- ✅ 优惠券详情查看
- ✅ 支持分页加载和下拉刷新

### 2. 优惠券类型支持
- ✅ 满减券（discount）：按百分比计算优惠金额
- ✅ 免费券（free）：直接减免指定金额

### 3. 优惠券状态管理
- ✅ 未使用（unused）
- ✅ 已使用（used）
- ✅ 已过期（expired）

## 文件结构

```
utils/
├── config.js              # API配置（已简化）
├── api.js                 # API接口封装（已简化）
├── request.js             # 请求工具类
└── coupon-helper.js       # 优惠券工具类（已简化）

pages/
└── my-coupons/           # 我的优惠券页面（纯展示）
    ├── my-coupons.js
    ├── my-coupons.wxml
    ├── my-coupons.wxss
    └── my-coupons.json
```

## API接口

### 获取当前用户拥有的优惠券信息
```javascript
// GET /api/miniprogram/coupons
const response = await api.coupon.getUserCoupons(params);
```

**参数**:
- `page`: 页码，默认1
- `pageSize`: 每页数量，默认10
- `status`: 状态筛选（used/unused/expired）

**响应示例**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "user_coupon_id",
        "couponId": "coupon_id",
        "isUsed": false,
        "usedAt": null,
        "createdAt": "2024-01-01T00:00:00Z",
        "status": "unused",
        "coupon": {
          "id": "coupon_id",
          "name": "新用户专享券",
          "code": "NEWUSER001",
          "type": "discount",
          "value": 10,
          "minAmount": 50,
          "maxDiscount": 20,
          "startTime": "2024-01-01T00:00:00Z",
          "endTime": "2024-12-31T23:59:59Z",
          "description": "新用户专享优惠券",
          "status": "active",
          "targetUsers": "new",
          "isExpired": false,
          "isActive": true
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

## 工具类功能

### CouponHelper 类（简化版）

#### 数据格式化
- `formatUserCoupon(userCoupon)`: 格式化用户优惠券数据
- `formatCoupon(coupon)`: 格式化优惠券数据

#### 状态判断
- `isExpired(endTime)`: 判断是否过期
- `isActive(startTime, endTime)`: 判断是否激活

#### 显示格式化
- `getDisplayValue(coupon)`: 获取显示值
- `getDisplayCondition(coupon)`: 获取显示条件
- `getDisplayDescription(coupon)`: 获取显示描述
- `formatTime(timeString)`: 格式化时间
- `formatRemainingTime(endTime)`: 格式化剩余时间
- `getStatusText(status)`: 获取状态文本
- `getTypeText(type)`: 获取类型文本

## 页面功能

### 我的优惠券页面（my-coupons）

**功能**:
- 显示用户已拥有的优惠券列表
- 按状态筛选（未使用/已使用/已过期）
- 支持下拉刷新和上拉加载更多
- 优惠券详情查看（纯展示）

**主要方法**:
- `loadData()`: 加载数据
- `loadUserCoupons()`: 加载用户优惠券
- `filterCoupons()`: 过滤优惠券
- `onCouponClick()`: 点击优惠券查看详情

## 数据结构

### 用户优惠券数据结构
```javascript
{
  id: "用户优惠券ID",
  couponId: "优惠券ID", 
  isUsed: false, // 是否已使用
  usedAt: null, // 使用时间
  createdAt: "2024-01-01T00:00:00Z", // 领取时间
  status: "unused", // 状态：unused/used/expired
  coupon: {
    // 优惠券详细信息
    id: "优惠券ID",
    name: "优惠券名称",
    type: "discount", // 类型：discount/free
    value: 10, // 优惠值
    minAmount: 50, // 最低消费金额
    maxDiscount: 20, // 最大折扣金额
    startTime: "2024-01-01T00:00:00Z", // 开始时间
    endTime: "2024-12-31T23:59:59Z", // 结束时间
    description: "优惠券描述",
    isExpired: false, // 是否已过期
    isActive: true // 是否在有效期内
  }
}
```

## 使用示例

### 1. 获取用户优惠券列表
```javascript
const api = require('../../utils/api.js');
const couponHelper = require('../../utils/coupon-helper.js');

// 获取用户优惠券
const response = await api.coupon.getUserCoupons({
  page: 1,
  pageSize: 10,
  status: 'unused'
});

if (response.success) {
  const coupons = response.data.data.map(coupon => 
    couponHelper.formatUserCoupon(coupon)
  );
  console.log('用户优惠券:', coupons);
}
```

### 2. 页面使用示例
```javascript
Page({
  data: {
    coupons: [],
    loading: false,
    currentStatus: 'unused' // unused, used, expired
  },

  onLoad() {
    this.loadCoupons();
  },

  // 加载优惠券
  async loadCoupons() {
    this.setData({ loading: true });
    
    try {
      const response = await api.coupon.getUserCoupons({
        page: 1,
        pageSize: 20,
        status: this.data.currentStatus
      });
      
      if (response.success) {
        const coupons = response.data.data.map(coupon => {
          const formatted = couponHelper.formatUserCoupon(coupon);
          // 为优惠券添加剩余时间文本
          if (formatted.coupon) {
            formatted.coupon.remainingTimeText = couponHelper.formatRemainingTime(formatted.coupon.endTime);
          }
          return formatted;
        });
        
        this.setData({ 
          coupons: coupons,
          loading: false 
        });
      }
    } catch (error) {
      console.error('加载优惠券失败:', error);
      this.setData({ loading: false });
    }
  },

  // 切换状态
  switchStatus(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ currentStatus: status });
    this.loadCoupons();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadCoupons().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
```

## 错误处理

### 常见错误码
- `400`: 请求参数错误或用户信息不完整
- `401`: 认证失败
- `500`: 服务器内部错误

### 错误处理示例
```javascript
try {
  const response = await api.coupon.getUserCoupons(params);
  if (response.success) {
    // 处理成功
  } else {
    wx.showToast({
      title: response.message || '获取失败',
      icon: 'error'
    });
  }
} catch (error) {
  console.error('获取优惠券失败:', error);
  wx.showToast({
    title: '网络错误，请重试',
    icon: 'error'
  });
}
```

## 注意事项

1. **纯展示功能**: 该接口只返回当前用户已拥有的优惠券，不提供领取功能
2. **管理后台**: 优惠券的领取功能由管理后台统一管理
3. **使用功能**: 使用优惠券的功能暂时不提供
4. **时间格式**: 所有时间字段均为ISO 8601格式
5. **状态筛选**: 状态筛选为可选参数，不传则返回所有状态的优惠券

## 简化内容

### 移除的功能
- ❌ 优惠券领取功能
- ❌ 优惠券使用功能
- ❌ 优惠券统计信息
- ❌ 兑换码功能
- ❌ 可领取优惠券页面
- ❌ 优惠券使用示例页面

### 保留的功能
- ✅ 用户优惠券列表展示
- ✅ 状态筛选
- ✅ 分页加载
- ✅ 下拉刷新
- ✅ 优惠券详情查看
- ✅ 时间格式化显示

## 总结

优惠券功能已简化为纯展示功能，符合最新的接口文档要求：

1. **简化的API接口**: 只提供获取用户优惠券的接口
2. **精简的工具类**: 只保留展示相关的功能
3. **纯展示页面**: 移除所有交互功能，只保留展示
4. **清晰的错误处理**: 完善的错误处理机制
5. **良好的用户体验**: 保持原有的UI设计和交互体验

该实现遵循了微信小程序的最佳实践，提供了简洁、高效的优惠券展示功能。 