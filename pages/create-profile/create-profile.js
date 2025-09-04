// create-profile.js
const api = require('../../utils/api.js')
const storage = require('../../utils/storage.js')
const common = require('../../utils/common.js')
const config = require('../../utils/config.js')
const areaData = require('../../utils/area.js')

Page({
  data: {
    currentStep: 1, // 当前步骤：1-档案信息，2-拍照检测，3-完成
    
    // 用户相关
    wechatUser: null, // 微信用户信息
    subUsers: [], // 子用户列表
    currentSubUser: null, // 当前选中的子用户
    selectedUser: null, // 当前选择的用户
    selectedUserProfiles: [], // 当前用户的档案列表
    loading: false, // 加载状态
    error: false, // 错误状态
    errorMessage: '', // 错误信息
    
    // 完善信息模式相关
    isCompleteMode: false, // 是否是完善信息模式
    popupTitle: '新增用户', // 弹窗标题
    
    // 档案相关
    selectedProfile: null, // 当前选择的档案
    
    // 弹窗控制
    showUserSelector: false,
    showNicknamePopup: false,
    showBirthYearPopup: false,
    showAddressPopup: false,
    showBirthYearSelector: false,
    showProvinceSelector: false,
    showCitySelector: false,
    showDistrictSelector: false,
    showBodyPartPopup: false,
    showDetailPartPopup: false,
    
    // 表单数据
    userForm: {
      nickname: '新用户',
      gender: '1', // 默认男性
      birthYear: '',
      province: '',
      city: '',
      district: ''
    },
    
    // 身体部位数据
    bodyParts: [
      { value: 'leftHand', name: '左手', icon: '🤚' },
      { value: 'rightHand', name: '右手', icon: '🤚' },
      { value: 'leftFoot', name: '左脚', icon: '🦶' },
      { value: 'rightFoot', name: '右脚', icon: '🦶' }
    ],
    selectedBodyPart: null,
    detailParts: [],
    
    // 手指选项
    fingerParts: [
      { value: 'thumb', name: '大拇指' },
      { value: 'index', name: '食指' },
      { value: 'middle', name: '中指' },
      { value: 'ring', name: '无名指' },
      { value: 'little', name: '小指' }
    ],
    
    // 脚趾选项
    toeParts: [
      { value: 'bigToe', name: '大脚趾' },
      { value: 'secondToe', name: '第二脚趾' },
      { value: 'thirdToe', name: '第三脚趾' },
      { value: 'fourthToe', name: '第四脚趾' },
      { value: 'littleToe', name: '小脚趾' }
    ],
    selectedFingerPart: null,
    
    // 选项数据
    birthYearOptions: [],
    provinceOptions: [],
    cityOptions: [],
    districtOptions: [],
    
    // 省市县数据
    regionData: areaData,
    
    // 用户创建步骤
    userCreateStep: 1 // 1-昵称，2-出生年份，3-地址
  },

  onLoad(options) {
    
    // 检查是否是完善信息模式
    const isCompleteMode = options.mode === 'complete'
    
    // 生成出生年份选项（当前年份往前推100年）
    const currentYear = new Date().getFullYear();
    const birthYearOptions = [];
    for (let year = currentYear; year >= currentYear - 100; year--) {
      birthYearOptions.push(year);
    }
    
    // 初始化省份选项
    const provinceOptions = Object.keys(areaData);
    
    this.setData({ 
      birthYearOptions,
      provinceOptions
    });
    
    if (isCompleteMode) {
      // 完善信息模式：直接加载当前用户信息并进入完善流程
      this.setData({ 
        isCompleteMode: true,
        popupTitle: '完善个人信息'
      })
      this.loadCurrentUserForCompletion()
    } else {
      // 正常模式：加载用户数据
      this.setData({ 
        isCompleteMode: false,
        popupTitle: '新增用户'
      })
      this.loadUsers();
    }
  },

  onShow() {
    // 页面显示时，如果已经选择了用户，重新加载档案
    if (this.data.selectedUser && this.data.selectedUser.username && this.data.selectedUser.id) {
      this.loadUserProfiles(this.data.selectedUser.id);
    }
  },

  // 加载当前用户信息用于完善
  async loadCurrentUserForCompletion() {
    try {
      this.setData({ loading: true, error: false })
      
      
      // 获取当前用户信息
      const userInfo = storage.getUserInfo()
      if (!userInfo) {
        this.handleError('未找到用户信息，请重新登录')
        return
      }
      
      
      // 设置当前用户为选中状态
      const currentUser = {
        id: userInfo.id || userInfo.subUserId, // 使用真实的用户ID
        nickname: userInfo.nickname || userInfo.realName || '我',
        username: userInfo.username || userInfo.nickname,
        age: userInfo.age || 0,
        address: userInfo.address || '未知地址',
        phone: userInfo.phone || '',
        email: userInfo.email || '',
        gender: userInfo.gender || '0',
        archives: userInfo.archives || 0,
        photos: userInfo.photos || 0,
        reports: userInfo.reports || 0,
        remark: '当前用户',
        status: 'active',
        createdAt: userInfo.createdAt,
        updatedAt: userInfo.updatedAt,
        isCurrentUser: true // 标记为当前用户
      }
      
      this.setData({ 
        selectedUser: currentUser,
        isEditingMyself: true,
        currentStep: 1 // 从第一步开始
      })
      
      // 预填充表单数据
      const userForm = {
        nickname: userInfo.nickname || userInfo.realName || '新用户',
        gender: userInfo.gender || '1',
        birthYear: userInfo.birthYear || '',
        province: userInfo.province || '',
        city: userInfo.city || '',
        district: userInfo.district || ''
      }
      
      this.setData({ userForm })
      
      
      // 在完善信息模式下，直接显示信息编辑弹窗
      setTimeout(() => {
        this.showUserInfoEditPopup()
      }, 500)
      
    } catch (error) {
      console.error('加载当前用户信息失败:', error)
      this.handleError('加载用户信息失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载用户数据
  async loadUsers() {
    try {
      this.setData({ loading: true, error: false })
      
      // 检查用户是否已登录
      const userInfo = storage.getUserInfo()
      const openId = storage.getOpenId()
      
      if (!userInfo || !openId) {
        // 未登录用户，直接进入拍照检测流程
        this.setData({ 
          loading: false,
          currentStep: 2, // 直接进入第二步：拍照检测
          showUserSelector: false
        })
        return
      }
      
      const response = await api.user.getUsers()
      
      if (response.success && response.data) {
        const { wechatUser, subUsers, currentSubUser } = response.data
        
        // 格式化用户数据
        const formattedSubUsers = this.formatSubUsers(subUsers)
        
        // 默认选择当前账号下的默认用户（currentSubUser）
        let selectedUser = null
        if (currentSubUser && formattedSubUsers.length > 0) {
          // 找到对应的默认用户
          selectedUser = formattedSubUsers.find(user => user.id === currentSubUser.id)
          if (selectedUser) {
          }
        } else if (formattedSubUsers.length > 0) {
          // 如果没有找到currentSubUser，选择第一个用户作为默认
          selectedUser = formattedSubUsers[0]
        }
        
        this.setData({ 
          wechatUser,
          subUsers: formattedSubUsers, // 使用包含默认用户的完整列表
          currentSubUser,
          selectedUser: selectedUser
        })
        
        
        // 总是显示用户选择器，让用户确认选择
        setTimeout(() => {
          this.setData({ showUserSelector: true });
        }, 500);
      } else {
        console.warn('用户数据接口返回错误:', response)
        this.handleError(response.message || '获取用户数据失败')
      }
    } catch (error) {
      console.error('加载用户数据失败:', error)
      this.handleError('网络错误，请稍后重试')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 格式化子用户数据
  formatSubUsers(subUsers) {
    if (!Array.isArray(subUsers)) {
      return []
    }

    return subUsers.map(user => ({
      id: user.id,
      nickname: user.realName || user.username || '未知用户',
      username: user.username,
      age: user.age || 0,
      address: user.address || '未知地址',
      phone: user.phone || '',
      email: user.email || '',
      gender: user.gender || '0',
      archives: user.archives || 0,
      photos: user.photos || 0,
      reports: user.reports || 0,
      remark: user.remark || '',
      status: user.status || 'active',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }))
  },

  // 开始拍照检测（未登录用户）
  startPhotoDetection() {
    
    // 直接跳转到拍照检测页面
    wx.navigateTo({
      url: '/pages/photo-detection/photo-detection',
      success: () => {
      },
      fail: (error) => {
        console.error('跳转到拍照检测页面失败:', error)
        common.showError('页面跳转失败')
      }
    })
  },

  // 格式化档案数据
  formatArchives(archives) {
    if (!Array.isArray(archives)) {
      return []
    }

    return archives.map(archive => {
      return {
        id: archive.id,
        name: archive.archiveName,
        photoCount: archive.photoCount || 0,
        detectionTime: archive.detectionTime,
        createdAt: archive.createdAt,
        updatedAt: archive.updatedAt,
        // 保留原始数据用于传递
        originalData: archive,
        // 添加用户信息
        username: this.data.selectedUser?.username,
        subUserId: this.data.selectedUser?.id
      }
    })
  },



  // 获取身体部位值（根据档案名称）
  getBodyPartValueFromArchiveName(archiveName) {
    // 根据档案名称映射到bodyPart值
    const bodyPartMap = {
      // 左手检测类型
      '左手大拇指': 'left_hand_thumb',
      '左手食指': 'left_hand_index',
      '左手中指': 'left_hand_middle',
      '左手无名指': 'left_hand_ring',
      '左手小指': 'left_hand_little',
      
      // 右手检测类型
      '右手大拇指': 'right_hand_thumb',
      '右手食指': 'right_hand_index',
      '右手中指': 'right_hand_middle',
      '右手无名指': 'right_hand_ring',
      '右手小指': 'right_hand_little',
      
      // 左脚检测类型
      '左脚大脚趾': 'left_foot_big',
      '左脚第二脚趾': 'left_foot_second',
      '左脚第三脚趾': 'left_foot_third',
      '左脚第四脚趾': 'left_foot_fourth',
      '左脚小脚趾': 'left_foot_little',
      
      // 右脚检测类型
      '右脚大脚趾': 'right_foot_big',
      '右脚第二脚趾': 'right_foot_second',
      '右脚第三脚趾': 'right_foot_third',
      '右脚第四脚趾': 'right_foot_fourth',
      '右脚小脚趾': 'right_foot_little'
    }
    
    const bodyPart = bodyPartMap[archiveName]
    
    if (!bodyPart) {
      console.warn('未找到对应的bodyPart，使用默认值 left_hand_thumb')
      return 'left_hand_thumb'
    }
    
    return bodyPart
  },

  // 获取身体部位值（旧方法，保留兼容性）
  getBodyPartValue(bodyPart) {
    const valueMap = {
      'leftHand': 'fingerprint',
      'rightHand': 'fingerprint',
      'leftFoot': 'fingerprint',
      'rightFoot': 'fingerprint'
    }
    return valueMap[bodyPart] || 'fingerprint'
  },

  // 处理错误
  handleError(message) {
    this.setData({ 
      error: true, 
      errorMessage: message 
    })
    common.showError(message)
  },

  // 重新加载
  onRetry() {
    this.loadUsers()
  },

  // 显示用户选择弹窗
  showUserSelector() {
    this.setData({
      showUserSelector: true
    });
  },

  // 关闭用户选择器
  closeUserSelector() {
    this.setData({ showUserSelector: false });
  },

  // 确认用户选择
  confirmUserSelection() {
    if (this.data.selectedUser && this.data.selectedUser.id) {
      this.setData({ 
        showUserSelector: false,
        currentStep: 2
      });
      this.loadUserProfiles(this.data.selectedUser.id);
    } else {
      wx.showToast({
        title: '请选择用户',
        icon: 'none'
      });
    }
  },



  // 计算年龄
  calculateAge(birthDate) {
    if (!birthDate) return 0
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  },

  // 选择其他用户
  selectUser(e) {
    const user = e.currentTarget.dataset.user;
    this.setData({
      selectedUser: user
    });
    
    // 更新 currentSubUser 缓存
    if (user && user.id) {
      storage.setCurrentSubUser(user);
      
      // 同时更新全局用户信息中的 currentSubUser
      const currentUserInfo = storage.getUserInfo();
      if (currentUserInfo) {
        currentUserInfo.currentSubUser = user;
        storage.setUserInfo(currentUserInfo);
      }
    }
  },

  // 新增用户
  addNewUser() {
    this.setData({
      isEditingMyself: false,
      userForm: { nickname: '', birthYear: '', province: '', city: '', district: '' },
      userCreateStep: 1,
      showUserSelector: false,
      showNicknamePopup: true
    });
  },

  // 加载用户档案
  async loadUserProfiles(userId) {
    try {
      

      
      // 获取用户信息
      const selectedUser = this.data.selectedUser;

      if (!selectedUser || !selectedUser.id) {
        console.warn('用户信息不完整，无法获取档案')
        console.warn('selectedUser:', selectedUser)
        console.warn('用户ID:', selectedUser?.id)
        this.setData({ selectedUserProfiles: [] });
        return;
      }
      
      // 调用档案列表接口
      const currentUser = storage.getUserInfo()
      
      // 确定正确的subUserId
      const subUserId = currentUser.currentSubUser.id
      
      const response = await api.profile.getArchives(subUserId)
      
      if (response.success && response.data) {
        const archives = response.data.archives || []
        
        // 格式化档案数据
        const formattedProfiles = this.formatArchives(archives)
        
        // 为每个档案获取检测次数
        await this.loadDetectionCounts(formattedProfiles)
        
        this.setData({ selectedUserProfiles: formattedProfiles });
      } else {
        console.warn('档案列表接口返回错误:', response)
        // 如果接口失败，显示空状态
        this.setData({ selectedUserProfiles: [] });
      }
    } catch (error) {
      console.error('加载用户档案失败:', error)
      // 如果接口失败，显示空状态
      this.setData({ selectedUserProfiles: [] });
    }
  },

  // 选择档案
  selectProfile(e) {
    const profile = e.currentTarget.dataset.profile;
    const index = e.currentTarget.dataset.index;
    
    
    this.setData({ selectedProfile: profile });
    
    // 选择档案后直接跳转到拍照页面
    wx.showToast({
      title: '档案选择完成',
      icon: 'success'
    });

    setTimeout(() => {
      wx.navigateTo({
        url: `/pages/photo-detection/photo-detection?profile=${encodeURIComponent(JSON.stringify(profile))}`
      });
    }, 1000);
  },

  // 新增档案
  addNewProfile() {
    this.setData({ showBodyPartPopup: true });
  },

  // 为档案列表加载检测次数
  async loadDetectionCounts(profiles) {
    try {
      
      const selectedUser = this.data.selectedUser
      if (!selectedUser || !selectedUser.id) {
        console.warn('缺少用户ID，无法获取检测次数')
        return
      }
      
      // 一次性获取所有检测记录，然后按档案名称分组统计
      try {
        // 确定正确的subUserId - 从currentSubUser中获取
        const currentUser = storage.getUserInfo()
        const subUserId = currentUser.currentSubUser.id
        
        const detectionResponse = await api.detection.getList({
          subUserId: subUserId
        })
        
        
        if (detectionResponse.success && detectionResponse.data) {
          const detections = detectionResponse.data.detections || detectionResponse.data || []
          
          // 按档案名称统计检测次数
          const detectionCounts = {}
          detections.forEach(detection => {
            const archiveName = detection.archiveName
            if (archiveName) {
              detectionCounts[archiveName] = (detectionCounts[archiveName] || 0) + 1
            }
          })
          
          
          // 更新每个档案的检测次数
          profiles.forEach((profile, index) => {
            const count = detectionCounts[profile.name] || 0
            profiles[index].photoCount = count
          })
        } else {
          console.warn('获取检测记录失败:', detectionResponse)
          // 如果获取失败，所有档案的检测次数设为0
          profiles.forEach((profile, index) => {
            profiles[index].photoCount = 0
          })
        }
      } catch (error) {
        console.error('获取检测记录出错:', error)
        // 如果出错，所有档案的检测次数设为0
        profiles.forEach((profile, index) => {
          profiles[index].photoCount = 0
        })
      }
      
    } catch (error) {
      console.error('加载检测次数失败:', error)
    }
  },

  // 选择身体部位
  selectBodyPart(e) {
    const part = e.currentTarget.dataset.part;
    this.setData({
      selectedBodyPart: part,
      showBodyPartPopup: false
    });

    // 根据身体部位设置详细选项
    if (part.value.includes('Hand')) {
      this.setData({ detailParts: this.data.fingerParts });
    } else {
      this.setData({ detailParts: this.data.toeParts });
    }

    // 显示详细部位选择弹窗
    setTimeout(() => {
      this.setData({ showDetailPartPopup: true });
    }, 300);
  },

  // 选择详细部位
  async selectDetailPart(e) {
    const part = e.currentTarget.dataset.part;
    const bodyPart = this.data.selectedBodyPart;
    
    // 获取用户信息
    const selectedUser = this.data.selectedUser;
    
    if (!selectedUser) {
      console.error('用户信息不存在')
      wx.showToast({
        title: '用户信息不存在，请重新选择用户',
        icon: 'none'
      });
      return;
    }
    
    if (!selectedUser.id) {
      console.error('用户信息不完整，缺少用户ID:', selectedUser)
      wx.showToast({
        title: '用户信息不完整，请重新选择用户',
        icon: 'none'
      });
      return;
    }

    // 准备档案数据
    const archiveName = `${bodyPart.name}${part.name}`
    
    // 获取当前用户的subUserId
    const currentUser = storage.getUserInfo()
    const subUserId = currentUser.currentSubUser.id
    
    const archiveData = {
      subUserId: subUserId,
      archiveName: archiveName,
      bodyPart: this.getBodyPartValueFromArchiveName(archiveName)
    }
    
    // 创建档案
    let response
    try {
      response = await api.profile.create(archiveData)
    } catch (error) {
      console.error('创建档案API调用失败:', error)
      // 处理API调用失败的情况
      let errorMessage = '创建档案失败'
      
      if (error.message) {
        // 如果错误对象有message字段，直接使用
        errorMessage = error.message
      } else if (error.code) {
        // 根据错误码判断
        if (error.code === 409) {
          errorMessage = '档案名称已存在'
        } else if (error.code === 400) {
          errorMessage = '请求参数错误'
        } else {
          errorMessage = error.message || '创建档案失败'
        }
      }
      
      wx.showToast({
        title: errorMessage,
        icon: 'none'
      });
      return;
    }
    
    if (response && response.success && response.data) {
      const newArchive = response.data
      
      // 根据实际返回的数据结构，档案信息在 archive 字段中
      const archiveData = newArchive.archive || newArchive
        id: archiveData.id,
        archiveId: archiveData.archiveId,
        _id: archiveData._id
      });
      
      // 检查档案是否有ID，尝试不同的字段名
      const archiveId = archiveData.id || archiveData.archiveId || archiveData._id;
      if (!archiveId) {
        console.error('新创建的档案缺少ID:', archiveData)
        wx.showToast({
          title: '档案创建失败：缺少档案ID',
          icon: 'none'
        });
        return;
      }
      
      // 重新加载档案列表
      await this.loadUserProfiles(selectedUser.id)
      
      // 设置新创建的档案为选中状态
      const formattedArchive = this.formatArchives([archiveData])[0]
        id: formattedArchive.id,
        archiveId: formattedArchive.archiveId,
        _id: formattedArchive._id
      });
      
      // 再次检查格式化后的档案是否有ID，尝试不同的字段名
      const formattedArchiveId = formattedArchive.id || formattedArchive.archiveId || formattedArchive._id;
      if (!formattedArchiveId) {
        console.error('格式化后的档案缺少ID:', formattedArchive)
        wx.showToast({
          title: '档案格式化失败：缺少档案ID',
          icon: 'none'
        });
        return;
      }
      
      this.setData({
        selectedProfile: formattedArchive,
        showDetailPartPopup: false
      })
      
      // 显示成功提示
      wx.showToast({
        title: '档案创建成功',
        icon: 'success'
      });
      
    } else if (response) {
      console.error('创建档案失败，响应:', response)
      // 使用服务器返回的错误消息
      const errorMessage = response.message || '创建档案失败'
      wx.showToast({
        title: errorMessage,
        icon: 'none'
      });
    }
  },

  // 用户创建步骤控制
  nextUserStep() {
    const { userCreateStep, userForm } = this.data;
    
    if (userCreateStep === 1) {
      // 验证昵称
      if (!userForm.nickname || userForm.nickname.trim() === '') {
        wx.showToast({
          title: '请输入用户昵称',
          icon: 'none'
        });
        return;
      }
      
      // 验证性别
      if (!userForm.gender) {
        wx.showToast({
          title: '请选择性别',
          icon: 'none'
        });
        return;
      }
      
      // 进入第二步
      this.setData({
        userCreateStep: 2,
        showNicknamePopup: false,
        showBirthYearPopup: true
      });
    } else if (userCreateStep === 2) {
      // 验证出生年份
      if (!userForm.birthYear) {
        wx.showToast({
          title: '请选择出生年份',
          icon: 'none'
        });
        return;
      }
      // 进入第三步
      this.setData({
        userCreateStep: 3,
        showBirthYearPopup: false,
        showAddressPopup: true
      });
    }
  },

  prevUserStep() {
    const { userCreateStep } = this.data;
    
    if (userCreateStep === 2) {
      // 返回第一步
      this.setData({
        userCreateStep: 1,
        showBirthYearPopup: false,
        showNicknamePopup: true
      });
    } else if (userCreateStep === 3) {
      // 返回第二步
      this.setData({
        userCreateStep: 2,
        showAddressPopup: false,
        showBirthYearPopup: true
      });
    }
  },

  // 昵称输入处理
  onNicknameInput(e) {
    this.setData({
      'userForm.nickname': e.detail.value
    });
  },

  // 性别选择
  selectGender(e) {
    const gender = e.currentTarget.dataset.gender;
    this.setData({
      'userForm.gender': gender
    });
  },

  // 出生年份选择
  showBirthYearSelector() {
    this.setData({ showBirthYearSelector: true });
  },

  closeBirthYearSelector() {
    this.setData({ showBirthYearSelector: false });
  },

  selectBirthYear(e) {
    const year = e.currentTarget.dataset.year;
    this.setData({ 
      'userForm.birthYear': year,
      showBirthYearSelector: false
    });
  },

  confirmBirthYear() {
    if (this.data.userForm.birthYear) {
      this.setData({ showBirthYearSelector: false });
    } else {
      wx.showToast({
        title: '请选择出生年份',
        icon: 'none'
      });
    }
  },

  // 省份选择
  showProvinceSelector() {
    this.setData({ showProvinceSelector: true });
  },

  closeProvinceSelector() {
    this.setData({ showProvinceSelector: false });
  },

  selectProvince(e) {
    const province = e.currentTarget.dataset.province;
    const cities = Object.keys(this.data.regionData[province] || {});
    this.setData({ 
      'userForm.province': province,
      'userForm.city': '',
      'userForm.district': '',
      cityOptions: cities,
      districtOptions: [],
      showProvinceSelector: false
    });
  },

  confirmProvince() {
    if (this.data.userForm.province) {
      this.setData({ showProvinceSelector: false });
    } else {
      wx.showToast({
        title: '请选择省份',
        icon: 'none'
      });
    }
  },

  // 城市选择
  showCitySelector() {
    if (!this.data.userForm.province) {
      wx.showToast({
        title: '请先选择省份',
        icon: 'none'
      });
      return;
    }
    this.setData({ showCitySelector: true });
  },

  closeCitySelector() {
    this.setData({ showCitySelector: false });
  },

  selectCity(e) {
    const city = e.currentTarget.dataset.city;
    const province = this.data.userForm.province;
    const districts = this.data.regionData[province] && this.data.regionData[province][city] ? this.data.regionData[province][city] : [];
    this.setData({ 
      'userForm.city': city,
      'userForm.district': '',
      districtOptions: districts,
      showCitySelector: false
    });
  },

  confirmCity() {
    if (this.data.userForm.city) {
      this.setData({ showCitySelector: false });
    } else {
      wx.showToast({
        title: '请选择城市',
        icon: 'none'
      });
    }
  },

  // 区县选择
  showDistrictSelector() {
    if (!this.data.userForm.city) {
      wx.showToast({
        title: '请先选择城市',
        icon: 'none'
      });
      return;
    }
    this.setData({ showDistrictSelector: true });
  },

  closeDistrictSelector() {
    this.setData({ showDistrictSelector: false });
  },

  selectDistrict(e) {
    const district = e.currentTarget.dataset.district;
    this.setData({ 
      'userForm.district': district,
      showDistrictSelector: false
    });
  },

  confirmDistrict() {
    if (this.data.userForm.district) {
      this.setData({ showDistrictSelector: false });
    } else {
      wx.showToast({
        title: '请选择区县',
        icon: 'none'
      });
    }
  },



  // 关闭弹窗方法
  closeNicknamePopup() {
    this.setData({ 
      showNicknamePopup: false,
      userCreateStep: 1
    });
  },

  closeBirthYearPopup() {
    this.setData({ 
      showBirthYearPopup: false,
      userCreateStep: 1
    });
  },

  closeAddressPopup() {
    this.setData({ 
      showAddressPopup: false,
      userCreateStep: 1
    });
  },

  // 保存用户信息
  async saveUserInfo() {
    const { nickname, gender, birthYear, province, city, district } = this.data.userForm;
    
    if (!nickname || !gender || !birthYear || !province || !city || !district) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    // 计算年龄
    const currentYear = new Date().getFullYear();
    const age = currentYear - parseInt(birthYear);
    
    // 组合完整地址
    const address = `${province}${city}${district}`;
    const userInfo = { nickname, gender, birthYear, age, address, province, city, district };

    if (this.data.isEditingMyself) {
      // 保存本人信息
      try {
        // 更新用户信息到服务器
        const updateData = {
          nickname: nickname,
          realName: nickname,
          gender: gender,
          birthYear: birthYear,
          age: age,
          address: address,
          province: province,
          city: city,
          district: district
        }
        
        const response = await api.user.updateProfile(updateData)
        
        if (response.success && response.data) {
          // 更新本地存储的用户信息
          const currentUserInfo = storage.getUserInfo()
          
          // 更新 currentSubUser 的信息
          if (currentUserInfo.currentSubUser) {
            currentUserInfo.currentSubUser = {
              ...currentUserInfo.currentSubUser,
              ...updateData
            }
          }
          
          // 同时更新根级别的用户信息
          const updatedUserInfo = { 
            ...currentUserInfo, 
            ...updateData 
          }
          
          storage.setUserInfo(updatedUserInfo)
          
          // 关闭弹窗
          this.setData({
            showAddressPopup: false,
            showNicknamePopup: false,
            showBirthYearPopup: false
          })
          
          // 重新加载用户列表以获取最新数据
          await this.loadUsers()
          
          // 显示用户选择器
          this.setData({ showUserSelector: true })
      
        } else {
          throw new Error(response.message || '更新用户信息失败')
        }
      } catch (error) {
        console.error('更新用户信息失败:', error)
        wx.showToast({
          title: '更新信息失败，请重试',
          icon: 'none'
        })
      }
    } else {
      // 创建新用户
      try {
        const userData = {
          username: nickname,
          realName: nickname,
          gender: gender,
          birthYear: birthYear,
          age: age,
          address: address,
          province: province,
          city: city,
          district: district
        };

        
        // 调用创建子用户接口
        const response = await api.user.createSubUser(userData)
        
                  if (response.success && response.data) {
            const newUser = response.data.user || response.data

            // 更新缓存中的用户信息
            // 1. 获取当前用户信息
            const currentUserInfo = storage.getUserInfo() || {};
            
            // 2. 更新 currentSubUser 为新创建的用户
            storage.setCurrentSubUser(newUser);
            
            // 3. 更新 userInfo，保持原有结构，更新 currentSubUser
            const updatedUserInfo = {
              ...currentUserInfo,
              currentSubUser: newUser
            };
            storage.setUserInfo(updatedUserInfo);
            
            // 4. 更新 subUsers 列表，添加新用户
            const existingSubUsers = storage.getSubUsers() || [];
            const updatedSubUsers = [...existingSubUsers, newUser];
            storage.setSubUsers(updatedSubUsers);
  
            
            // 重新加载用户列表以获取最新数据
          await this.loadUsers()
          
          // 设置新创建的用户为选中状态
          this.setData({
            selectedUser: newUser,
            showAddressPopup: false,
            currentStep: 2
          });
          
          // 安全地访问用户ID
          if (newUser && newUser.id) {
            this.loadUserProfiles(newUser.id);
          } else {
            console.warn('新创建的用户缺少ID，跳过加载档案')
          }
          
          wx.showToast({
            title: '用户创建成功',
            icon: 'success'
          });
        } else {
          console.warn('创建子用户接口返回错误:', response)
          wx.showToast({
            title: response.message || '创建用户失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('创建子用户失败:', error)
        wx.showToast({
          title: '创建用户失败，请重试',
          icon: 'none'
        });
      }
    }
  },

  // 弹窗控制方法
  closeUserInfoPopup() {
    this.setData({ showUserInfoPopup: false });
  },

  closeBodyPartPopup() {
    this.setData({ showBodyPartPopup: false });
  },

  closeDetailPartPopup() {
    this.setData({ showDetailPartPopup: false });
  },

  // 显示用户信息编辑弹窗（完善信息模式使用）
  showUserInfoEditPopup() {
    this.setData({ 
      showNicknamePopup: true,
      userCreateStep: 1
    })
  },

  // 步骤控制
  nextStep() {
    if (this.data.currentStep === 1 && this.data.selectedUser) {
      this.setData({ currentStep: 2 });
    }
  },

  prevStep() {
    if (this.data.currentStep > 1) {
      this.setData({ 
        currentStep: this.data.currentStep - 1,
        selectedProfile: null
      });
    }
  }
}) 