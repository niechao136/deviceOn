
//#region 处理工作流
/**
 * 处理工作流
 */
function main({body}) {
  const obj = JSON.parse(body)
  const outputs = obj?.data?.outputs ?? {}
  const is_find_device = Number(outputs?.is_find_device ?? 0)
  return {
    result: outputs?.result ?? '',
    content: outputs?.content ?? '',
    type: outputs?.type ?? '',
    need_answer: is_find_device === 1 ? 0 : 1,
  }
}

//#endregion
//#region 处理其他类问题

function main({type, content, question, timezone, api, token, filter_device}) {
  let request = '', need_answer = 1, bearer = ''
  switch (type) {
    case 'find_device':
    case 'find_error':
      request = JSON.stringify({
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
      bearer = 'Bearer ' + filter_device
      break
  }
  return {
    bearer,
    need_answer,
    request,
  }
}

//#endregion
//#region Test
//#endregion
