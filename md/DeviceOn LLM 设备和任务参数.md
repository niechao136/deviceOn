# 信息提取提示词

## `问题`: `{{#context#}}`

---

## 处理流程

### 任务类型分析

- 根据`问题`内容，确定任务类型：
    - **软件安装** → `actionCode: 90021`（匹配`软件安装`、`软件更新`、`软件升级`）
    - **软件卸载** → `actionCode: 90022`（匹配`软件卸载`、`软件移除`、`软件删除`）
    - **执行脚本** → `actionCode: 90071`（匹配`执行脚本`、`运行脚本`）
    - **传输档案** → `actionCode: 90081`（匹配`传输档案`、`发送档案`）

- 如果`问题`文本中出现诸如`触发型`、`触发型任务`等类似描述时则设置 `is_trigger = true`

---

### 任务执行时间分析

- **上线后执行**
    - 若`问题`包含 `上线后执行`、`发布后运行` 等类似描述 → `scheduleType = "ONLINE"`

- **延迟执行**
    - 若`问题`包含 `X分钟后执行`、`指定时间执行` 等类似显式时间描述 →
        - `scheduleType = "CRON ONCE"`
        - `scheduleCron = 计算后的绝对时间（格式：YYYY/MM/DD HH:mm:ss，参考当前时间为：{{#1744185817604.date#}}）`

- **立即执行**
    - 若`问题`包含 `立即执行` 等类似描述 → `scheduleType = "NONE"`

- **无执行时间相关描述**
    - 若`问题`没有任何执行时间相关描述 → `scheduleType = ""`

- **时区判断**
    - 若`问题`包含 `设备时间`、`设备时区` 等类似描述 → `timezone = "device"`
    - 若`问题`包含 `本地时间`、`本地时区` 等类似描述 → `timezone = "local"`
    - 若`问题`没有以上两种时区相关描述 → `timezone = ""`

---

### 设备信息分析

- **异常状态分析：**
    - **assign_error**：
        - 当`问题`中包含 `异常` 等类似描述时，设置 `assign_error = true`
        - 当`问题`中包含 `断线中` 等类似描述时，设置 `assign_error = false`
    - **assign_up_down**：当`问题`中提及 `上下线异常` 时，设置 `assign_up_down = true`
    - **assign_hardware**：当`问题`中提及 `硬件异常` 时，设置 `assign_hardware = true`
    - **assign_software**：当`问题`中提及 `软件异常` 时，设置 `assign_software = true`
    - **assign_battery**：当`问题`中提及 `电池异常` 时，设置 `assign_battery = true`
    - **assign_peripheral**：当`问题`中提及 `周边外设异常` 时，设置 `assign_peripheral = true`
    - **assign_security**：当`问题`中提及 `设备安全异常` 时，设置 `assign_security = true`

- **异常时间分析：**
    - 如果`问题`文本中出现诸如`当前`、`目前`、`当下`、`现在`等表示当前时间的词时，则设置 `assign_now = true`。
    - 如果`问题`文本中出现诸如`近一个月`、`最近一周`、`前5天`等表示具体时间的词时，请根据当前时间（`{{#1744185817604.date#}}`），计算出开始日期和结束日期，并设置 `start_date = 开始日期（格式：YYYY/MM/DD）; end_date = 结束日期（格式：YYYY/MM/DD）`。
    - 如果`问题`文本中没有出现任何指明时间的词时，则设置 `assign_time = false`。

