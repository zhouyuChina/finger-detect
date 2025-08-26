# Banner接口数据格式说明

## 接口地址
```
GET /api/miniprogram/banners
```

## 请求头
```
Authorization: Bearer ${token}
```

## 响应格式

### 1. 数组格式（推荐）
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "title": "健康检测服务",
      "description": "专业医疗级检测服务",
      "imageUrl": "https://example.com/banner1.jpg",
      "linkUrl": "/pages/about/about",
      "background": "linear-gradient(135deg, #4CAF50, #45a049)",
      "position": "middle",
      "textColor": "#ffffff",
      "sort": 1,
      "status": 1,
      "autoplay": true,
      "interval": 5000,
      "circular": true,
      "indicatorDots": true
    },
    {
      "id": 2,
      "title": "AI智能分析",
      "description": "快速准确的智能诊断",
      "imageUrl": "https://example.com/banner2.jpg",
      "linkUrl": "/pages/detection/detection",
      "background": "linear-gradient(135deg, #2196F3, #1976D2)",
      "position": "left",
      "textColor": "#ffffff",
      "sort": 2,
      "status": 1,
      "autoplay": true,
      "interval": 5000,
      "circular": true,
      "indicatorDots": true
    }
  ]
}
```

### 2. 对象格式（包含配置）
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "健康检测服务",
        "description": "专业医疗级检测服务",
        "imageUrl": "https://example.com/banner1.jpg",
        "linkUrl": "/pages/about/about",
        "background": "linear-gradient(135deg, #4CAF50, #45a049)",
        "position": "middle",
        "textColor": "#ffffff",
        "sort": 1,
        "status": 1
      },
      {
        "id": 2,
        "title": "AI智能分析",
        "description": "快速准确的智能诊断",
        "imageUrl": "https://example.com/banner2.jpg",
        "linkUrl": "/pages/detection/detection",
        "background": "linear-gradient(135deg, #2196F3, #1976D2)",
        "position": "top",
        "textColor": "#ffffff",
        "sort": 2,
        "status": 1
      }
    ],
    "config": {
      "autoplay": true,
      "interval": 4000,
      "circular": true,
      "indicatorDots": true
    }
  }
}
```

## 字段说明

### Banner项目字段
| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 唯一标识 |
| title | string | 是 | 标题 |
| description | string | 否 | 描述 |
| imageUrl | string | 否 | 图片地址 |
| linkUrl | string | 否 | 点击跳转链接 |
| background | string | 否 | 背景色或渐变 |
| position | string | 否 | 文字位置：top/middle/bottom，默认middle |
| textColor | string | 否 | 文字颜色，默认#ffffff |
| sort | number | 否 | 排序，数字越小越靠前 |
| status | number | 否 | 状态：1-启用，0-禁用 |

### 轮播图配置字段
| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| autoplay | boolean | true | 是否自动播放 |
| interval | number | 3000 | 自动切换时间间隔（毫秒） |
| circular | boolean | true | 是否循环播放 |
| indicatorDots | boolean | true | 是否显示指示点 |

## 配置优先级

1. **数组格式**：从第一个元素获取配置
2. **对象格式**：从config字段获取配置
3. **默认配置**：如果都没有，使用默认值

## 示例配置

### 标题样式示例

#### 顶部位置
```json
{
  "position": "top",
  "textColor": "#ffffff"
}
```

#### 底部位置
```json
{
  "position": "bottom", 
  "textColor": "#000000"
}
```

#### 中间深色主题
```json
{
  "position": "middle",
  "textColor": "#2c3e50",
  "background": "linear-gradient(135deg, #ecf0f1, #bdc3c7)"
}
```

### 轮播配置示例

### 快速切换（2秒）
```json
{
  "autoplay": true,
  "interval": 2000,
  "circular": true,
  "indicatorDots": true
}
```

### 慢速切换（8秒）
```json
{
  "autoplay": true,
  "interval": 8000,
  "circular": true,
  "indicatorDots": true
}
```

### 手动切换
```json
{
  "autoplay": false,
  "interval": 3000,
  "circular": true,
  "indicatorDots": true
}
```

### 隐藏指示点
```json
{
  "autoplay": true,
  "interval": 3000,
  "circular": true,
  "indicatorDots": false
}
```

## 注意事项

1. **interval最小值**：建议不小于1000毫秒
2. **interval最大值**：建议不大于10000毫秒
3. **图片格式**：支持jpg、png、webp等格式
4. **链接格式**：
   - 内部页面：`/pages/xxx/xxx`
   - 外部链接：`https://example.com`
5. **状态控制**：status为0的项目不会显示
6. **排序规则**：按sort字段升序排列
7. **文字位置**：
   - `top`: 顶部居中
   - `middle`: 中间居中（默认）
   - `bottom`: 底部居中
8. **颜色格式**：支持十六进制颜色码（如#ffffff）和rgba格式
9. **向下兼容**：如果不提供新字段，会使用默认样式
10. **字段映射**：前端会自动将position映射为对应的垂直位置 