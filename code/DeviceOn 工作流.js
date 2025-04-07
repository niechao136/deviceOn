//#region 用户回复 Request
/**
 * 用户回复 Request
 */
function main({cache_type, cache_content, query, timezone, api, token}) {
  return {
    request: JSON.stringify({
      inputs: {
        content: cache_content,
        type: cache_type,
        question: query,
        timezone,
        api,
        token
      },
      response_mode: 'blocking',
      user: 'deviceOn'
    })
  }
}

//#endregion
//#region 处理用户回复
/**
 * 处理用户回复
 */
function main({body}) {
  const obj = JSON.parse(body)
  const outputs = obj?.data?.outputs ?? {}
  return {
    result: outputs?.result ?? '',
    content: outputs?.content ?? '',
    type: outputs?.type ?? '',
    answer: Number(outputs?.answer) ?? 0
  }
}

//#endregion
//#region 设备控制任务 Request
/**
 * 设备控制任务 Request
 */
function main({cache_type, cache_content, query, timezone, api, token}) {
  return {
    request: JSON.stringify({
      inputs: {
        content: cache_content,
        type: cache_type,
        question: query,
        timezone,
        api,
        token
      },
      response_mode: 'blocking',
      user: 'deviceOn'
    })
  }
}

//#endregion
//#region 处理设备控制任务
/**
 * 处理设备控制任务
 */
function main({body}) {
  const obj = JSON.parse(body)
  const outputs = obj?.data?.outputs ?? {}
  return {
    result: outputs?.result ?? '',
    content: outputs?.content ?? '',
    type: outputs?.type ?? '',
  }
}

//#endregion
//#region 远程桌面 Request
/**
 * 远程桌面 Request
 */
function main({cache_type, cache_content, query, timezone, api, token}) {
  return {
    request: JSON.stringify({
      inputs: {
        content: cache_content,
        type: cache_type,
        question: query,
        timezone,
        api,
        token
      },
      response_mode: 'blocking',
      user: 'deviceOn'
    })
  }
}

//#endregion
//#region 处理远程桌面
/**
 * 处理远程桌面
 */
function main({body}) {
  const obj = JSON.parse(body)
  const outputs = obj?.data?.outputs ?? {}
  return {
    result: outputs?.result ?? '',
    content: outputs?.content ?? '',
    type: outputs?.type ?? '',
  }
}

//#endregion
//#region 设备筛选 Request
/**
 * 设备筛选 Request
 */
function main({cache_type, cache_content, query, timezone, api, token}) {
  return {
    request: JSON.stringify({
      inputs: {
        content: cache_content,
        type: cache_type,
        question: query,
        timezone,
        api,
        token
      },
      response_mode: 'blocking',
      user: 'deviceOn'
    })
  }
}

//#endregion
//#region 处理设备筛选
/**
 * 处理设备筛选
 */
function main({body}) {
  const obj = JSON.parse(body)
  const outputs = obj?.data?.outputs ?? {}
  return {
    result: outputs?.result ?? '',
    content: outputs?.content ?? '',
    type: outputs?.type ?? '',
    is_find_device: Number(outputs?.is_find_device) ?? 0,
  }
}

//#endregion
//#region 其他类问题 Request
/**
 * 其他类问题 Request
 */
function main({cache_type, cache_content, query, timezone, api, token}) {
  return {
    request: JSON.stringify({
      inputs: {
        content: cache_content,
        type: cache_type,
        question: query,
        timezone,
        api,
        token
      },
      response_mode: 'blocking',
      user: 'deviceOn'
    })
  }
}

//#endregion
//#region 处理其他类问题
/**
 * 处理其他类问题
 */
function main({body}) {
  const obj = JSON.parse(body)
  const outputs = obj?.data?.outputs ?? {}
  return {
    result: outputs?.result ?? '',
    content: outputs?.content ?? '',
    type: outputs?.type ?? '',
    need_answer: Number(outputs?.need_answer) ?? 1
  }
}

//#endregion
//#region 处理回答
/**
 * 处理回答
 */
function main({text}) {
  return {
    result: String(text).replaceAll(/<think>[\s\S]*?<\/think>/g, '').replaceAll(/<details[\s\S]*?<\/details>/g, ''),
  }
}

//#endregion
//#region Test
//#endregion

