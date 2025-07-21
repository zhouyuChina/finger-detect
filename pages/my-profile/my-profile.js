// my-profile.js
Page({
  data: {
    searchValue: '',
    totalProfiles: 0,
    activeProfiles: 0,
    recentUpdates: 0,
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

    if (searchValue) {
      filtered = profiles.filter(profile => 
        profile.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        profile.profileId.toLowerCase().includes(searchValue.toLowerCase())
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
    
    wx.showModal({
      title: '档案详情',
      content: `姓名：${profile.name}\n性别：${profile.gender}\n年龄：${profile.age}岁\n关系：${profile.relationship}\n档案ID：${profile.profileId}`,
      showCancel: false
    });
  },

  // 编辑档案
  onEditProfile(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '编辑档案',
      content: '编辑档案功能开发中',
      showCancel: false
    });
  },

  // 删除档案
  onDeleteProfile(e) {
    const id = e.currentTarget.dataset.id;
    const profile = this.data.profiles.find(p => p.id === id);
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除 ${profile.name} 的档案吗？此操作不可恢复。`,
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
      url: '/pages/create-profile/create-profile'
    });
  }
}) 