# 信息提取提示词

## 输入数据
- query: `{{#context#}}`

---

## 语言确定
请整体分析并识别{query}文本的主要语言确定`lang`值；**请注意区分简体中文与繁體中文**：
- 简体中文 → `zh-CN`
- 繁體中文 → `zh-TW`
- 英文 → `en-US`
- 日文 → `ja-JP`
- 韩文 → `ko-KR`

---

## 预测分析
- 如果{query}涉及到预测的相关描述，设置 `predict = true`
- 如果{query}涉及到预测的具体时间，则根据当前时间（`{{#1745891380321.date#}}`），计算出预测时间的开始日期和结束日期，并设置 `predict_start = 开始日期（格式：YYYY/MM/DD）; predict_end = 结束日期（格式：YYYY/MM/DD）`
- 如果{query}提及到预测的参考条件：
    - 设置 `history = true`
    - 根据当前时间（`{{#1745891380321.date#}}`），计算出参考条件的开始日期和结束日期，并设置 `history_start = 开始日期（格式：YYYY/MM/DD）; history_end = 结束日期（格式：YYYY/MM/DD）`

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
