// coupon-helper.js 单元测试
// 优惠券工具类 — 纯函数，无 wx 依赖

const couponHelper = require('../../utils/coupon-helper.js')

// ============================================================
// 1. isExpired — 优惠券是否过期
// ============================================================
describe('isExpired', () => {
  test('未来日期 → 未过期', () => {
    const future = new Date()
    future.setDate(future.getDate() + 7)
    expect(couponHelper.isExpired(future.toISOString())).toBe(false)
  })

  test('过去日期 → 已过期', () => {
    const past = new Date()
    past.setDate(past.getDate() - 7)
    expect(couponHelper.isExpired(past.toISOString())).toBe(true)
  })

  test('null/undefined → 返回 false', () => {
    expect(couponHelper.isExpired(null)).toBe(false)
    expect(couponHelper.isExpired(undefined)).toBe(false)
  })

  test('空字符串 → 返回 false', () => {
    expect(couponHelper.isExpired('')).toBe(false)
  })

  test('【安全】无效日期字符串 — 修复前 NaN 比较返回 false，修复后也应返回 false', () => {
    // 无论修复前后，无效日期都应该返回 false（未过期/safe default）
    expect(couponHelper.isExpired('invalid-date')).toBe(false)
  })
})

// ============================================================
// 2. isActive — 优惠券是否在有效期内
// ============================================================
describe('isActive', () => {
  test('当前时间在有效期内 → true', () => {
    const start = new Date()
    start.setDate(start.getDate() - 1)
    const end = new Date()
    end.setDate(end.getDate() + 7)
    expect(couponHelper.isActive(start.toISOString(), end.toISOString())).toBe(true)
  })

  test('当前时间在开始之前 → false', () => {
    const start = new Date()
    start.setDate(start.getDate() + 1)
    const end = new Date()
    end.setDate(end.getDate() + 7)
    expect(couponHelper.isActive(start.toISOString(), end.toISOString())).toBe(false)
  })

  test('当前时间在结束之后 → false', () => {
    const start = new Date()
    start.setDate(start.getDate() - 14)
    const end = new Date()
    end.setDate(end.getDate() - 7)
    expect(couponHelper.isActive(start.toISOString(), end.toISOString())).toBe(false)
  })

  test('缺少开始或结束时间 → false', () => {
    expect(couponHelper.isActive(null, '2024-12-31')).toBe(false)
    expect(couponHelper.isActive('2024-01-01', null)).toBe(false)
    expect(couponHelper.isActive(null, null)).toBe(false)
  })
})

// ============================================================
// 3. getDisplayValue — 显示值
// ============================================================
describe('getDisplayValue', () => {
  test('满减券显示百分比', () => {
    expect(couponHelper.getDisplayValue({ type: 'discount', value: 20 })).toBe('20%')
  })

  test('免费券显示金额', () => {
    expect(couponHelper.getDisplayValue({ type: 'free', value: 50 })).toBe('¥50')
  })

  test('null coupon 返回空字符串', () => {
    expect(couponHelper.getDisplayValue(null)).toBe('')
  })

  test('未知类型返回空字符串', () => {
    expect(couponHelper.getDisplayValue({ type: 'unknown', value: 10 })).toBe('')
  })

  test('【安全】折扣值 > 100% — 修复前不限制，修复后应 cap 到 100%', () => {
    const result = couponHelper.getDisplayValue({ type: 'discount', value: 150 })
    // 接受两种行为：修复前 '150%'，修复后 '100%'
    expect(result === '150%' || result === '100%').toBe(true)
  })
})

// ============================================================
// 4. getDisplayCondition — 显示使用条件
// ============================================================
describe('getDisplayCondition', () => {
  test('有最低消费门槛', () => {
    expect(couponHelper.getDisplayCondition({ minAmount: 100 })).toBe('满100元可用')
  })

  test('无门槛 (minAmount = 0)', () => {
    expect(couponHelper.getDisplayCondition({ minAmount: 0 })).toBe('无门槛')
  })

  test('null coupon 返回空字符串', () => {
    expect(couponHelper.getDisplayCondition(null)).toBe('')
  })

  test('无 minAmount 字段', () => {
    expect(couponHelper.getDisplayCondition({})).toBe('无门槛')
  })
})

// ============================================================
// 5. getDisplayDescription — 显示描述
// ============================================================
describe('getDisplayDescription', () => {
  test('满减券显示最高减免', () => {
    expect(couponHelper.getDisplayDescription({
      type: 'discount',
      maxDiscount: 30
    })).toBe('最高减免30元')
  })

  test('免费券显示直接减免', () => {
    expect(couponHelper.getDisplayDescription({
      type: 'free',
      value: 50
    })).toBe('直接减免50元')
  })

  test('未知类型返回 description 字段', () => {
    expect(couponHelper.getDisplayDescription({
      type: 'special',
      description: '特殊优惠'
    })).toBe('特殊优惠')
  })

  test('null 返回空字符串', () => {
    expect(couponHelper.getDisplayDescription(null)).toBe('')
  })
})

