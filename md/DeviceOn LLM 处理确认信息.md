# 信息提取提示词

## `问题`: `{{#context#}}`

---

## 处理流程
- 若`问题`包含 `好`、`好的`、`确定`、`OK`、`Go`、`是的`、`可以` 等确认性表述 → `is_confirm = true`
- 若`问题`包含 `上线后执行`、`发布后运行` 等类似描述 → `is_online = true`
- 若`问题`包含 `立即执行` 等类似描述 → `is_none = true`
- 若`问题`包含 `设备时间`、`设备时区` 等类似描述 → `is_device = true`
- 若`问题`包含 `本地时间`、`本地时区` 等类似描述 → `is_local = true`

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
