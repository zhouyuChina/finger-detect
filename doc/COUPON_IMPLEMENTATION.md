# 微信小程序优惠券功能实现文档

## 概述

本文档描述了微信小程序端优惠券功能的完整实现，包括API接口、数据处理、页面展示和业务逻辑。

## 功能特性

### 1. 优惠券管理
- ✅ 获取可用优惠券列表
- ✅ 领取优惠券
- ✅ 查看已领取优惠券
- ✅ 使用优惠券
- ✅ 优惠券详情查看
- ✅ 优惠券统计信息

### 2. 优惠券类型支持
- ✅ 满减券（discount）：按百分比计算优惠金额
- ✅ 免费券（free）：直接减免指定金额

### 3. 优惠券状态管理
- ✅ 未使用（unused）
- ✅ 已使用（used）
- ✅ 已过期（expired）

### 4. 业务规则
- ✅ 每个用户只能领取同一优惠券一次
- ✅ 优惠券有总数量限制
- ✅ 优惠券有时间限制
- ✅ 优惠券有最低消费限制
- ✅ 满减券有最大优惠金额限制

## 文件结构

```
utils/
├── config.js              # API配置
├── api.js                 # API接口封装
├── request.js             # 请求工具类
└── coupon-helper.js       # 优惠券工具类

pages/
├── my-coupons/           # 我的优惠券页面
│   ├── my-coupons.js
│   ├── my-coupons.wxml
│   ├── my-coupons.wxss
│   └── my-coupons.json
├── available-coupons/    # 可领取优惠券页面
│   ├── available-coupons.js
│   ├── available-coupons.wxml
│   ├── available-coupons.wxss
│   └── available-coupons.json
└── coupon-use-demo/      # 优惠券使用示例页面
    ├── coupon-use-demo.js
    ├── coupon-use-demo.wxml
    ├── coupon-use-demo.wxss
    └── coupon-use-demo.json
```

## API接口

### 1. 获取可用优惠券列表
```javascript
// GET /api/miniprogram/coupons
const response = await api.coupon.getAvailableCoupons(params);
```

**参数**:
- `page`: 页码，默认1
- `pageSize`: 每页数量，默认10
- `type`: 优惠券类型筛选
- `status`: 状态筛选，默认active

### 2. 领取优惠券
```javascript
// POST /api/miniprogram/coupons
const response = await api.coupon.claimCoupon(couponId);
```

**参数**:
- `couponId`: 优惠券ID

### 3. 获取用户已领取优惠券
```javascript
// GET /api/miniprogram/coupons/my
const response = await api.coupon.getMyCoupons(params);
```

**参数**:
- `page`: 页码，默认1
- `pageSize`: 每页数量，默认10
- `status`: 状态筛选（used/unused/expired）
- `type`: 优惠券类型筛选

### 4. 使用优惠券
```javascript
// POST /api/miniprogram/coupons/use
const response = await api.coupon.useCoupon(userCouponId, orderAmount);
```

**参数**:
- `userCouponId`: 用户优惠券ID
- `orderAmount`: 订单金额

### 5. 获取优惠券详情
```javascript
// GET /api/miniprogram/coupons/{id}
const response = await api.coupon.getCouponDetail(id);
```

### 6. 获取优惠券统计信息
```javascript
// GET /api/miniprogram/coupons/stats
const response = await api.coupon.getCouponStats();
```

## 工具类功能

### CouponHelper 类

#### 数据格式化
- `formatCoupon(coupon)`: 格式化优惠券数据
- `formatUserCoupon(userCoupon)`: 格式化用户优惠券数据

#### 状态判断
- `isExpired(endTime)`: 判断是否过期
- `isActive(startTime, endTime)`: 判断是否激活
- `isAvailable(coupon)`: 判断是否可用
- `canClaimCoupon(coupon, userCoupons)`: 判断是否可以领取
- `canUseUserCoupon(userCoupon, orderAmount)`: 判断是否可以使用

#### 计算功能
- `calculateDiscount(coupon, orderAmount)`: 计算优惠金额
- `getCouponExample(coupon, orderAmount)`: 获取使用示例
- `getRemainingCount(coupon)`: 获取剩余数量

#### 显示格式化
- `getDisplayValue(coupon)`: 获取显示值
- `getDisplayCondition(coupon)`: 获取显示条件
- `getDisplayDescription(coupon)`: 获取显示描述
- `formatTime(timeString)`: 格式化时间
- `formatRemainingTime(endTime)`: 格式化剩余时间
- `getStatusText(status)`: 获取状态文本
- `getTypeText(type)`: 获取类型文本

## 页面功能

### 1. 我的优惠券页面（my-coupons）

**功能**:
- 显示用户已领取的优惠券列表
- 按状态筛选（未使用/已使用/已过期）
- 显示优惠券统计信息
- 支持下拉刷新和上拉加载更多
- 优惠券详情查看
- 优惠券使用功能

**主要方法**:
- `loadData()`: 加载数据
- `loadMyCoupons()`: 加载我的优惠券
- `loadStats()`: 加载统计信息
- `filterCoupons()`: 过滤优惠券
- `onCouponClick()`: 点击优惠券
- `useCoupon()`: 使用优惠券

### 2. 可领取优惠券页面（available-coupons）

