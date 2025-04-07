# 信息提取提示词

## `问题`: `{{#context#}}`

---

## 处理流程

### 任务类型分析
- 如果`问题`文本中出现诸如`触发型`、`触发型任务`等类似描述时则设置 `is_trigger = true`。
- **示例：**
    - 对于文本`请新增一个触发型任务：将在线设备静音`，由于出现了`触发型任务`，因此应设置 `is_trigger = true`。

---

### 设备信息提取

1. **判断是否使用下标指定设备：**
    - 如果`问题`文本中出现诸如 `第一个`、`第二个` 等指代下标的词时，则设置 `assign_index = 相应的数字`。
    - 如果`问题`文本中出现诸如 `最后`、`倒数` 等指代反转的词时，则设置 `assign_last = true`。
    - **示例：**
        - 对于文本`请远程连接倒数第二个设备`，由于出现`第二个`指代下标，因此设置 `assign_index = 2`；由于出现`倒数`表示反转，因此设置 `assign_last = true`。

2. **字段提取（所有字段均返回数组；若无匹配返回空数组）：**

    - **ID字段 (`id`)：**
        - 在`问题`文本中**精确匹配** `{{#1743557124372.id#}}` 内的任一元素，将所有匹配项存入 `id` 字段。

    - **名称字段 (`name`)：**
        - 在`问题`文本中**精确匹配** `{{#1743557124372.name#}}` 内的任一元素，将所有匹配项存入 `name` 字段。

    - **IP字段 (`ip`)：**
        - 在`问题`文本中**精确匹配** `{{#1743557124372.ip#}}` 内的任一元素，将所有匹配项存入 `ip` 字段。

    - **操作系统字段 (`os`)：**
        - 检查`问题`文本中是否包含下列关键词或其同义词，若匹配则将对应的操作系统存入 `os` 字段：
            - **windows**：关键词包括 `windows`、`win`、`视窗`；
            - **android**：关键词包括 `android`、`安卓`；
            - **linux**：关键词包括 `linux`、`linux系统`。
        - **示例：**
            - 对于文本`请将安卓设备静音`，则 `os` 提取为 `["android"]`。
            - 对于文本`请将win设备静音`，则 `os` 提取为 `["windows"]`。

    - **标签1字段 (`label1`)：**
        - 在`问题`文本中**精确匹配** `{{#1743557124372.label1#}}` 内的任一元素，将所有匹配项存入 `label1` 字段。

    - **标签2字段 (`label2`)：**
        - 在`问题`文本中**精确匹配** `{{#1743557124372.label2#}}` 内的任一元素，将所有匹配项存入 `label2` 字段。

3. **条件标记：**

   根据`问题`文本中的描述设置以下标记：
    - **ID标记 (`assign_id`)**:
        - 当`问题`中包含 `设备ID为...`、`ID为...` 等类似描述时 → `assign_id = true`
        - **示例：**
            - 对于文本`请将C4:00:AD:DE:07:76关机`，则 `assign_id = false`
            - 对于文本`请将ID为C4:00:AD:DE:07:76的设备关机`，则 `assign_id = true`
    - **名称标记 (`assign_name`)**:
        - 当`问题`中包含 `设备名称为...`、`名为...` 等类似描述时 → `assign_name = true`
        - **示例：**
            - 对于文本`请将PPC-300关机`，则 `assign_name = false`
            - 对于文本`请将名为PPC-300的设备关机`，则 `assign_name = true`
    - **IP标记 (`assign_ip`)**:
        - 当`问题`中包含 `设备IP为...`、`IP为...` 等类似描述时 → `assign_ip = true`
        - **示例：**
            - 对于文本`请将172.21.73.60关机`，则 `assign_ip = false`
            - 对于文本`请将IP为172.21.73.60的设备关机`，则 `assign_ip = true`
    - **系统标记 (`assign_os`)**:
        - 当`问题`中包含 `OS为...`、`系统为...` 等类似描述时 → `assign_os = true`
        - **示例：**
            - 对于文本`请将安卓设备关机`，则 `assign_os = false`
            - 对于文本`请将系统为安卓的设备关机`，则 `assign_os = true`
    - **标签1标记 (`assign_label1`)**:
        - 当`问题`中包含 `标签1为...`、`标签为...` 等类似描述时 → `assign_label1 = true`
        - **示例：**
            - 对于文本`请将工程设备关机`，则 `assign_label1 = false`
            - 对于文本`请将标签为工程设备的设备关机`，则 `assign_label1 = true`
    - **标签2标记 (`assign_label2`)**:
        - 当`问题`中包含 `标签2为...`、`标签为...` 等类似描述时 → `assign_label2 = true`
        - **示例：**
            - 对于文本`请将Android设备关机`，则 `assign_label2 = false`
            - 对于文本`请将标签为Android的设备关机`，则 `assign_label2 = true`
    - **在线标记 (`assign_online`)**:
        - 当`问题`中包含 `上线后执行` 等类似描述时 → `assign_online = false`
        - 当`问题`中包含 `在线设备`、`在线...` 等类似描述时 → `assign_online = true`
        - **示例：**
            - 对于文本`请将安卓设备关机，设备上线后执行`，则 `assign_online = false`
            - 对于文本`请将在线的安卓设备关机`，则 `assign_online = true`
    - **离线标记 (`assign_offline`)**:
        - 当`问题`中包含 `离线设备`、`离线...`、`断线中...` 等类似描述时 → `assign_offline = true`
        - **示例：**
            - 对于文本`请将安卓设备关机，设备上线后执行`，则 `assign_offline = false`
            - 对于文本`请将离线的安卓设备关机`，则 `assign_offline = true`
    - **异常状态标记：**
        - **assign_error**：
            - 当`问题`中提及 `异常` 但未提及下列具体异常（`硬件异常`、`软件异常`、`电池异常`、`周边设备异常`、`设备安全异常`）时，设置 `assign_error = true`；
            - 当`问题`中包含 `断线中` 等类似描述时 → `assign_error = false`
        - **assign_hardware**：当`问题`中提及 `硬件异常` 时，设置 `assign_hardware = true`；
        - **assign_software**：当`问题`中提及 `软件异常` 时，设置 `assign_software = true`；
        - **assign_battery**：当`问题`中提及 `电池异常` 时，设置 `assign_battery = true`；
        - **assign_peripheral**：当`问题`中提及 `周边外设异常` 时，设置 `assign_peripheral = true`；
        - **assign_security**：当`问题`中提及 `设备安全异常` 时，设置 `assign_security = true`。

