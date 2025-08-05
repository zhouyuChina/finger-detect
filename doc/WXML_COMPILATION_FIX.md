# WXML编译错误修复说明

## 问题描述

在优惠券功能开发过程中，发现WXML文件中使用了JavaScript表达式，导致编译错误。

**错误信息**:
```
Bad value with message: unexpected token `Date`.
./pages/available-coupons/available-coupons.wxml
```

**错误位置**:
```xml
<view class="coupon-remaining">
  {{item.isExpired ? '已过期' : '剩余' + Math.ceil((new Date(item.endTime) - new Date()) / (1000 * 60 * 60 * 24)) + '天'}}
</view>
```

## 问题原因

WXML文件中不能直接使用JavaScript的复杂表达式，如：
- `new Date()`
- `Math.ceil()`
- 复杂的数学计算
- 函数调用

## 解决方案

将计算逻辑从WXML移到JavaScript文件中，在数据格式化时预先计算好显示文本。

### 1. 修复的文件

#### pages/available-coupons/available-coupons.wxml
**修复前**:
```xml
<view class="coupon-remaining">
  {{item.isExpired ? '已过期' : '剩余' + Math.ceil((new Date(item.endTime) - new Date()) / (1000 * 60 * 60 * 24)) + '天'}}
</view>
```

**修复后**:
```xml
<view class="coupon-remaining">
  {{item.remainingTimeText}}
</view>
```

#### pages/my-coupons/my-coupons.wxml
**修复前**:
```xml
<view class="coupon-remaining" wx:if="{{item.status === 'unused'}}">
  {{item.coupon.isExpired ? '已过期' : '剩余' + Math.ceil((new Date(item.coupon.endTime) - new Date()) / (1000 * 60 * 60 * 24)) + '天'}}
</view>
```

**修复后**:
```xml
<view class="coupon-remaining" wx:if="{{item.status === 'unused'}}">
  {{item.coupon.remainingTimeText}}
</view>
```

#### pages/coupon-use-demo/coupon-use-demo.wxml
**修复前**:
```xml
<view class="coupon-remaining">
  {{item.coupon.isExpired ? '已过期' : '剩余' + Math.ceil((new Date(item.coupon.endTime) - new Date()) / (1000 * 60 * 60 * 24)) + '天'}}
</view>
```

**修复后**:
```xml
<view class="coupon-remaining">
  {{item.coupon.remainingTimeText}}
</view>
```

### 2. JavaScript文件更新

#### pages/available-coupons/available-coupons.js
```javascript
const formattedCoupons = response.data.data.map(coupon => {
  const formatted = couponHelper.formatCoupon(coupon);
  // 检查是否可以领取
  formatted.canClaim = couponHelper.canClaimCoupon(coupon, this.data.myCoupons);
  // 计算剩余时间文本
  formatted.remainingTimeText = couponHelper.formatRemainingTime(coupon.endTime);
  return formatted;
});
```

#### pages/my-coupons/my-coupons.js
```javascript
const formattedCoupons = response.data.data.map(coupon => {
  const formatted = couponHelper.formatUserCoupon(coupon);
  // 为优惠券添加剩余时间文本
  if (formatted.coupon) {
    formatted.coupon.remainingTimeText = couponHelper.formatRemainingTime(formatted.coupon.endTime);
  }
  return formatted;
});
```

#### pages/coupon-use-demo/coupon-use-demo.js
```javascript
const availableCoupons = response.data.data
  .map(coupon => {
    const formatted = couponHelper.formatUserCoupon(coupon);
    // 为优惠券添加剩余时间文本
    if (formatted.coupon) {
      formatted.coupon.remainingTimeText = couponHelper.formatRemainingTime(formatted.coupon.endTime);
    }
    return formatted;
  })
  .filter(coupon => couponHelper.canUseUserCoupon(coupon, this.data.orderAmount));
```

## 工具类方法

使用了 `couponHelper.formatRemainingTime()` 方法来计算剩余时间文本：

```javascript
// 格式化剩余时间
formatRemainingTime(endTime) {
  if (!endTime) return ''
  
  const now = new Date()
  const end = new Date(endTime)
  const diff = end - now
  
  if (diff <= 0) return '已过期'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) {
    return `剩余${days}天`
  } else if (hours > 0) {
    return `剩余${hours}小时`
  } else {
    return '即将过期'
  }
}
```

## WXML表达式限制

### 不允许的表达式
- 函数调用：`new Date()`, `Math.ceil()`, `parseInt()` 等
- 复杂的数学运算
- 条件运算符的嵌套
- 对象方法调用

### 允许的表达式
- 简单的算术运算：`+`, `-`, `*`, `/`, `%`
- 简单的逻辑运算：`&&`, `||`, `!`
- 简单的比较运算：`==`, `===`, `!=`, `!==`, `<`, `>`, `<=`, `>=`
- 简单的三元运算符：`condition ? value1 : value2`
- 数组索引：`array[index]`
- 对象属性访问：`object.property`

## 最佳实践

1. **数据预处理**: 在JavaScript中预先计算好所有需要显示的数据
2. **工具类**: 使用工具类方法封装复杂的计算逻辑
3. **简单表达式**: WXML中只使用简单的数据绑定表达式
4. **性能优化**: 避免在WXML中进行复杂计算，提高渲染性能

## 验证方法

### 1. 检查WXML文件
```bash
grep -n "new Date\|Math\." pages/*/available-coupons.wxml pages/*/my-coupons.wxml pages/*/coupon-use-demo.wxml
```

### 2. 检查数据绑定
```bash
grep -n "remainingTimeText" pages/*/available-coupons.wxml pages/*/my-coupons.wxml pages/*/coupon-use-demo.wxml
```

### 3. 编译测试
在微信开发者工具中重新编译项目，确认没有WXML编译错误。

## 修复结果

✅ 所有WXML文件中的JavaScript表达式已移除
✅ 计算逻辑已移到JavaScript文件中
✅ 使用工具类方法统一处理时间计算
✅ 数据绑定表达式简化
✅ 编译错误已解决

现在优惠券功能应该可以正常编译和运行，不会再出现WXML编译错误。 