**功能**:
- 显示可领取的优惠券列表
- 检查是否已领取
- 支持下拉刷新和上拉加载更多
- 优惠券详情查看
- 优惠券领取功能

**主要方法**:
- `loadData()`: 加载数据
- `loadAvailableCoupons()`: 加载可领取优惠券
- `loadMyCoupons()`: 加载我的优惠券（用于检查）
- `onCouponClick()`: 点击优惠券
- `claimCoupon()`: 领取优惠券

### 3. 优惠券使用示例页面（coupon-use-demo）

**功能**:
- 模拟订单场景
- 选择可用优惠券
- 实时计算优惠金额
- 优惠券使用功能

**主要方法**:
- `loadAvailableCoupons()`: 加载可用优惠券
- `onOrderAmountInput()`: 订单金额输入
- `selectCoupon()`: 选择优惠券
- `calculateDiscount()`: 计算优惠金额
- `useCoupon()`: 使用优惠券

## 数据结构

### 优惠券数据结构
```javascript
{
  id: "coupon_id",
  name: "新用户专享券",
  code: "NEWUSER001",
  type: "discount", // discount | free
  value: 10, // 优惠值（百分比或金额）
  minAmount: 50, // 最低消费
  maxDiscount: 20, // 最大优惠金额
  totalCount: 1000, // 总数量
  usedCount: 500, // 已使用数量
  startTime: "2024-01-01T00:00:00Z",
  endTime: "2024-12-31T23:59:59Z",
  channel: "wechat",
  description: "新用户专享优惠券",
  status: "active",
  targetUsers: "new",
  createdAt: "2024-01-01T00:00:00Z"
}
```

### 用户优惠券数据结构
```javascript
{
  id: "user_coupon_id",
  couponId: "coupon_id",
  isUsed: false,
  usedAt: null,
  createdAt: "2024-01-01T00:00:00Z",
  status: "unused", // unused | used | expired
  coupon: { /* 优惠券详细信息 */ }
}
```

## 使用示例

### 1. 获取优惠券列表
```javascript
const api = require('../../utils/api.js');
const couponHelper = require('../../utils/coupon-helper.js');

// 获取可用优惠券
const response = await api.coupon.getAvailableCoupons();
if (response.success) {
  const coupons = response.data.data.map(coupon => 
    couponHelper.formatCoupon(coupon)
  );
  console.log('可用优惠券:', coupons);
}
```

### 2. 领取优惠券
```javascript
// 领取优惠券
const response = await api.coupon.claimCoupon('coupon_id');
if (response.success) {
  wx.showToast({
    title: '领取成功',
    icon: 'success'
  });
}
```

### 3. 使用优惠券
```javascript
// 使用优惠券
const response = await api.coupon.useCoupon('user_coupon_id', 100);
if (response.success) {
  console.log('优惠金额:', response.data.discountAmount);
  console.log('最终金额:', response.data.finalAmount);
}
```

### 4. 计算优惠金额
```javascript
const coupon = {
  type: 'discount',
  value: 10,
  minAmount: 50,
  maxDiscount: 20
};

const orderAmount = 100;
const discountAmount = couponHelper.calculateDiscount(coupon, orderAmount);
console.log('优惠金额:', discountAmount); // 10
```

## 错误处理

### 常见错误码
- `400`: 请求参数错误
- `401`: 认证失败
- `404`: 资源不存在
- `409`: 资源冲突（如已领取过该优惠券）
- `500`: 服务器内部错误

### 错误处理示例
```javascript
try {
  const response = await api.coupon.claimCoupon(couponId);
  if (response.success) {
    // 处理成功
  } else {
    wx.showToast({
      title: response.message || '操作失败',
      icon: 'error'
    });
  }
} catch (error) {
  console.error('操作失败:', error);
  wx.showToast({
    title: '网络错误，请重试',
    icon: 'error'
  });
}
```

## 注意事项

1. **数据格式**: 所有时间字段使用ISO 8601格式
2. **金额计算**: 优惠金额不能超过订单金额
3. **状态同步**: 优惠券状态需要实时更新
4. **错误处理**: 所有API调用都需要错误处理
5. **用户体验**: 提供加载状态和错误提示
6. **性能优化**: 使用分页加载，避免一次性加载大量数据

## 扩展功能

### 可扩展的功能
- 优惠券分享功能
- 优惠券推荐算法
- 优惠券使用历史
- 优惠券到期提醒
- 优惠券批量操作
- 优惠券搜索功能

### 性能优化建议
- 使用缓存减少API调用
- 图片懒加载
- 虚拟滚动（大量数据时）
- 预加载下一页数据
- 防抖处理用户输入

## 测试建议

### 功能测试
- 优惠券领取流程
- 优惠券使用流程
- 状态切换测试
- 边界条件测试
- 错误场景测试

### 性能测试
- 大量数据加载测试
- 网络异常测试
- 内存使用测试
- 响应时间测试

## 总结

本优惠券功能实现提供了完整的优惠券管理解决方案，包括：

1. **完整的API接口**: 覆盖优惠券的所有操作
2. **强大的工具类**: 提供丰富的数据处理和计算功能
3. **美观的UI界面**: 现代化的设计风格
4. **完善的错误处理**: 确保用户体验
5. **良好的扩展性**: 便于后续功能扩展

该实现遵循了微信小程序的最佳实践，具有良好的代码结构和用户体验。 