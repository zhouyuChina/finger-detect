// my-profile.js
Page({
  data: {
    searchValue: '',
    totalProfiles: 0,
    activeProfiles: 0,
    recentUpdates: 0,
    showEditPopup: false,
    editingProfile: {
      id: 0,
      name: '',
      gender: '',
      age: '',
      address: '',
      relationship: '',
      phone: ''
    },
    genderOptions: ['男', '女'],
    relationshipOptions: ['本人', '配偶', '子女', '父母', '其他'],
    profiles: [
      {
        id: 1,
        name: '谢芳',
        gender: '女',
        age: 28,
        relationship: '本人',
        avatar: '/images/default-avatar.png',
        profileId: 'PF001',
        updateTime: '2024-01-15',
        status: 'active',
        phone: '159****3314',
        address: '北京市朝阳区'
      },
      {
        id: 2,
        name: '张明',
        gender: '男',
        age: 32,
        relationship: '配偶',
        avatar: '/images/default-avatar.png',
        profileId: 'PF002',
        updateTime: '2024-01-10',
        status: 'active',
        phone: '138****5678',
        address: '北京市朝阳区'
      },
      {
        id: 3,
        name: '张小宝',
        gender: '男',
        age: 5,
        relationship: '子女',
        avatar: '/images/default-avatar.png',
        profileId: 'PF003',
        updateTime: '2024-01-08',
        status: 'active',
        phone: '',
        address: '北京市朝阳区'
      },
      {
        id: 4,
        name: '李阿姨',
        gender: '女',
        age: 58,
        relationship: '父母',
        avatar: '/images/default-avatar.png',
        profileId: 'PF004',
        updateTime: '2024-01-05',
        status: 'inactive',
        phone: '186****1234',
        address: '上海市浦东新区'
      }
    ],
    filteredProfiles: []
  },

  onLoad() {
    this.calculateStats();
    this.filterProfiles();
  },

  onShow() {
    // 页面显示时刷新数据
    this.calculateStats();
    this.filterProfiles();
  },

  // 计算统计数据
  calculateStats() {
    const profiles = this.data.profiles;
    const totalProfiles = profiles.length;
    const activeProfiles = profiles.filter(p => p.status === 'active').length;
    const recentUpdates = profiles.filter(p => {
      const updateDate = new Date(p.updateTime);
      const now = new Date();
      const diffDays = (now - updateDate) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    }).length;

    this.setData({
      totalProfiles,
      activeProfiles,
      recentUpdates
    });
  },

  // 搜索功能
  onSearchChange(e) {
    this.setData({
      searchValue: e.detail.value
    });
    this.filterProfiles();
  },

  onSearch(e) {
    this.setData({
      searchValue: e.detail.value
    });
    this.filterProfiles();
  },

  // 过滤用户列表
  filterProfiles() {
    const { profiles, searchValue } = this.data;
    let filtered = profiles;

    if (searchValue && searchValue.trim()) {
      const searchTerm = searchValue.toLowerCase().trim();
      filtered = profiles.filter(profile => 
        profile.name.toLowerCase().includes(searchTerm) ||
        profile.profileId.toLowerCase().includes(searchTerm) ||
        profile.relationship.toLowerCase().includes(searchTerm)
      );
    }

    this.setData({
      filteredProfiles: filtered
    });
  },

  // 点击档案项
  onProfileClick(e) {
    const id = e.currentTarget.dataset.id;
    const profile = this.data.profiles.find(p => p.id === id);
    
    if (!profile) {
      wx.showToast({
        title: '档案信息获取失败',
        icon: 'error'
      });
      return;
    }
    
    wx.showModal({
      title: '档案详情',
      content: `姓名：${profile.name}\n性别：${profile.gender}\n年龄：${profile.age}岁\n关系：${profile.relationship}\n档案ID：${profile.profileId}\n状态：${profile.status === 'active' ? '活跃' : '非活跃'}`,
      showCancel: false,
      confirmText: '确定'
    });
  },

  // 编辑档案
  onEditProfile(e) {
    const id = e.currentTarget.dataset.id;
    const profile = this.data.profiles.find(p => p.id === id);
    
    if (!profile) {
      wx.showToast({
        title: '档案信息获取失败',
        icon: 'error'
      });
      return;
    }
    
    // 设置编辑的档案信息
    this.setData({
      editingProfile: { ...profile },
      showEditPopup: true
    });
  },

  // 弹窗状态变化
  onEditPopupChange(e) {
    this.setData({
      showEditPopup: e.detail.visible
    });
  },

  // 关闭编辑弹窗
  closeEditPopup() {
    this.setData({
      showEditPopup: false
    });
  },

  // 编辑姓名
  editName() {
    wx.showModal({
      title: '编辑姓名',
      editable: true,
      placeholderText: '请输入姓名',
      content: this.data.editingProfile.name,
      success: (res) => {
        if (res.confirm && res.content.trim()) {
          this.setData({
            'editingProfile.name': res.content.trim()
          });
        }
      }
    });
  },

  // 编辑性别
  editGender() {
    wx.showActionSheet({
      itemList: this.data.genderOptions,
      success: (res) => {
        this.setData({
          'editingProfile.gender': this.data.genderOptions[res.tapIndex]
        });
      }
    });
  },

  // 编辑年龄
  editAge() {
    wx.showModal({
      title: '设置年龄',
      editable: true,
      placeholderText: '请输入年龄',
      content: this.data.editingProfile.age,
      success: (res) => {
        if (res.confirm && res.content.trim()) {
          const age = parseInt(res.content.trim());
          if (age > 0 && age < 150) {
            this.setData({
              'editingProfile.age': age.toString()
            });
          } else {
            wx.showToast({
              title: '请输入有效年龄',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 编辑地址
  editAddress() {
    wx.showModal({
      title: '编辑地址',
      editable: true,
      placeholderText: '请输入地址',
      content: this.data.editingProfile.address,
      success: (res) => {
        if (res.confirm && res.content.trim()) {
          this.setData({
            'editingProfile.address': res.content.trim()
          });
        }
      }
    });
  },

  // 编辑关系
  editRelationship() {
    wx.showActionSheet({
      itemList: this.data.relationshipOptions,
      success: (res) => {
        this.setData({
          'editingProfile.relationship': this.data.relationshipOptions[res.tapIndex]
        });
      }
    });
  },

  // 编辑手机号
  editPhone() {
    wx.showModal({
      title: '编辑手机号',
      editable: true,
      placeholderText: '请输入手机号',
      content: this.data.editingProfile.phone,
      success: (res) => {
        if (res.confirm && res.content.trim()) {
          const phone = res.content.trim();
          // 简单的手机号验证
          if (/^1[3-9]\d{9}$/.test(phone)) {
            this.setData({
              'editingProfile.phone': phone
            });
          } else {
            wx.showToast({
              title: '请输入有效手机号',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 保存档案信息
  saveProfile() {
    const { editingProfile } = this.data;
    
    // 验证必填字段
    if (!editingProfile.name.trim()) {
      wx.showToast({
        title: '请输入姓名',
        icon: 'error'
      });
      return;
    }

    if (!editingProfile.age || parseInt(editingProfile.age) <= 0) {
      wx.showToast({
        title: '请输入有效年龄',
        icon: 'error'
      });
      return;
    }

    // 显示保存中
    wx.showLoading({
      title: '保存中...'
    });

    // 模拟保存操作
    setTimeout(() => {
      wx.hideLoading();
      
      // 更新档案列表
      const profiles = this.data.profiles.map(p => {
        if (p.id === editingProfile.id) {
          return { ...p, ...editingProfile };
        }
        return p;
      });
      
      this.setData({ 
        profiles,
        showEditPopup: false 
      });
      
      this.calculateStats();
      this.filterProfiles();
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    }, 1000);
  },

  // 删除档案
  onDeleteProfile(e) {
    const id = e.currentTarget.dataset.id;
    const profile = this.data.profiles.find(p => p.id === id);
    
    if (!profile) {
      wx.showToast({
        title: '档案信息获取失败',
        icon: 'error'
      });
      return;
    }
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除 ${profile.name} 的档案吗？\n\n此操作不可恢复，请谨慎操作。`,
      confirmText: '删除',
      confirmColor: '#e34d59',
      success: (res) => {
        if (res.confirm) {
          // 从列表中移除
          const profiles = this.data.profiles.filter(p => p.id !== id);
          this.setData({ profiles });
          this.calculateStats();
          this.filterProfiles();
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 添加新档案
  onAddProfile() {
    wx.navigateTo({
      url: '/pages/create-profile/create-profile',
      success: () => {
        console.log('跳转到创建档案页面');
      },
      fail: (err) => {
        console.error('跳转失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'error'
        });
      }
    });
  }
}) 