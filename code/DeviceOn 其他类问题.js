//#region 设备筛选 Request
/**
 * 设备筛选 Request
 */
function main({type, content, question, timezone, api, token}) {
  return {
    request: JSON.stringify({
      inputs: {
        content: content,
        type: type,
        question: question,
        timezone,
        api,
        token
      },
      response_mode: 'blocking',
      user: 'deviceOn other'
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
  const is_find_device = Number(outputs?.is_find_device) ?? 0
  return {
    result: outputs?.result ?? '',
    content: outputs?.content ?? '',
    type: outputs?.type ?? '',
    need_answer: is_find_device === 1 ? 0 : 1,
  }
}

//#endregion
//#region 处理回答

function main({}) {
  return {
    need_answer: 1
  }
}


//#endregion
//#region Test
//#endregion