---

### 操作分析

1. **根据`问题`内容，确定操作类型：**
    - **重启** → `actionCode: 90001`（匹配`重启`、`重新启动`）；
    - **关机** → `actionCode: 90002`（匹配`关机`、`关闭`）；
    - **音量调节** → `actionCode: 90003`（匹配`音量调节`、`静音`、`关闭声音`，同时提取操作数值，支持百分比或纯数字格式）；
    - **亮度调节** → `actionCode: 90004`（匹配`亮度调节`，同时提取操作数值，支持百分比或纯数字格式）。

2. **静音检测**
    - 若`问题`文本包含`静音`、`关闭声音`，则设置 `audioMute: true`；否则为 `audioMute: false`。

3. **语言设置**
    - 根据`问题`文本语言自动确定 `lang` 值：
        - 简体中文 → `zh-CN`
        - 繁體中文 → `zh-TW`
        - 英文 → `en-US`
        - 日文 → `ja-JP`

---

### 任务执行时间处理

1. **上线后执行**
    - 若`问题`包含 `上线后执行`、`发布后运行` 等类似描述 → `scheduleType = "ONLINE"`

2. **延迟执行**
    - 若`问题`包含 `X分钟后执行`、`指定时间执行` 等类似显式时间描述 →
        - `scheduleType = "CRON ONCE"`
        - `scheduleCron = 计算后的绝对时间（格式：YYYY/MM/DD HH:mm:ss，参考当前时间为：{{#1743557124372.date#}}）`

3. **立即执行/无执行时间描述**
    - 若`问题`包含 `立即执行` 等类似描述或 **未提及执行时间** → `scheduleType = "NONE"`

4. **设备时区关联**
    - 若`问题`包含 `设备时间`、`设备时区` 等类似描述 → `timezoneLocalEnabled = true`

---

### 输出格式
输出 JSON 格式必须符合以下结构：
```json
{
  "actionCode": "<90001 | 90002 | 90003 | 90004，字符串>",
  "assign_index": "<number, 默认为-1>",
  "assign_last": "<boolean>",
  "targetDevices": {
    "id": "<数组>",
    "name": "<数组>",
    "ip": "<数组>",
    "os": "<数组，windows | android | linux>",
    "label1": "<数组>",
    "label2": "<数组>",
    "assign_id": "<boolean>",
    "assign_name": "<boolean>",
    "assign_ip": "<boolean>",
    "assign_os": "<boolean>",
    "assign_label1": "<boolean>",
    "assign_label2": "<boolean>",
    "assign_online": "<boolean>",
    "assign_offline": "<boolean>",
    "assign_error": "<boolean>",
    "assign_hardware": "<boolean>",
    "assign_software": "<boolean>",
    "assign_battery": "<boolean>",
    "assign_peripheral": "<boolean>",
    "assign_security": "<boolean>"
  },
  "schedule": {
    "scheduleType": "<ONLINE | CRON ONCE | NONE>",
    "scheduleCron": "<时间字符串，格式 YYYY/MM/DD HH:mm:ss>",
    "timezoneLocalEnabled": "<boolean>"
  },
  "is_trigger": "<boolean>",
  "audioMute": "<boolean>",
  "value": "<数字>",
  "lang": "<zh-CN | zh-TW | ja-JP | en-US>"
}
```

---
