// records.js
Page({
  data: {
    searchValue: '',
    showDetailPopup: false,
    currentRecord: {},
    
    // 检测记录数据
    detectionRecords: [
      {
        id: 1,
        imagePath: '/images/banner1.png',
        description: '这里是文字描述,这里是文字描述,这里是文字描述,这里是文字描述,这里是文字描述,这里是文字描述,这里是文字描述,这里是文字描述,这里是文字描述,这里是文字描述,这里是文字描述,',
        suggestions: '处于这种情况下常见的治愈时长为一个月,处于这种情况下常见的治愈时长为一个月,处于这种情况下常见的治愈时长为一个月,处于这种情况下常见的治愈时长为一个月,',
        createTime: '2024-01-15 14:30'
      },
      {
        id: 2,
        imagePath: '/images/banner2.png',
        description: '检测结果显示各项指标正常，建议保持良好的生活习惯，定期进行健康检测。',
        suggestions: '建议每天保持8小时睡眠，适量运动，均衡饮食，定期体检。',
        createTime: '2024-01-14 16:45'
      },
      {
        id: 3,
        imagePath: '/images/banner3.png',
        description: '检测发现轻微异常，建议进一步观察和调整生活习惯。',
        suggestions: '建议减少熬夜，增加运动量，注意饮食健康，必要时咨询专业医生。',
        createTime: '2024-01-13 09:20'
      },
      {
        id: 4,
        imagePath: '/images/banner1.png',
        description: '检测结果显示皮肤状态良好，建议继续保持当前的护理习惯。',
        suggestions: '建议使用温和的洁面产品，定期补水保湿，避免过度清洁。',
        createTime: '2024-01-12 10:15'
      },
      {
        id: 5,
        imagePath: '/images/banner2.png',
        description: '检测发现需要关注的问题，建议及时调整生活习惯和护理方式。',
        suggestions: '建议减少刺激性食物的摄入，增加维生素C的补充，保持充足睡眠。',
        createTime: '2024-01-11 13:25'
      }
    ],
    
    // 筛选后的数据
    filteredRecords: []
  },

  onLoad() {
    this.filterRecords()
  },

  // 搜索提交
  onSearch(e) {
    const value = e.detail.value
    this.setData({
      searchValue: value
    })
    this.filterRecords()
  },

  // 搜索内容变化
  onSearchChange(e) {
    const value = e.detail.value
    this.setData({
      searchValue: value
    })
    this.filterRecords()
  },

  // 筛选记录
  filterRecords() {
    const { detectionRecords, searchValue } = this.data
    
    // 根据搜索关键词筛选
    let filtered = detectionRecords
    if (searchValue) {
      filtered = detectionRecords.filter(item => 
        item.description.includes(searchValue) || 
        item.createTime.includes(searchValue) ||
        item.id.toString().includes(searchValue)
      )
    }
    
    this.setData({
      filteredRecords: filtered
    })
  },

  // 点击检测记录
  onRecordClick(e) {
    const id = e.currentTarget.dataset.id;
    const record = this.data.detectionRecords.find(r => r.id === id);
    
    if (!record) return;

    this.setData({
      currentRecord: record,
      showDetailPopup: true
    });
  },

  // 详情弹窗状态变化
  onDetailPopupChange(e) {
    this.setData({
      showDetailPopup: e.detail.visible
    });
  },

  // 关闭详情弹窗
  closeDetailPopup() {
    this.setData({
      showDetailPopup: false
    });
  },

  // 删除检测记录
  deleteRecord(e) {
    const id = e.currentTarget.dataset.id;
    const record = this.data.detectionRecords.find(r => r.id === id);
    
    if (!record) return;

    wx.showModal({
      title: '确认删除',
      content: `确定要删除检测报告 #${id} 吗？此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#e34d59',
      success: (res) => {
        if (res.confirm) {
          const records = this.data.detectionRecords.filter(r => r.id !== id);
          this.setData({ 
            detectionRecords: records
          });
          this.filterRecords(); // 重新筛选
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 删除当前记录
  deleteCurrentRecord() {
    const { currentRecord } = this.data;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除检测报告 #${currentRecord.id} 吗？此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#e34d59',
      success: (res) => {
        if (res.confirm) {
          const records = this.data.detectionRecords.filter(r => r.id !== currentRecord.id);
          this.setData({ 
            detectionRecords: records,
            showDetailPopup: false
          });
          this.filterRecords(); // 重新筛选
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 预览图片
  previewImage() {
    const imagePath = this.data.currentRecord.imagePath;
    wx.previewImage({
      current: imagePath,
      urls: [imagePath]
    });
  },

  // 跳转到检测页面
  goToDetection() {
    wx.navigateTo({
      url: '/pages/photo-detection/photo-detection'
    });
  }
}) 