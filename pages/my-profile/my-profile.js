// my-profile.js
const api = require('../../utils/api.js')
const common = require('../../utils/common.js')

Page({
  data: {
    searchValue: '',
    totalProfiles: 0,
    activeProfiles: 0,
    recentUpdates: 0,
    showEditPopup: false,
    loading: false,
    editingProfile: {
      id: '',
      name: '',
      gender: '',
      age: '',
      address: '',
      relationship: '',
      phone: ''
    },
    genderOptions: ['男', '女'],
    relationshipOptions: ['本人', '配偶', '子女', '父母', '其他'],
    profiles: [],
    filteredProfiles: []
  },

  onLoad() {
    this.loadUserProfiles();
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadUserProfiles();
  },

  // 加载用户档案数据
  async loadUserProfiles() {
    try {
      this.setData({ loading: true })

      const response = await api.user.getUsers()

      if (response.success && response.data && response.data.subUsers) {
        const profiles = this.formatProfiles(response.data.subUsers)

        // 为每个用户加载实际的检测统计数据
        await this.loadDetectionStats(profiles)

        this.setData({ profiles })

        // 计算统计数据
        this.calculateStats()
        // 过滤数据
        this.filterProfiles()

      } else {
        console.warn('获取用户档案失败:', response)
        common.showError(response.message || '获取用户档案失败')
        this.setData({ profiles: [] })
      }
    } catch (error) {
      console.error('加载用户档案失败:', error)
      common.showError('加载用户档案失败')
      this.setData({ profiles: [] })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载每个用户的实际检测统计数据
  async loadDetectionStats(profiles) {
    try {
      // 并行加载所有用户的档案和检测记录
      const statsPromises = profiles.map(async (profile) => {
        try {
          // 1. 获取该用户的所有档案
          const archivesResponse = await api.profile.getArchives(profile.id, {}, { showError: false })

          let totalDetections = 0
          let uniqueArchives = 0

          if (archivesResponse.success && archivesResponse.data) {
            const archives = archivesResponse.data.archives || []
            uniqueArchives = archives.length

            // 2. 为每个档案获取检测记录数量
            const detectionPromises = archives.map(async (archive) => {
              try {
                const detectionResponse = await api.profile.getArchiveDetections({
                  subUserId: profile.id,
                  archiveId: archive.id
                })

                if (detectionResponse.success && detectionResponse.data) {
                  const images = detectionResponse.data.images || []
                  return images.length
                }
                return 0
              } catch (error) {
                console.error(`获取档案 ${archive.archiveName} 的检测记录失败:`, error)
                return 0
              }
            })

            // 等待所有档案的检测记录加载完成
            const detectionCounts = await Promise.all(detectionPromises)
            totalDetections = detectionCounts.reduce((sum, count) => sum + count, 0)

            console.log(`用户 ${profile.name}: 档案数=${uniqueArchives}, 检测记录=${totalDetections}`)

            // 更新统计数据
            profile.archives = uniqueArchives
            profile.photos = totalDetections // 检测次数即照片次数
            profile.reports = totalDetections // 每次检测都会生成报告
          } else {
            // 如果获取档案失败，设为0
            profile.archives = 0
            profile.photos = 0
            profile.reports = 0
          }
        } catch (error) {
          console.error(`加载用户 ${profile.name} 的检测统计失败:`, error)
          // 出错时设为0
          profile.archives = 0
          profile.photos = 0
          profile.reports = 0
        }
      })

      await Promise.all(statsPromises)
    } catch (error) {
      console.error('加载检测统计数据失败:', error)
    }
  },

  // 格式化用户档案数据
  formatProfiles(subUsers) {
    if (!Array.isArray(subUsers)) {
      return []
    }

    return subUsers.map(user => {
      // 过滤掉"微信用户"这个默认昵称
      let name = '未知用户'
      if (user.username && user.username !== '微信用户' && user.username.trim() !== '') {
        name = user.username
      } else if (user.realName && user.realName !== '微信用户' && user.realName.trim() !== '') {
        name = user.realName
      }

      return {
        id: user.id,
        name: name,
        gender: user.gender || '未知',
        age: user.age || '未知',
        relationship: this.getRelationshipFromUser(user),
        avatar: '/images/default-avatar.png',
        profileId: user.id,
        updateTime: common.formatTime(user.updatedAt || user.createdAt, 'YYYY-MM-DD HH:mm'),
        status: user.status || 'active',
        address: user.address || '未知',
        archives: user.archives || 0,
        photos: user.photos || 0,
        reports: user.reports || 0,
        originalData: user
      }
    })
  },

  // 根据用户信息推断关系
  getRelationshipFromUser(user) {
    // 这里可以根据用户信息推断关系，暂时返回默认值
    return '本人'
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
      content: `姓名：${profile.name}\n性别：${profile.gender}\n年龄：${profile.age}岁\n关系：${profile.relationship}\n档案ID：${profile.profileId}\n状态：${profile.status === 'active' ? '活跃' : '非活跃'}\n档案数量：${profile.archives}\n照片数量：${profile.photos}\n报告数量：${profile.reports}`,
      showCancel: false,
      confirmText: '确定'
    });
  },

  // 编辑档案
  async onEditProfile(e) {
    const id = e.currentTarget.dataset.id;
    const profile = this.data.profiles.find(p => p.id === id);
    
    if (!profile) {
      wx.showToast({
        title: '档案信息获取失败',
        icon: 'error'
      });
      return;
    }
    
    // 显示加载中
    wx.showLoading({
      title: '加载中...'
    });
    
    try {
      // 获取最新的用户信息
      const response = await api.user.getSubUser(id)
      
      wx.hideLoading()
      
      if (response.success && response.data) {
        const userData = response.data

        // 过滤掉"微信用户"这个默认昵称
        let name = ''
        if (userData.username && userData.username !== '微信用户' && userData.username.trim() !== '') {
          name = userData.username
        } else if (userData.realName && userData.realName !== '微信用户' && userData.realName.trim() !== '') {
          name = userData.realName
        }

        // 设置编辑的档案信息
        this.setData({
          editingProfile: {
            id: userData.id,
            name: name,
            gender: userData.gender || '',
            age: userData.age || '',
            address: userData.address || '',
            relationship: this.getRelationshipFromUser(userData)
          },
          showEditPopup: true
        });
      } else {
        console.warn('获取用户详情失败:', response)
        // 使用本地数据作为备选
        this.setData({
          editingProfile: { ...profile },
          showEditPopup: true
        });
        wx.showToast({
          title: '获取最新信息失败，使用本地数据',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading()
      console.error('获取用户详情失败:', error)
      // 使用本地数据作为备选
      this.setData({
        editingProfile: { ...profile },
        showEditPopup: true
      });
      wx.showToast({
        title: '获取最新信息失败，使用本地数据',
        icon: 'none'
      });
    }
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

  // 编辑用户名
  editName() {
    wx.showModal({
      title: '编辑用户名',
      editable: true,
      placeholderText: '请输入用户名（2-20个字符）',
      content: this.data.editingProfile.name,
      success: (res) => {
        if (res.confirm && res.content.trim()) {
          const username = res.content.trim();
          // 验证用户名长度
          if (username.length < 2 || username.length > 20) {
            wx.showToast({
              title: '用户名长度必须在2-20个字符之间',
              icon: 'error'
            });
            return;
          }
          this.setData({
            'editingProfile.name': username
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
  // 保存档案信息
  async saveProfile() {
    const { editingProfile } = this.data;
    
    // 验证必填字段
    if (!editingProfile.name.trim()) {
      wx.showToast({
        title: '请输入用户名',
        icon: 'error'
      });
      return;
    }

    // 验证用户名长度（2-20个字符）
    if (editingProfile.name.trim().length < 2 || editingProfile.name.trim().length > 20) {
      wx.showToast({
        title: '用户名长度必须在2-20个字符之间',
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

    try {
      // 准备更新数据
      const updateData = {
        username: editingProfile.name, // 使用username而不是realName
        realName: editingProfile.name, // 同时保留realName作为真实姓名
        age: parseInt(editingProfile.age),
        gender: editingProfile.gender,
        address: editingProfile.address
      }

      
      // 调用更新接口
      const response = await api.user.updateSubUser(editingProfile.id, updateData)
      
      wx.hideLoading()
      
      if (response.success || response.code === 200) {
        // 更新本地数据
        const profiles = this.data.profiles.map(p => {
          if (p.id === editingProfile.id) {
            return {
              ...p,
              ...editingProfile,
              updateTime: common.formatTime(new Date(), 'YYYY-MM-DD HH:mm')
            };
          }
          return p;
        });

        this.setData({
          profiles,
          showEditPopup: false
        });

        this.calculateStats();
        this.filterProfiles();

        // 同步更新全局用户信息和storage
        const userInfo = storage.getUserInfo()
        if (userInfo && userInfo.currentSubUser && userInfo.currentSubUser.id === editingProfile.id) {
          // 如果更新的是当前子用户，需要同步更新全局存储
          userInfo.currentSubUser.username = editingProfile.name
          userInfo.currentSubUser.realName = editingProfile.name
          userInfo.currentSubUser.age = parseInt(editingProfile.age)
          userInfo.currentSubUser.gender = editingProfile.gender
          userInfo.currentSubUser.address = editingProfile.address

          storage.setUserInfo(userInfo)
          storage.setCurrentSubUser(userInfo.currentSubUser)

          // 同步更新app.js中的全局数据
          const app = getApp()
          if (app) {
            app.setUserInfo(userInfo)
          }
        }

        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      } else {
        console.warn('更新用户失败:', response)
        wx.showToast({
          title: response.message || '保存失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading()
      console.error('保存失败:', error)
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    }
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
      fail: (err) => {
        wx.showToast({
          title: '页面跳转失败',
          icon: 'error'
        });
      }
    });
  }
}) 