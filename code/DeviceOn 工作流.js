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
//#region 处理问题分类

// 从大模型返回结果中提取json
function handleLLM(text) {
  const regex = /```json([\s\S]*?)```/
  const _res = text.replaceAll(/<think>[\s\S]*?<\/think>/g, '')
  const match = _res.match(regex);
  const res = !!match ? match[1].trim() : _res
  const str = res.replaceAll(/\/\/.*$/gm, '').replaceAll(/\/\*[\s\S]*?\*\//g, '')
  let obj
  try {
    obj = JSON.parse(str)
  } catch (e) {
    obj = {}
  }
  return obj
}
function main({text, api, token, timezone, query, cache_type, cache_content, other, remote_desktop, device_control, filter_device, ota}) {
  const request = JSON.stringify({
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
  const obj = handleLLM(text)
  const classify = Number(obj?.classify)
  let bearer = ''
  switch (classify) {
    case 1:
      bearer = 'Bearer ' + device_control
      break
    case 2:
      bearer = 'Bearer ' + remote_desktop
      break
    case 3:
      bearer = 'Bearer ' + filter_device
      break
    case 4:
      bearer = 'Bearer ' + ota
      break
    default:
      bearer = 'Bearer ' + other
      break
  }
  return {
    bearer,
    classify,
    request,
  }
}
//#endregion
//#region 处理工作流结果
function main({body, classify}) {
  const obj = JSON.parse(body)
  const outputs = obj?.data?.outputs ?? {}
  return {
    result: outputs?.result ?? '',
    content: outputs?.content ?? '',
    type: outputs?.type ?? '',
    need_answer: Number(outputs?.need_answer ?? [1,2,3,4].includes(classify) ? 0 : 1)
  }
}
//#endregion
//#region Test
//#endregion