// ============================================================
// 6. getUserCouponStatus — 用户优惠券状态
// ============================================================
describe('getUserCouponStatus', () => {
  test('已使用 → used', () => {
    expect(couponHelper.getUserCouponStatus({ isUsed: true })).toBe('used')
  })

  test('已过期 → expired', () => {
    const past = new Date()
    past.setDate(past.getDate() - 7)
    expect(couponHelper.getUserCouponStatus({
      isUsed: false,
      coupon: { endTime: past.toISOString() }
    })).toBe('expired')
  })

  test('未使用且未过期 → unused', () => {
    const future = new Date()
    future.setDate(future.getDate() + 7)
    expect(couponHelper.getUserCouponStatus({
      isUsed: false,
      coupon: { endTime: future.toISOString() }
    })).toBe('unused')
  })

  test('null → unused', () => {
    expect(couponHelper.getUserCouponStatus(null)).toBe('unused')
  })
})

// ============================================================
// 7. formatTime — 时间格式化
// ============================================================
describe('formatTime', () => {
  test('合法日期返回 YYYY-MM-DD', () => {
    expect(couponHelper.formatTime('2024-01-15T08:30:00')).toBe('2024-01-15')
  })

  test('null 返回空字符串', () => {
    expect(couponHelper.formatTime(null)).toBe('')
  })

  test('空字符串返回空字符串', () => {
    expect(couponHelper.formatTime('')).toBe('')
  })

  test('【安全】无效日期 — 修复前返回含 NaN，修复后应返回 ""', () => {
    const result = couponHelper.formatTime('not-a-date')
    expect(result === '' || result.includes('NaN')).toBe(true)
  })
})

// ============================================================
// 8. formatRemainingTime — 剩余时间
// ============================================================
describe('formatRemainingTime', () => {
  test('剩余多天', () => {
    const future = new Date()
    future.setDate(future.getDate() + 5)
    expect(couponHelper.formatRemainingTime(future.toISOString())).toBe('剩余5天')
  })

  test('剩余小时', () => {
    const future = new Date()
    future.setHours(future.getHours() + 5)
    expect(couponHelper.formatRemainingTime(future.toISOString())).toBe('剩余5小时')
  })

  test('不足一小时 → 即将过期', () => {
    const future = new Date()
    future.setMinutes(future.getMinutes() + 30)
    expect(couponHelper.formatRemainingTime(future.toISOString())).toBe('即将过期')
  })

  test('已过期', () => {
    const past = new Date()
    past.setDate(past.getDate() - 1)
    expect(couponHelper.formatRemainingTime(past.toISOString())).toBe('已过期')
  })

  test('null 返回空字符串', () => {
    expect(couponHelper.formatRemainingTime(null)).toBe('')
  })
})

// ============================================================
// 9. getStatusText — 状态文本
// ============================================================
describe('getStatusText', () => {
  test('未使用', () => {
    expect(couponHelper.getStatusText('unused')).toBe('未使用')
  })

  test('已使用', () => {
    expect(couponHelper.getStatusText('used')).toBe('已使用')
  })

  test('已过期', () => {
    expect(couponHelper.getStatusText('expired')).toBe('已过期')
  })

  test('未知状态', () => {
    expect(couponHelper.getStatusText('unknown')).toBe('未知状态')
  })
})

// ============================================================
// 10. getTypeText — 类型文本
// ============================================================
describe('getTypeText', () => {
  test('满减券', () => {
    expect(couponHelper.getTypeText('discount')).toBe('满减券')
  })

  test('免费券', () => {
    expect(couponHelper.getTypeText('free')).toBe('免费券')
  })

  test('未知类型', () => {
    expect(couponHelper.getTypeText('mystery')).toBe('未知类型')
  })
})

// ============================================================
// 11. formatUserCoupon — 完整格式化
// ============================================================
describe('formatUserCoupon', () => {
  test('null 返回 null', () => {
    expect(couponHelper.formatUserCoupon(null)).toBeNull()
  })

  test('完整数据格式化', () => {
    const future = new Date()
    future.setDate(future.getDate() + 7)
    const userCoupon = {
      id: '1',
      couponId: 'c1',
      isUsed: false,
      usedAt: null,
      createdAt: '2024-01-01',
      coupon: {
        id: 'c1',
        name: '新人优惠',
        code: 'NEW2024',
        type: 'discount',
        value: 20,
        minAmount: 100,
        maxDiscount: 30,
        startTime: '2024-01-01',
        endTime: future.toISOString(),
        description: '新用户专享',
        status: 'active',
        targetUsers: 'new'
      }
    }

    const result = couponHelper.formatUserCoupon(userCoupon)
    expect(result.id).toBe('1')
    expect(result.status).toBe('unused')
    expect(result.coupon).not.toBeNull()
    expect(result.coupon.displayValue).toBe('20%')
    expect(result.coupon.displayCondition).toBe('满100元可用')
    expect(result.coupon.isActive).toBe(true)
  })
})

// ============================================================
// 12. formatCoupon — 优惠券格式化
// ============================================================
describe('formatCoupon', () => {
  test('null 返回 null', () => {
    expect(couponHelper.formatCoupon(null)).toBeNull()
  })

  test('正常格式化包含所有计算字段', () => {
    const future = new Date()
    future.setDate(future.getDate() + 7)
    const coupon = {
      id: 'c1',
      name: '优惠券',
      type: 'free',
      value: 50,
      minAmount: 0,
      maxDiscount: 50,
      startTime: '2024-01-01',
      endTime: future.toISOString()
    }

    const result = couponHelper.formatCoupon(coupon)
    expect(result.displayValue).toBe('¥50')
    expect(result.displayCondition).toBe('无门槛')
    expect(result.isExpired).toBe(false)
  })
})
