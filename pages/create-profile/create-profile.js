// create-profile.js
const api = require('../../utils/api.js')
const storage = require('../../utils/storage.js')
const common = require('../../utils/common.js')
const config = require('../../utils/config.js')

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
    
    isEditingMyself: false, // 是否在编辑本人信息
    
    // 选项数据
    birthYearOptions: [],
    provinceOptions: [
      '北京市', '天津市', '河北省', '山西省', '内蒙古自治区',
      '辽宁省', '吉林省', '黑龙江省', '上海市', '江苏省',
      '浙江省', '安徽省', '福建省', '江西省', '山东省',
      '河南省', '湖北省', '湖南省', '广东省', '广西壮族自治区',
      '海南省', '重庆市', '四川省', '贵州省', '云南省',
      '西藏自治区', '陕西省', '甘肃省', '青海省', '宁夏回族自治区',
      '新疆维吾尔自治区'
    ],
    cityOptions: [],
    districtOptions: [],
    
    // 省市县数据
    regionData: {
      '北京市': ['北京市'],
      '天津市': ['天津市'],
      '河北省': ['石家庄市', '唐山市', '秦皇岛市', '邯郸市', '邢台市', '保定市', '张家口市', '承德市', '沧州市', '廊坊市', '衡水市'],
      '山西省': ['太原市', '大同市', '阳泉市', '长治市', '晋城市', '朔州市', '晋中市', '运城市', '忻州市', '临汾市', '吕梁市'],
      '内蒙古自治区': ['呼和浩特市', '包头市', '乌海市', '赤峰市', '通辽市', '鄂尔多斯市', '呼伦贝尔市', '巴彦淖尔市', '乌兰察布市'],
      '辽宁省': ['沈阳市', '大连市', '鞍山市', '抚顺市', '本溪市', '丹东市', '锦州市', '营口市', '阜新市', '辽阳市', '盘锦市', '铁岭市', '朝阳市', '葫芦岛市'],
      '吉林省': ['长春市', '吉林市', '四平市', '辽源市', '通化市', '白山市', '松原市', '白城市'],
      '黑龙江省': ['哈尔滨市', '齐齐哈尔市', '鸡西市', '鹤岗市', '双鸭山市', '大庆市', '伊春市', '佳木斯市', '七台河市', '牡丹江市', '黑河市', '绥化市'],
      '上海市': ['上海市'],
      '江苏省': ['南京市', '无锡市', '徐州市', '常州市', '苏州市', '南通市', '连云港市', '淮安市', '盐城市', '扬州市', '镇江市', '泰州市', '宿迁市'],
      '浙江省': ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市', '绍兴市', '金华市', '衢州市', '舟山市', '台州市', '丽水市'],
      '安徽省': ['合肥市', '芜湖市', '蚌埠市', '淮南市', '马鞍山市', '淮北市', '铜陵市', '安庆市', '黄山市', '滁州市', '阜阳市', '宿州市', '六安市', '亳州市', '池州市', '宣城市'],
      '福建省': ['福州市', '厦门市', '莆田市', '三明市', '泉州市', '漳州市', '南平市', '龙岩市', '宁德市'],
      '江西省': ['南昌市', '景德镇市', '萍乡市', '九江市', '新余市', '鹰潭市', '赣州市', '吉安市', '宜春市', '抚州市', '上饶市'],
      '山东省': ['济南市', '青岛市', '淄博市', '枣庄市', '东营市', '烟台市', '潍坊市', '济宁市', '泰安市', '威海市', '日照市', '莱芜市', '临沂市', '德州市', '聊城市', '滨州市', '菏泽市'],
      '河南省': ['郑州市', '开封市', '洛阳市', '平顶山市', '安阳市', '鹤壁市', '新乡市', '焦作市', '濮阳市', '许昌市', '漯河市', '三门峡市', '南阳市', '商丘市', '信阳市', '周口市', '驻马店市'],
      '湖北省': ['武汉市', '黄石市', '十堰市', '宜昌市', '襄阳市', '鄂州市', '荆门市', '孝感市', '荆州市', '黄冈市', '咸宁市', '随州市'],
      '湖南省': ['长沙市', '株洲市', '湘潭市', '衡阳市', '邵阳市', '岳阳市', '常德市', '张家界市', '益阳市', '郴州市', '永州市', '怀化市', '娄底市'],
      '广东省': ['广州市', '韶关市', '深圳市', '珠海市', '汕头市', '佛山市', '江门市', '湛江市', '茂名市', '肇庆市', '惠州市', '梅州市', '汕尾市', '河源市', '阳江市', '清远市', '东莞市', '中山市', '潮州市', '揭阳市', '云浮市'],
      '广西壮族自治区': ['南宁市', '柳州市', '桂林市', '梧州市', '北海市', '防城港市', '钦州市', '贵港市', '玉林市', '百色市', '贺州市', '河池市', '来宾市', '崇左市'],
      '海南省': ['海口市', '三亚市', '三沙市', '儋州市'],
      '重庆市': ['重庆市'],
      '四川省': ['成都市', '自贡市', '攀枝花市', '泸州市', '德阳市', '绵阳市', '广元市', '遂宁市', '内江市', '乐山市', '南充市', '眉山市', '宜宾市', '广安市', '达州市', '雅安市', '巴中市', '资阳市', '阿坝藏族羌族自治州', '甘孜藏族自治州', '凉山彝族自治州'],
      '贵州省': ['贵阳市', '六盘水市', '遵义市', '安顺市', '毕节市', '铜仁市', '黔西南布依族苗族自治州', '黔东南苗族侗族自治州', '黔南布依族苗族自治州'],
      '云南省': ['昆明市', '曲靖市', '玉溪市', '保山市', '昭通市', '丽江市', '普洱市', '临沧市', '楚雄彝族自治州', '红河哈尼族彝族自治州', '文山壮族苗族自治州', '西双版纳傣族自治州', '大理白族自治州', '德宏傣族景颇族自治州', '怒江傈僳族自治州', '迪庆藏族自治州'],
      '西藏自治区': ['拉萨市', '日喀则市', '昌都市', '林芝市', '山南市', '那曲市', '阿里地区'],
      '陕西省': ['西安市', '铜川市', '宝鸡市', '咸阳市', '渭南市', '延安市', '汉中市', '榆林市', '安康市', '商洛市'],
      '甘肃省': ['兰州市', '嘉峪关市', '金昌市', '白银市', '天水市', '武威市', '张掖市', '平凉市', '酒泉市', '庆阳市', '定西市', '陇南市', '临夏回族自治州', '甘南藏族自治州'],
      '青海省': ['西宁市', '海东市', '海北藏族自治州', '黄南藏族自治州', '海南藏族自治州', '果洛藏族自治州', '玉树藏族自治州', '海西蒙古族藏族自治州'],
      '宁夏回族自治区': ['银川市', '石嘴山市', '吴忠市', '固原市', '中卫市'],
      '新疆维吾尔自治区': ['乌鲁木齐市', '克拉玛依市', '吐鲁番市', '哈密市', '昌吉回族自治州', '博尔塔拉蒙古自治州', '巴音郭楞蒙古自治州', '阿克苏地区', '克孜勒苏柯尔克孜自治州', '喀什地区', '和田地区', '伊犁哈萨克自治州', '塔城地区', '阿勒泰地区']
    },
    
    // 用户创建步骤
    userCreateStep: 1 // 1-昵称，2-出生年份，3-地址
  },

  onLoad(options) {
    console.log('Create-profile页面加载，参数:', options)
    
    // 检查是否是完善信息模式
    const isCompleteMode = options.mode === 'complete'
    console.log('是否完善信息模式:', isCompleteMode)
    
    // 生成出生年份选项（1950-2020）
    const currentYear = new Date().getFullYear();
    const birthYearOptions = [];
    for (let year = currentYear - 18; year >= 1950; year--) {
      birthYearOptions.push(year);
    }
    this.setData({ birthYearOptions });
    
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
    if (this.data.selectedUser && this.data.selectedUser.username) {
      console.log('页面显示，重新加载档案')
      this.loadUserProfiles(this.data.selectedUser.id);
    }
  },

  // 加载当前用户信息用于完善
  async loadCurrentUserForCompletion() {
    try {
      this.setData({ loading: true, error: false })
      
      console.log('开始加载当前用户信息用于完善')
      
      // 获取当前用户信息
      const userInfo = storage.getUserInfo()
      if (!userInfo) {
        this.handleError('未找到用户信息，请重新登录')
        return
      }
      
      console.log('当前用户信息:', userInfo)
      
      // 设置当前用户为选中状态
      this.setData({ 
        selectedUser: userInfo,
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
      
      console.log('用户信息完善模式初始化完成')
      
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
      
      console.log('开始加载用户数据')
      const response = await api.user.getUsers()
      console.log('用户数据接口响应:', response)
      
      if (response.success && response.data) {
        const { wechatUser, subUsers, currentSubUser } = response.data
        
        // 格式化用户数据
        const formattedSubUsers = this.formatSubUsers(subUsers)
        
        this.setData({ 
          wechatUser,
          subUsers: formattedSubUsers,
          currentSubUser
        })
        
        console.log('用户数据加载成功，微信用户:', wechatUser?.nickname, '子用户数量:', formattedSubUsers.length)
        
        // 延迟显示用户选择器，确保页面完全加载
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
    console.log('档案名称:', archiveName, '映射到bodyPart:', bodyPart)
    
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
    if (this.data.selectedUser) {
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
      console.log('开始加载用户档案，用户ID:', userId)
      

      
      // 获取用户信息
      const selectedUser = this.data.selectedUser;
      console.log('当前选中的用户:', selectedUser)
      if (!selectedUser || !selectedUser.id) {
        console.warn('用户信息不完整，无法获取档案')
        console.warn('selectedUser:', selectedUser)
        console.warn('用户ID:', selectedUser?.id)
        this.setData({ selectedUserProfiles: [] });
        return;
      }
      
      // 调用档案列表接口
      const currentUser = storage.getUserInfo()
      console.log('当前用户信息:', currentUser)
      // 应该使用 selectedUser.id 作为 subUserId
      const subUserId = selectedUser.id
      console.log('准备调用档案接口，subUserId:', subUserId)
      const response = await api.profile.getArchives(subUserId)
      console.log('档案列表接口响应:', response)
      console.log('响应状态:', response.success)
      console.log('响应数据:', response.data)
      
      if (response.success && response.data) {
        const archives = response.data.archives || []
        console.log('获取到档案列表:', archives)
        
        // 格式化档案数据
        console.log('原始档案数据:', archives)
        const formattedProfiles = this.formatArchives(archives)
        console.log('格式化后的档案数据:', formattedProfiles)
        
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
    
    console.log('选择的档案索引:', index)
    console.log('选择的档案详情:', profile)
    console.log('档案的photoCount:', profile.photoCount)
    console.log('档案的原始数据:', profile.originalData)
    
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
      console.log('开始为档案加载检测次数')
      
      const subUserId = this.data.selectedUser?.id
      if (!subUserId) {
        console.warn('缺少用户ID，无法获取检测次数')
        return
      }
      
      // 一次性获取所有检测记录，然后按档案名称分组统计
      try {
        const detectionResponse = await api.detection.getList({
          subUserId: selectedUser.id
        })
        
        console.log('检测记录响应:', detectionResponse)
        
        if (detectionResponse.success && detectionResponse.data) {
          const detections = detectionResponse.data.detections || detectionResponse.data || []
          console.log('获取到的检测记录:', detections)
          
          // 按档案名称统计检测次数
          const detectionCounts = {}
          detections.forEach(detection => {
            const archiveName = detection.archiveName
            if (archiveName) {
              detectionCounts[archiveName] = (detectionCounts[archiveName] || 0) + 1
            }
          })
          
          console.log('按档案名称统计的检测次数:', detectionCounts)
          
          // 更新每个档案的检测次数
          profiles.forEach((profile, index) => {
            const count = detectionCounts[profile.name] || 0
            profiles[index].photoCount = count
            console.log(`档案"${profile.name}"的检测次数:`, count)
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
      
      console.log('所有档案的检测次数加载完成:', profiles.map(p => ({ name: p.name, photoCount: p.photoCount })))
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
    
    try {
      // 获取用户信息
      const selectedUser = this.data.selectedUser;
      console.log('创建档案时的用户信息:', selectedUser)
      
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
      const archiveData = {
        subUserId: selectedUser.id,
        archiveName: archiveName,
        bodyPart: this.getBodyPartValueFromArchiveName(archiveName)
      };

      console.log('创建档案数据:', archiveData)
      
      // 调用创建档案接口
      const response = await api.profile.create(archiveData)
      console.log('创建档案接口响应:', response)
      
      if (response.success && response.data) {
        const newArchive = response.data
        
        // 重新加载档案列表
        await this.loadUserProfiles(selectedUser.id)
        
        // 设置新创建的档案为选中状态
        const formattedArchive = this.formatArchives([newArchive])[0]
        this.setData({
          selectedProfile: formattedArchive,
          showDetailPartPopup: false
        });

        wx.showToast({
          title: '档案创建成功',
          icon: 'success'
        });

        // 创建档案后直接跳转到拍照页面
        setTimeout(() => {
          wx.navigateTo({
            url: `/pages/photo-detection/photo-detection?profile=${encodeURIComponent(JSON.stringify(formattedArchive))}`
          });
        }, 1000);
      } else {
        console.warn('创建档案接口返回错误:', response)
        wx.showToast({
          title: response.message || '创建档案失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('创建档案失败:', error)
      wx.showToast({
        title: '创建档案失败，请重试',
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
    this.setData({ 
      'userForm.province': province,
      'userForm.city': '',
      'userForm.district': '',
      cityOptions: this.data.regionData[province] || [],
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
    this.setData({ 
      'userForm.city': city,
      'userForm.district': '',
      districtOptions: this.getDistrictOptions(city),
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

  // 获取区县选项（简化版，实际项目中应该有完整的区县数据）
  getDistrictOptions(city) {
    // 这里简化处理，实际项目中应该有完整的区县数据
    const districtMap = {
      '北京市': ['东城区', '西城区', '朝阳区', '丰台区', '石景山区', '海淀区', '门头沟区', '房山区', '通州区', '顺义区', '昌平区', '大兴区', '怀柔区', '平谷区', '密云区', '延庆区'],
      '上海市': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区', '嘉定区', '浦东新区', '金山区', '松江区', '青浦区', '奉贤区', '崇明区'],
      '广州市': ['荔湾区', '越秀区', '海珠区', '天河区', '白云区', '黄埔区', '番禺区', '花都区', '南沙区', '从化区', '增城区'],
      '深圳市': ['罗湖区', '福田区', '南山区', '宝安区', '龙岗区', '盐田区', '龙华区', '坪山区', '光明区'],
      '杭州市': ['上城区', '下城区', '江干区', '拱墅区', '西湖区', '滨江区', '萧山区', '余杭区', '富阳区', '临安区'],
      '成都市': ['锦江区', '青羊区', '金牛区', '武侯区', '成华区', '龙泉驿区', '青白江区', '新都区', '温江区', '双流区', '郫都区'],
      '武汉市': ['江岸区', '江汉区', '硚口区', '汉阳区', '武昌区', '青山区', '洪山区', '东西湖区', '汉南区', '蔡甸区', '江夏区', '黄陂区', '新洲区'],
      '南京市': ['玄武区', '秦淮区', '建邺区', '鼓楼区', '浦口区', '栖霞区', '雨花台区', '江宁区', '六合区', '溧水区', '高淳区'],
      '西安市': ['新城区', '碑林区', '莲湖区', '灞桥区', '未央区', '雁塔区', '阎良区', '临潼区', '长安区', '高陵区', '鄠邑区'],
      '重庆市': ['渝中区', '大渡口区', '江北区', '沙坪坝区', '九龙坡区', '南岸区', '北碚区', '渝北区', '巴南区', '黔江区', '长寿区', '江津区', '合川区', '永川区', '南川区']
    };
    return districtMap[city] || ['暂无区县数据'];
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
        
        console.log('更新用户信息:', updateData)
        const response = await api.user.updateProfile(updateData)
        console.log('更新用户信息响应:', response)
        
        if (response.success && response.data) {
          // 更新本地存储的用户信息
          const updatedUserInfo = { ...storage.getUserInfo(), ...updateData }
          storage.setUserInfo(updatedUserInfo)
          
          // 关闭弹窗
          this.setData({
            showAddressPopup: false,
            showNicknamePopup: false,
            showBirthYearPopup: false
          })
          
          // 检查是否是完善信息模式
          const pages = getCurrentPages()
          const currentPage = pages[pages.length - 1]
          const isCompleteMode = currentPage.options && currentPage.options.mode === 'complete'
          
          if (isCompleteMode) {
            // 完善信息模式：显示成功提示并返回上一页
            wx.showToast({
              title: '信息完善成功',
              icon: 'success'
            })
            
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          } else {
            // 正常模式：继续原有流程
            this.setData({
              myselfInfo: userInfo,
              selectedUser: { id: 'myself', ...userInfo },
              currentStep: 2
            });
            this.loadUserProfiles('myself');
          }
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
          age: age,
          address: address,
          province: province,
          city: city,
          district: district
        };

        console.log('创建子用户数据:', userData)
        
        // 调用创建子用户接口
        const response = await api.user.createSubUser(userData)
        console.log('创建子用户接口响应:', response)
        
        if (response.success && response.data) {
          const newUser = response.data.user
          
          // 重新加载用户列表以获取最新数据
          await this.loadUsers()
          
          // 设置新创建的用户为选中状态
          this.setData({
            selectedUser: newUser,
            showAddressPopup: false,
            currentStep: 2
          });
          this.loadUserProfiles(newUser.id);
          
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
    console.log('显示用户信息编辑弹窗')
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