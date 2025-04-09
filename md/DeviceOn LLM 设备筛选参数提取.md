# 信息提取提示词

## `问题`: `{{#context#}}`

---

## 设备信息提取

1. **判断是否使用下标指定设备：**
    - 如果`问题`文本中出现诸如 `第一个`、`第二个` 等指代下标的词时，则设置 `assign_index = 相应的数字`。
    - 如果`问题`文本中出现诸如 `最后`、`倒数` 等指代反转的词时，则设置 `assign_last = true`。

2. **字段提取（所有字段均返回数组；若无匹配返回空数组）：**

    - **ID字段 (`id`)：**
        - 在`问题`文本中**精确匹配** `{{#1743556351963.id#}}` 内的任一元素，将所有匹配项存入 `id` 字段。

    - **名称字段 (`name`)：**
        - 在`问题`文本中**精确匹配** `{{#1743556351963.name#}}` 内的任一元素，将所有匹配项存入 `name` 字段。

    - **IP字段 (`ip`)：**
        - 在`问题`文本中**精确匹配** `{{#1743556351963.ip#}}` 内的任一元素，将所有匹配项存入 `ip` 字段。

    - **操作系统字段 (`os`)：**
        - 检查`问题`文本中是否包含下列关键词或其同义词，若匹配则将对应的操作系统存入 `os` 字段：
            - **windows**：关键词包括 `windows`、`win`、`视窗`；
            - **android**：关键词包括 `android`、`安卓`；
            - **linux**：关键词包括 `linux`、`linux系统`。
        - **示例：**
            - 对于文本`请将安卓设备静音`，则 `os` 提取为 `["android"]`；
            - 对于文本`请将win设备静音`，则 `os` 提取为 `["windows"]`。

    - **标签1字段 (`label1`)：**
        - 在`问题`文本中**精确匹配** `{{#1743556351963.label1#}}` 内的任一元素，将所有匹配项存入 `label1` 字段。

    - **标签2字段 (`label2`)：**
        - 在`问题`文本中**精确匹配** `{{#1743556351963.label2#}}` 内的任一元素，将所有匹配项存入 `label2` 字段。

3. **条件标记：**

   根据`问题`文本中的描述设置以下标记：

    - **ID标记 (`assign_id`)**:
        - 当`问题`中包含 `设备ID为...` 或 `ID为...` 等描述时，设置 `assign_id = true`；

    - **名称标记 (`assign_name`)**:
        - 当`问题`中包含 `设备名称为...` 或 `名为...` 等描述时，设置 `assign_name = true`；

    - **IP标记 (`assign_ip`)**:
        - 当`问题`中包含 `设备IP为...`、`IP为...` 等类似描述时 → `assign_ip = true`

    - **系统标记 (`assign_os`)**:
        - 当`问题`中包含 `OS为...` 或 `系统为...` 等描述时，设置 `assign_os = true`；

    - **标签1标记 (`assign_label1`)**:
        - 当`问题`中包含 `标签1为...` 或 `标签为...` 等描述时，设置 `assign_label1 = true`；

    - **标签2标记 (`assign_label2`)**:
        - 当`问题`中包含 `标签2为...` 或 `标签为...` 等描述时，设置 `assign_label2 = true`；

    - **在线标记 (`assign_online`)**:
        - 当`问题`中包含 `在线设备` 或 `在线...` 等描述时，设置 `assign_online = true`；
        - 当`问题`中包含 `上线后执行` 等描述时，设置 `assign_online = false`；

    - **离线标记 (`assign_offline`)**:
        - 当`问题`中包含 `离线设备` 或 `离线...` 或 `断线中...` 等描述时，设置 `assign_offline = true`；

---

## 异常信息提取

1. **异常状态标记：**
    - **assign_error**：
        - 当`问题`中包含 `异常` 等类似描述时，设置 `assign_error = true`；
        - 当`问题`中包含 `断线中` 等类似描述时，设置 `assign_error = false`；
    - **assign_up_down**：当`问题`中提及 `上下线异常` 时，设置 `assign_up_down = true`；
    - **assign_hardware**：当`问题`中提及 `硬件异常` 时，设置 `assign_hardware = true`；
    - **assign_software**：当`问题`中提及 `软件异常` 时，设置 `assign_software = true`；
    - **assign_battery**：当`问题`中提及 `电池异常` 时，设置 `assign_battery = true`；
    - **assign_peripheral**：当`问题`中提及 `周边外设异常` 时，设置 `assign_peripheral = true`；
    - **assign_security**：当`问题`中提及 `设备安全异常` 时，设置 `assign_security = true`。

2. **异常时间判断：**
    - 如果`问题`文本中出现诸如`当前`、`目前`、`当下`、`现在`等表示当前时间的词时，则设置 `assign_now = true`。
    - 如果`问题`文本中出现诸如`近一个月`、`最近一周`、`前5天`等表示具体时间的词时，请根据当前时间（`{{#1743556351963.date#}}`），计算出开始日期和结束日期，并设置 `start_date = 开始日期（格式：YYYY/MM/DD）; end_date = 结束日期（格式：YYYY/MM/DD）`。
    - 如果`问题`文本中没有出现任何指明时间的词时，则设置 `assign_time = false`。

---

## 语言设置
根据`问题`文本语言自动确定 `lang` 值：
- 简体中文 → `zh-CN`
- 繁體中文 → `zh-TW`
- 英文 → `en-US`
- 日文 → `ja-JP`

---

## 输出格式
输出 JSON 格式必须符合以下结构：
```json
{
  "device": {
    "assign_index": "<number, 默认为-1>",
    "assign_last": "<boolean>",
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
    "assign_offline": "<boolean>"
  },
  "error": {
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
    "assign_time": "<boolean>"
  },
  "lang": "<zh-CN | zh-TW | ja-JP | en-US>"
}
```

---
