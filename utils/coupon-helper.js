// 优惠券工具类
class CouponHelper {
  constructor() {
    this.couponTypes = {
      DISCOUNT: 'discount', // 满减券
      FREE: 'free' // 免费券
    }

    this.userCouponStatus = {
      UNUSED: 'unused', // 未使用
      USED: 'used', // 已使用
      EXPIRED: 'expired' // 已过期
    }
  }

  // 格式化用户优惠券数据
  formatUserCoupon(userCoupon) {
    if (!userCoupon) return null

    const formatted = {
      id: userCoupon.id,
      couponId: userCoupon.couponId,
      isUsed: userCoupon.isUsed,
      usedAt: userCoupon.usedAt,
      createdAt: userCoupon.createdAt,
      status: this.getUserCouponStatus(userCoupon),
      coupon: userCoupon.coupon ? this.formatCoupon(userCoupon.coupon) : null
    }

    return formatted
  }

  // 格式化优惠券数据
  formatCoupon(coupon) {
    if (!coupon) return null

    return {
      id: coupon.id,
      name: coupon.name,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minAmount: coupon.minAmount,
      maxDiscount: coupon.maxDiscount,
      startTime: coupon.startTime,
      endTime: coupon.endTime,
      description: coupon.description,
      status: coupon.status,
      targetUsers: coupon.targetUsers,
      isExpired: this.isExpired(coupon.endTime),
      isActive: this.isActive(coupon.startTime, coupon.endTime),
      displayValue: this.getDisplayValue(coupon),
      displayCondition: this.getDisplayCondition(coupon),
      displayDescription: this.getDisplayDescription(coupon)
    }
  }

  // 判断优惠券是否过期
  isExpired(endTime) {
    if (!endTime) return false
    const d = new Date(endTime)
    if (isNaN(d.getTime())) return false
    return d < new Date()
  }

  // 判断优惠券是否激活
  isActive(startTime, endTime) {
    if (!startTime || !endTime) return false
    const now = new Date()
    const start = new Date(startTime)
    const end = new Date(endTime)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false
    return now >= start && now <= end
  }

  // 获取显示值
  getDisplayValue(coupon) {
    if (!coupon) return ''
    
    if (coupon.type === this.couponTypes.DISCOUNT) {
      return `${Math.min(coupon.value, 100)}%`
    } else if (coupon.type === this.couponTypes.FREE) {
      return `¥${coupon.value}`
    }
    
    return ''
  }

  // 获取显示条件
  getDisplayCondition(coupon) {
    if (!coupon) return ''
    
    if (coupon.minAmount > 0) {
      return `满${coupon.minAmount}元可用`
    }
    
    return '无门槛'
  }

  // 获取显示描述
  getDisplayDescription(coupon) {
    if (!coupon) return ''
    
    if (coupon.type === this.couponTypes.DISCOUNT) {
      return `最高减免${coupon.maxDiscount}元`
    } else if (coupon.type === this.couponTypes.FREE) {
      return `直接减免${coupon.value}元`
    }
    
    return coupon.description || ''
  }

  // 获取用户优惠券状态
  getUserCouponStatus(userCoupon) {
    if (!userCoupon) return this.userCouponStatus.UNUSED
    
    if (userCoupon.isUsed) {
      return this.userCouponStatus.USED
    }
    
    if (userCoupon.coupon && this.isExpired(userCoupon.coupon.endTime)) {
      return this.userCouponStatus.EXPIRED
    }
    
    return this.userCouponStatus.UNUSED
  }

  // 格式化时间
  formatTime(timeString) {
    if (!timeString) return ''

    const date = new Date(timeString)
    if (isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  }

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

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      [this.userCouponStatus.UNUSED]: '未使用',
      [this.userCouponStatus.USED]: '已使用',
      [this.userCouponStatus.EXPIRED]: '已过期'
    }
    
    return statusMap[status] || '未知状态'
  }

  // 获取类型文本
  getTypeText(type) {
    const typeMap = {
      [this.couponTypes.DISCOUNT]: '满减券',
      [this.couponTypes.FREE]: '免费券'
    }
    
    return typeMap[type] || '未知类型'
  }
}

// 创建单例实例
const couponHelper = new CouponHelper()

module.exports = couponHelper 