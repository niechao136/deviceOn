
# 信息提取提示词

## 输入
- query: {{#context#}}

---

## 语言识别

请输出以下字段：
- `lang`: 使用 BCP 47 格式的语言代码（如 `zh-TW`, `zh-CN`, `en` 等）
- `lang_cn`: 使用 OpenCC (t2s) 将 query 转换为简体后的结果
- `lang_reason`: 语言判断说明

**判断规则：**

1. 若 `lang_cn !== query`（即 query 含繁体字），**直接输出 `lang = zh-TW`，不要使用自动语言判断**
2. 否则，执行自动语言识别

---

## 预测与历史判断

### 预测字段：
当 query 同时满足以下**全部条件**时，才判定为预测问题（`predict = true`），并输出预测区间：`predict_start` ~ `predict_end`：
1. **明确出现预测关键词**（如「预测」「预估」等，**不包括「可能」「适合」「建议」等弱意图词**）
2. 预测区间需明确，**且完整预测区间严格晚于 {{#1745891380321.date#}}**；

### 历史字段：
仅在 predict = true 时才进行此项判断：
- 若提及「历史数据」「根据以往数据」等表明参考区间的关键词，则 `history = true`，并输出参考区间：`history_start` ~ `history_end`

输出说明字段：`predict_reason`、`history_reason`

---

## 数据类型识别（字段：`data`）

请判断 query 涉及的数据类型（可多选）：

| 字段名                 | 关键词示例                         |
|---------------------|-------------------------------|
| `traffic`           | 来店人数、访客数、顾客数、Visitor、Traffic  |
| `outside`           | 店外人数、Outside                  |
| `turn_in_rate`      | 进店率、Turn in Rate              |
| `total_amount`      | 营业额、销售额、Sales                 |
| `transaction_count` | 交易数、Transaction               |
| `avg_amount`        | 客单价、Average Transaction Value |
| `convert_rate`      | 转换率、Conversion Rate           |
| `avg_item`          | 客单量、Average Basket Size       |
| `queuing`           | 排队人数、排队时间、Queuing             |

若无匹配 → 输出空数组 `[]`

输出说明：`data_reason`

---

## 聚合维度判断（字段：`is_time`, `is_site`）

请判断 query 是否涉及**时间比较分析**或**地点比较分析**：

- `is_time = true`：
    - 若涉及**多个**「时间点」「时间段」之间的比较、分组或排行
    - 若涉及「趋势」「变化」「波动」「长期平均」等表示时间序列分析的关键词
    - 若涉及「节日」「周末」「平时」「活动」「天气」等明确与「每日表现」相关的关键词

- `is_site = true`：
    - 若涉及**多个**「地点」「门店」「区域」之间的比较、分组或排行
    - 若涉及「哪个地点」「有地点」等表示需按地点分析数据的关键词
    - 若涉及「天气」等表示需要按地点获取数据的关键词

输出说明字段：`is_time_reason`, `is_site_reason`

---

## 时间识别

请参考当前时间`{{#1745891380321.date#}}`并根据 query 中的时间信息，解析以下字段：
- `start` / `end`（格式：YYYY/MM/DD）
  - 若含「去年同期」等表示比较的关键词，**请补全对比所需的全部时间段**
  - 若含「逐年」等表示年比较的关键词并且没有明确的开始日期，则将开始日期定为问题所问日期的10年前
  - 其他情况正常提取时间范围
  - 输出的 `start` / `end` 应**涵盖所有涉及的时间段**
- `unit`（最小时间粒度：`yyyy`, `mm`, `ww`, `dd`, `hh`）
  - 若含「趋势」「变化」「波动」「长期平均」等表示时间序列分析的关键词，**将时间粒度细化一级**
  - 若含「节日」「周末」「平时」「活动」「天气」等明确与「每日表现」相关的关键词，才固定设置`unit = dd`
  - 其他情况正常提取最小时间粒度

输出说明：`time_reason`

---

## 地点识别（`site`、`province`、`city`、`country`）

1. 请严格根据以下字段列表，仅匹配 query 中**明确出现**的地点关键词，禁止任何无依据的联想或推断：
    - `site`：门店名（列表：{{#1745891380321.site_name#}}）
    - `province`：区域一（列表：{{#1745891380321.province#}}）
    - `city`：区域二（列表：{{#1745891380321.city#}}）
    - `country`：国家名（列表：{{#1745891380321.country#}}）
    - 未匹配则返回对应空数组 
    - 当 query 中明确出现门店名时，不允许根据*门店名与其所属区域的内部映射关系，自动补全对应的 `province`、`city`、`country` 字段
    - 除非 query 中明确出现对应的区域一、区域二或国家名称，否则 `province`、`city`、`country` 字段必须返回空数组 `[]`，禁止任何推断或补全。
2. 若 query 中包含「位置」「地址」等与地点地址有关的关键词 -> `need_address = true`
3. 输出说明：`site_reason`，应包含门店名、区域一、区域二、国家名的匹配说明以及地址相关的识别说明

---

## 错误提示翻译（字段：`error`）

请将以下提示语翻译为 query 对应语言（根据 `lang`）：

```json
{
  "site_enter": "请输入预测的地点",
  "site_error": "没有找到匹配的地点，请重新提问",
  "date_enter": "请输入预测的日期(请选择未来7天内的日期)",
  "date_error": "预测的日期应在未来7天之内，请重新提问",
  "data_enter": "请输入预测的数据类型",
  "data_error": "没有找到匹配的数据类型，请重新提问"
}
````

---

## 输出 JSON

```json
{
  "lang": "<语言代码>",
  "lang_reason": "<语言识别说明>",
  "lang_cn": "<转换为简体的文本>",
  "predict": <bool>,
  "predict_start": "<YYYY/MM/DD>",
  "predict_end": "<YYYY/MM/DD>",
  "predict_reason": "<预测识别说明>",
  "history": <bool>,
  "history_start": "<YYYY/MM/DD>",
  "history_end": "<YYYY/MM/DD>",
  "history_reason": "<参考历史识别说明>",
  "data": ["traffic", ...],
  "data_reason": "<数据类型识别说明>",
  "start": "<YYYY/MM/DD>",
  "end": "<YYYY/MM/DD>",
  "unit": "<yyyy | mm | ww | dd | hh>",
  "time_reason": "<时间识别说明>",
  "site": ["<匹配的门店名>", ...],
  "province": ["<匹配的区域一>", ...],
  "city": ["<匹配的区域二>", ...],
  "country": ["<匹配的国家>", ...],
  "need_address": <bool>,
  "site_reason": "<门店名、区域一、区域二、国家识别说明>",
  "is_time": <bool>,
  "is_time_reason": "<识别说明>",
  "is_site": <bool>,
  "is_site_reason": "<识别说明>",
  "error": {
    "site_enter": "<string>",
    "site_error": "<string>",
    "date_enter": "<string>",
    "date_error": "<string>",
    "data_enter": "<string>",
    "data_error": "<string>"
  }
}
```

---