- **字段提取（所有字段均返回数组；若无匹配返回空数组）：**

    - **ID字段 (`id`)：**
        - 在`问题`文本中**精确匹配** `{{#1744185817604.id#}}` 内的任一元素，将所有匹配项存入 `id` 字段。

    - **名称字段 (`name`)：**
        - 在`问题`文本中**精确匹配** `{{#1744185817604.name#}}` 内的任一元素，将所有匹配项存入 `name` 字段。

    - **IP字段 (`ip`)：**
        - 在`问题`文本中**精确匹配** `{{#1744185817604.ip#}}` 内的任一元素，将所有匹配项存入 `ip` 字段。

    - **操作系统字段 (`os`)：**
        - 检查`问题`文本中是否包含下列关键词或其同义词，若匹配则将对应的操作系统存入 `os` 字段：
            - **windows**：关键词包括 `windows`、`win`、`视窗`；
            - **android**：关键词包括 `android`、`安卓`；
            - **linux**：关键词包括 `linux`、`linux系统`。
        - **示例：**
            - 对于文本`请将安卓设备静音`，则 `os` 提取为 `["android"]`；
            - 对于文本`请将win设备静音`，则 `os` 提取为 `["windows"]`。

    - **标签1字段 (`label1`)：**
        - 在`问题`文本中**精确匹配** `{{#1744185817604.label1#}}` 内的任一元素，将所有匹配项存入 `label1` 字段。

    - **标签2字段 (`label2`)：**
        - 在`问题`文本中**精确匹配** `{{#1744185817604.label2#}}` 内的任一元素，将所有匹配项存入 `label2` 字段。

- **条件标记：**

  根据`问题`文本中的描述设置以下标记：

    - **ID标记 (`assign_id`)**: 当`问题`中包含 `设备ID为...` 或 `ID为...` 等明确指定ID栏位的描述时，设置 `assign_id = true`；
    - **名称标记 (`assign_name`)**: 当`问题`中包含 `设备名称为...` 或 `名为...` 等明确指定名称栏位的描述时，设置 `assign_name = true`；
    - **IP标记 (`assign_ip`)**: 当`问题`中包含 `设备IP为...`、`IP为...` 等明确指定IP栏位的描述时，设置`assign_ip = true`
    - **系统标记 (`assign_os`)**: 当`问题`中包含 `OS为...` 或 `系统为...` 等明确指定系统栏位的描述时，设置 `assign_os = true`；
    - **标签1标记 (`assign_label1`)**: 当`问题`中包含 `标签1为...` 或 `标签为...` 等明确指定标签1栏位的描述时，设置 `assign_label1 = true`；
    - **标签2标记 (`assign_label2`)**: 当`问题`中包含 `标签2为...` 或 `标签为...` 等明确指定标签2栏位的描述时，设置 `assign_label2 = true`；
    - **在线标记 (`assign_online`)**:
        - 当`问题`中包含 `在线设备` 或 `在线...` 等描述时，设置 `assign_online = true`；
        - 当`问题`中包含 `上线后执行` 等描述时，设置 `assign_online = false`；
    - **离线标记 (`assign_offline`)**:
        - 当`问题`中包含 `离线设备` 或 `离线...` 或 `断线中...` 等描述时，设置 `assign_offline = true`；

- **下标判断：**
    - 如果`问题`文本中出现诸如 `第一个`、`第二个` 等指代下标的词时，则设置 `assign_index = 相应的数字`。
    - 如果`问题`文本中出现诸如 `最后`、`倒数` 等指代反转的词时，则设置 `assign_last = true`。

---

### 语言分析
- 根据`问题`文本语言自动确定 `lang` 值：
    - 简体中文 → `zh-CN`
    - 繁體中文 → `zh-TW`
    - 英文 → `en-US`
    - 日文 → `ja-JP`

---

## 输出格式
输出 JSON 格式必须符合以下结构：
```json
{
  "actionCode": "<90021 | 90022 | 90071 | 90081，字符串>",
  "is_trigger": "<boolean>",
  "schedule": {
    "scheduleType": "<'ONLINE' | 'CRON ONCE' | 'NONE' | ''>",
    "scheduleCron": "<时间字符串，格式 YYYY/MM/DD HH:mm:ss>",
    "timezone": "<'device' | 'local' | ''>"
  },
  "targetDevices": {
    "assign_error": "<boolean>",
    "assign_up_down": "<boolean>",
    "assign_hardware": "<boolean>",
    "assign_software": "<boolean>",
    "assign_battery": "<boolean>",
    "assign_peripheral": "<boolean>",
    "assign_security": "<boolean>",
    "assign_now": "<boolean>",
    "start_date": "<日期字符串，格式 YYYY/MM/DD>",
    "end_date": "<日期字符串，格式 YYYY/MM/DD>",
    "assign_time": "<boolean>",
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
    "assign_index": "<number, 默认为-1>",
    "assign_last": "<boolean>"
  },
  "lang": "<zh-CN | zh-TW | ja-JP | en-US>"
}
```

---
