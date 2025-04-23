# 信息提取提示词

## 输入数据
- `{query}`: `{{#context#}}`

---

## 处理流程
- 若`{query}`匹配到 `好`、`好的`、`确定`、`OK`、`Go`、`是的`、`可以` 等表示确认的描述 → `is_confirm = true`
- 若`{query}`匹配到 `上线后执行`、`发布后运行` 等表示上线后执行的描述 → `is_online = true`
- 若`{query}`匹配到 `立即执行` 等表示立即执行的描述 → `is_none = true`
- 若`{query}`匹配到 `设备时间`、`设备时区` 等表示设备时区的描述 → `is_device = true`
- 若`{query}`匹配到 `本地时间`、`本地时区` 等表示本地时区的描述 → `is_local = true`

---

## 输出格式
输出 JSON 格式必须符合以下结构：
```json
{
  "is_online": "<boolean>",
  "is_none": "<boolean>",
  "is_device": "<boolean>",
  "is_local": "<boolean>",
  "is_confirm": "<boolean>",
  "reason": "<不超过15字的关键词依据>"
}
```

---
