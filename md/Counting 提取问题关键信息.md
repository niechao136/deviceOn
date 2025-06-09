# 信息提取提示词

## 输入数据
- query: `{{#context#}}`

---

## 语言确定
请整体分析并识别{query}文本的主要语言确定`lang`值；
**请注意区分简体中文与繁體中文，在区分简体中文与繁體中文时，只要文本中存在一个繁体，就将文本识别为繁体**。

---

## 预测分析
- 如果{query}涉及到预测的相关描述，设置 `predict = true`
- 如果{query}涉及到预测的具体时间，则根据当前时间（`{{#1745891380321.date#}}`），计算出预测时间的开始日期和结束日期，并设置 `predict_start = 开始日期（格式：YYYY/MM/DD）; predict_end = 结束日期（格式：YYYY/MM/DD）`
- 如果{query}提及到预测的参考条件，设置 `history = true`
- 如果{query}涉及到参考条件的具体时间，则根据当前时间（`{{#1745891380321.date#}}`），计算出参考条件的开始日期和结束日期，并设置 `history_start = 开始日期（格式：YYYY/MM/DD）; history_end = 结束日期（格式：YYYY/MM/DD）`

---

## 数据类型分析
请根据{query}文本内容，确定数据类型数组(`data`)，若无匹配则为空数组
- 如果{query}涉及到来店人数的相关描述，如来店人数、Visitor、Traffic等，则将`traffic`加入`data`
- 如果{query}涉及到店外人数的相关描述，如店外人数、Outside Traffic等，则将`outside`加入`data`
- 如果{query}涉及到进店率的相关描述，如进店率、Turn in Rate等，则将`turn_in_rate`加入`data`
- 如果{query}涉及到营业额的相关描述，如营业额、Sales等，则将`total_amount`加入`data`
- 如果{query}涉及到交易数的相关描述，如交易数、Transaction等，则将`transaction_count`加入`data`
- 如果{query}涉及到客单价的相关描述，如客单价、Average Transaction Value等，则将`avg_amount`加入`data`
- 如果{query}涉及到转化率的相关描述，如转换率、Conversion Rate等，则将`convert_rate`加入`data`
- 如果{query}涉及到客单量的相关描述，如客单量、Average Basket Size等，则将`avg_item`加入`data`
- 如果{query}涉及到排队的相关描述，如排队人数、排队时间、Queuing等，则将`queuing`加入`data`

---

## 时间分析
请根据{query}文本内容，确定问题需求数据的开始日期(`start`)、结束日期(`end`)、时间单位(`unit`)
- 请根据当前时间（`{{#1745891380321.date#}}`），计算出需求数据的开始日期和结束日期，并设置 `start = 开始日期（格式：YYYY/MM/DD）; end = 结束日期（格式：YYYY/MM/DD）`
- 请根据问题需求数据的时间单位，设置`unit`：
    - `年` → `yyyy`
    - `月` → `mm`
    - `周` → `ww`
    - `日` → `dd`
    - `小时` → `hh`

---

## 地点分析
请根据{query}文本内容，确定涉及地点数组(`site`)，若无匹配则为空数组
- 在{query}文本中**精确匹配** `{{#1745891380321.site_name#}}` 内的任一元素，将所有匹配项存入 `site`

---

## 语言翻译
请根据`lang`值，将下列语句翻译到`lang`对应的语言
- 翻译"请输入预测的地点"，将结果存入`site_enter`
- 翻译"没有找到匹配的地点，请重新提问"，将结果存入`site_error`
- 翻译"请输入预测的日期(请选择未来7天内的日期)"，将结果存入`date_enter`
- 翻译"预测的日期应在未来7天之内，请重新提问"，将结果存入`date_error`
- 翻译"请输入预测的数据类型"，将结果存入`data_enter`
- 翻译"没有找到匹配的数据类型，请重新提问"，将结果存入`data_error`

---

