# 信息提取提示词

## 输入数据
- `{query}`: `{{#context#}}`

---

## 语言确定
请整体分析并识别{query}文本的主要语言确定`lang`值；**请注意区分简体中文与繁體中文，在区分简体中文与繁體中文时，只要文本中存在一个繁体，就将文本识别为繁体**：
- 简体中文 → `zh-CN`
- 繁體中文 → `zh-TW`
- 英文 → `en-US`
- 日文 → `ja-JP`

---

## 处理流程

### 语言自适应
如果`{query}`文本语言为非简体中文，请自动将下文中的简体中文提示逻辑，应用于`lang`语言场景

---

### 任务类型分析
- 如果`{query}`匹配到`触发型`、`触发型任务`等类似描述时则设置 `is_trigger = true`。

- 根据`{query}`内容，确定操作类型：
    - **重启** → `actionCode: 90001`（匹配`重启`、`重新启动`）；
    - **关机** → `actionCode: 90002`（匹配`关机`、`关闭`）；
    - **音量调节** → `actionCode: 90003`（匹配`音量调节`、`静音`、`关闭声音`，同时提取操作数值，支持百分比或纯数字格式）；
    - **亮度调节** → `actionCode: 90004`（匹配`亮度调节`，同时提取操作数值，支持百分比或纯数字格式）。

- 若`{query}`匹配到`静音`、`关闭声音`等类似描述时，则设置 `audioMute = true`

---

### 任务执行时间分析

- **上线后执行**
    - 若`{query}`匹配到 `上线后执行`、`发布后运行` 等类似描述 → `scheduleType = "ONLINE"`

- **延迟执行**
    - 若`{query}`匹配到 `X分钟后执行`、`指定时间执行` 等类似显式时间描述 →
        - `scheduleType = "CRON ONCE"`
        - `scheduleCron = 计算后的绝对时间（格式：YYYY/MM/DD HH:mm:ss，参考当前时间为：{{#1743557124372.date#}}）`

- **立即执行/无执行时间描述**
    - 若`{query}`匹配到 `立即执行` 等类似描述或 **未提及执行时间** → `scheduleType = "NONE"`

- **设备时区关联**
    - 若`{query}`匹配到 `设备时间`、`设备时区` 等类似描述 → `timezoneLocalEnabled = true`

---

### 设备信息提取

- **异常状态分析：**
    - **assign_error**：当`{query}`中匹配到`异常`、`错误`等类似描述时，设置 `assign_error = true`
    - **assign_offline**：当`{query}`中匹配到`上下线异常`、`离线(Offline)`、`断线中(Disconnected)`等类似描述时，设置 `assign_offline = true`
    - **assign_hardware**：当`{query}`中匹配到 `硬件异常` 等类似描述时，设置 `assign_hardware = true`
    - **assign_software**：当`{query}`中匹配到 `软件异常` 等类似描述时，设置 `assign_software = true`
    - **assign_battery**：当`{query}`中匹配到 `电池异常` 等类似描述时，设置 `assign_battery = true`
    - **assign_peripheral**：当`{query}`中匹配到 `周边外设异常` 等类似描述时，设置 `assign_peripheral = true`
    - **assign_security**：当`{query}`中匹配到 `设备安全异常` 等类似描述时，设置 `assign_security = true`

- **异常时间分析：**
    - 如果`{query}`文本中匹配到诸如`当前`、`目前`、`当下`、`现在`等表示当前时间的词时，则设置 `assign_now = true`
    - 如果`{query}`文本中匹配到诸如`最近`、`近日`等表示模糊时间的词时，则设置 `assign_now = false`
    - 如果`{query}`文本中匹配到诸如`近一个月`、`最近一周`、`前5天`等表示具体时间的词时:
        - 请根据当前时间（`{{#1743557124372.date#}}`），计算出开始日期和结束日期，并设置 `start_date = 开始日期（格式：YYYY/MM/DD）; end_date = 结束日期（格式：YYYY/MM/DD）`
        - 设置 `assign_time = true`

- **在线状态分析：**
    - **assign_online**: 当`{query}`中匹配到`在线(Online)`、`线上`等类似描述时，设置 `assign_online = true`

