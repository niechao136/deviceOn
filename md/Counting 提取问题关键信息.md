
# 信息提取提示词

## 输入
- query: {{#context#}}

---

## 1. 语言识别（字段：`lang`）

请输出以下字段：
- `lang`: 使用 BCP 47 格式的语言代码（如 `zh-TW`, `zh-CN`, `en` 等）
- `lang_cn`: 使用 OpenCC (t2s) 将 query 转换为简体后的结果
- `lang_reason`: 语言判断说明

**判断规则：**

1. 若 `lang_cn !== query`（即 query 含繁体字），**直接输出 `lang = zh-TW`，不要使用自动语言判断**
2. 否则，执行自动语言识别

---

## 2. 预测与历史判断

### 预测字段：
请同时满足以下**全部条件**时，才判定为预测问题（`predict = true`），并输出预测区间：`predict_start` ~ `predict_end`：
1. **明确出现预测关键词**（如「预测」「估计」等）
2. 能解析出明确的预测区间；
3. 预测区间**严格晚于 {{#1745891380321.date#}}**；

### 历史字段：
- 若 query 为预测类问题并且提及「历史数据」「根据以往数据」等表明参考区间的关键词，则 `history = true`，并输出参考区间：`history_start` ~ `history_end`

输出说明字段：`predict_reason`、`history_reason`

---

## 3. 数据类型识别（字段：`data`）

请判断 query 涉及的数据类型（可多选）：

| 字段名                 | 关键词示例                         |
|---------------------|-------------------------------|
| `traffic`           | 来店人数、访客数、Visitor、Traffic      |
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

## 4. 时间识别

请参考当前时间`{{#1745891380321.date#}}`并根据 query 中的时间信息，解析以下字段：
- `start` / `end`（格式：YYYY/MM/DD）
- 若 query 提及比较性表达，请补全涉及的两个时间段的完整时间范围
- `unit`（最小时间粒度：`yyyy`, `mm`, `ww`, `dd`, `hh`）
- 若 query 中含有「逐年」「哪个月」等明确的时间粒度关键词时，采用关键词对应的时间粒度
- 若 query 中含有「趋势」「变化」等表示需分析时间变化的关键词且没有明确的时间粒度关键词时，**则将时间粒度向下细化一级**；

输出说明：`time_reason`

---

## 5. 地点识别（`site`、`province`、`city`、`country`）

请根据以下字段列表，**精确匹配** query 中地点关键词：

- `site`：门店名（列表：{{#1745891380321.site_name#}}）
- `province`：区域一（列表：{{#1745891380321.province#}}）
- `city`：区域二（列表：{{#1745891380321.city#}}）
- `country`：国家名（列表：{{#1745891380321.country#}}）

未匹配则返回对应空数组  
输出说明：`site_reason`

---

## 6. 聚合维度判断（字段：`is_time`, `is_site`）

请判断 query 是否涉及**时间比较分析**或**地点比较分析**：

- `is_time = true`：
  - 若涉及**多个**「时间点」「时间段」之间的比较、分组或排行

- `is_site = true`：
  - 若涉及**多个**「地点」「门店」「区域」之间的比较、分组或排行

输出说明字段：`is_time_reason`, `is_site_reason`

---

## 7. 错误提示翻译（字段：`error`）

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

## 8. 输出 JSON

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