## 输出格式
输出 JSON 格式必须符合以下结构：
```json
{
  "lang": "<zh-CN | zh-TW | ko-KR | ja-JP | en-US>",
  "lang_reason": "<简要解释语言识别的依据>",
  "predict": "<boolean>",
  "predict_start": "<日期字符串，格式 YYYY/MM/DD>",
  "predict_end": "<日期字符串，格式 YYYY/MM/DD>",
  "history": "<boolean>",
  "history_start": "<日期字符串，格式 YYYY/MM/DD>",
  "history_end": "<日期字符串，格式 YYYY/MM/DD>",
  "data": "<array，traffic | outside | turn_in_rate | total_amount | transaction_count | avg_amount | convert_rate | avg_item | queuing>",
  "start": "<日期字符串，格式 YYYY/MM/DD>",
  "end": "<日期字符串，格式 YYYY/MM/DD>",
  "unit": "<string，yyyy | mm | ww | dd>",
  "site": "<array>",
  "error": {
    "site_enter": "<string>",
    "site_error": "<string>",
    "date_enter": "<string>",
    "date_error": "<string>",
    "data_enter": "<string>",
    "data_error": "<string>",
  }
}
```

---

# 信息提取提示词

## 输入
- query: `{{#context#}}`

---

## 1. 语言识别
请判断 query 的主语言，设置字段 `lang`（使用 BCP 47 语言代码，如 `zh-CN`, `zh-TW`, `en`, `ja`, `ko`, `fr` 等）:
- 若 query 中存在任一繁體字，则强制设为 `zh-TW`
- 若为简体中文，设为 `zh-CN`
- 其余请使用系统自动识别语言并返回标准代码
- 并说明判断依据 `lang_reason`

---

## 2. 预测与参考历史判断

- 若 query 明确包含预测相关意图（如“预测”、“预估”、“估计”等），设 `predict = true`
    - 并根据当前时间（`{{#1745891380321.date#}}`）提取预测时间段为 `predict_start` ~ `predict_end`
- 若 query 明确提到基于过去、历史数据进行判断或预测（如“根据过去/最近…数据”、“历史数据来预测”等），设 `history = true`
    - 并根据当前时间（`{{#1745891380321.date#}}`）提取历史参考时间范围为 `history_start` ~ `history_end`
- 并说明判断依据 `predict_reason` 和 `history_reason`

---

## 3. 数据类型识别（字段 `data`）

若 query 涉及以下含义，请将对应字段加入 `data` 数组（可多选）：
- `traffic`：来店人数、進店人數、來客數、Visitor、Traffic
- `outside`：店外人數、Outside Traffic
- `turn_in_rate`：進店率、Turn in Rate
- `total_amount`：營業額、Sales
- `transaction_count`：交易數、Transaction
- `avg_amount`：客單價、Average Transaction Value
- `convert_rate`：轉換率、Conversion Rate
- `avg_item`：客單量、Average Basket Size
- `queuing`：排隊、排隊時間、Queuing

若无匹配，则返回空数组 `[]`
并说明判断依据 `data_reason`

---

## 4. 时间分析

若 query 包含具体的时间要求，如“2025年”、“過去三個月”，请根据当前时间（`{{#1745891380321.date#}}`）解析其：
- `start` 和 `end`（格式为 YYYY/MM/DD）
- `unit`（当出现复合情境（如具体某日 + 询问「哪个时段」、「哪个小时」等），以**最小粒度为准**）：
    - 年 → `yyyy`
    - 月 → `mm`
    - 周 → `ww`
    - 日 → `dd`
    - 小时 → `hh`

并说明判断依据 `time_reason`

---

## 5. 地点识别（字段 `site`）

请精确匹配 query 中是否包含以下门店名列表（`{{#1745891380321.site_name#}}`）：
- 若匹配，将所有匹配项加入 `site` 数组
- 若无匹配，返回 `site = []`

---

## 6. 结果属性判断

### is_time
- 若 query 的问题主语是“时间”（例如 “哪一天最多”、“哪个月份最好” 等），则设为 `true`
- 并说明判断依据 `is_time_reason`

### is_site
- 若 query 的问题主语是“地点”或“门店”（例如 “哪个门店人最多”），则设为 `true`
- 并说明判断依据 `is_site_reason`

---

## 7. 语言翻译（用于错误提示）

根据识别的 `lang`，翻译以下内容并返回：

- `site_enter`: 请输入预测的地点
- `site_error`: 没有找到匹配的地点，请重新提问
- `date_enter`: 请输入预测的日期(请选择未来7天内的日期)
- `date_error`: 预测的日期应在未来7天之内，请重新提问
- `data_enter`: 请输入预测的数据类型
- `data_error`: 没有找到匹配的数据类型，请重新提问

---

## 8. 输出 JSON 格式（完整）

```json
{
  "lang": "<语言代码>",
  "lang_reason": "<语言识别说明>",
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
