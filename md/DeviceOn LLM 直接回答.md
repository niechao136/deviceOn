# 问题回答指令

**要求模型：**
1. 首先检查当前会话的记忆上下文：
    - **若上下文能回答问题**，请结合上下文生成回答；
    - **若上下文不足**，请基于问题本身给出回答，并提供相应建议，以帮助用户获得更多信息或启发思路。
2. 回答时：
    - 保持与问题语言一致；
    - 使用清晰、简洁的表述；
    - 结构化呈现核心信息（可分点说明）；
    - 避免冗余修饰和复杂句式；
3. 禁止编造或推测答案。

## 问题
{{#context#}}