- **字段提取（所有字段均返回数组；若无匹配返回空数组）：**
    - **ID字段 (`id`)：**
        - 在`{query}`文本中**精确匹配** `{{#1743557124372.id#}}` 内的任一元素，将所有匹配项存入 `id` 字段。
    - **名称字段 (`name`)：**
        - 在`{query}`文本中**精确匹配** `{{#1743557124372.name#}}` 内的任一元素，将所有匹配项存入 `name` 字段。
    - **IP字段 (`ip`)：**
        - 在`{query}`文本中**精确匹配** `{{#1743557124372.ip#}}` 内的任一元素，将所有匹配项存入 `ip` 字段。
    - **操作系统字段 (`os`)：**
        - 检查`{query}`文本中是否匹配到下列关键词或其同义词，若匹配则将对应的操作系统存入 `os` 字段：
            - **windows**：关键词包括 `windows`、`win`、`视窗`；
            - **android**：关键词包括 `android`、`安卓`；
            - **linux**：关键词包括 `linux`、`linux系统`。
        - **示例：**
            - 对于文本`请将安卓设备静音`，则 `os` 提取为 `["android"]`；
            - 对于文本`请将win设备静音`，则 `os` 提取为 `["windows"]`。
    - **标签1字段 (`label1`)：**
        - 在`{query}`文本中**精确匹配** `{{#1743557124372.label1#}}` 内的任一元素，将所有匹配项存入 `label1` 字段。
    - **标签2字段 (`label2`)：**
        - 在`{query}`文本中**精确匹配** `{{#1743557124372.label2#}}` 内的任一元素，将所有匹配项存入 `label2` 字段。
    - **地点字段 (`location`)：**
        - 在`{query}`文本中**精确匹配** `{{#1743557124372.location#}}` 内的任一元素，将所有匹配项存入 `location` 字段。

- **根据`{query}`内容，确定条件标记：**
    - **ID标记 (`assign_id`)**: 当`{query}`中匹配到 `设备ID为...`、`ID为...` 等明确指定ID栏位的描述时，设置 `assign_id = true`
    - **名称标记 (`assign_name`)**: 当`{query}`中匹配到 `设备名称为...`、`名为...` 等明确指定名称栏位的描述时，设置 `assign_name = true`
    - **IP标记 (`assign_ip`)**: 当`{query}`中匹配到 `设备IP为...`、`IP为...` 等明确指定IP栏位的描述时，设置`assign_ip = true`
    - **系统标记 (`assign_os`)**: 当`{query}`中匹配到 `OS为...`、`系统为...` 等明确指定系统栏位的描述时，设置 `assign_os = true`
    - **标签1标记 (`assign_label1`)**: 当`{query}`中匹配到 `标签1为...`、`标签为...` 等明确指定标签1栏位的描述时，设置 `assign_label1 = true`
    - **标签2标记 (`assign_label2`)**: 当`{query}`中匹配到 `标签2为...`、`标签为...` 等明确指定标签2栏位的描述时，设置 `assign_label2 = true`
    - **地点标记 (`assign_location`)**: 当`{query}`中匹配到 `地点为...`、`门店为...` 等明确指定地点栏位的描述时，设置 `assign_location = true`

- **下标判断：**
    - 如果`{query}`文本中匹配到诸如 `第一个`、`第二个` 等指代下标的词时，则设置 `assign_index = 相应的数字`。
    - 如果`{query}`文本中匹配到诸如 `最后`、`倒数` 等指代反转的词时，则设置 `assign_last = true`。

---

## 输出格式
输出 JSON 格式必须符合以下结构：
```json
{
  "lang": "<zh-CN | zh-TW | ja-JP | en-US>",
  "lang_reason": "<简要解释语言识别的依据>",
  "is_trigger": "<boolean>",
  "actionCode": "<90001 | 90002 | 90003 | 90004，字符串>",
  "audioMute": "<boolean>",
  "value": "<音量、亮度具体的数值>",
  "schedule": {
    "scheduleType": "<ONLINE | CRON ONCE | NONE>",
    "scheduleCron": "<时间字符串，格式 YYYY/MM/DD HH:mm:ss>",
    "timezoneLocalEnabled": "<boolean>"
  },
  "targetDevices": {
    "assign_error": "<boolean>",
    "assign_offline": "<boolean>",
    "assign_hardware": "<boolean>",
    "assign_software": "<boolean>",
    "assign_battery": "<boolean>",
    "assign_peripheral": "<boolean>",
    "assign_security": "<boolean>",
    "assign_now": "<boolean>",
    "start_date": "<日期字符串，格式 YYYY/MM/DD>",
    "end_date": "<日期字符串，格式 YYYY/MM/DD>",
    "assign_time": "<boolean>",
    "assign_online": "<boolean>",
    "id": "<数组>",
    "name": "<数组>",
    "ip": "<数组>",
    "os": "<数组，windows | android | linux>",
    "label1": "<数组>",
    "label2": "<数组>",
    "location": "<数组>",
    "assign_id": "<boolean>",
    "assign_name": "<boolean>",
    "assign_ip": "<boolean>",
    "assign_os": "<boolean>",
    "assign_label1": "<boolean>",
    "assign_label2": "<boolean>",
    "assign_location": "<boolean>",
    "assign_index": "<number, 默认为-1>",
    "assign_last": "<boolean>"
  }
}
```

---
