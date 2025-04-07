//#region 处理没有会话变量

function main({}) {
  return {
    answer: 0,
    content: '',
    type: '',
  }
}

//#endregion
//#region 处理新增任务判断

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
function main({text}) {
  const obj = handleLLM(text)
  return {
    answer: !!obj?.['judgment'] && obj?.['judgment'] !== 'false' ? 1 : 0,
    content: '',
    type: '',
  }
}

//#endregion
//#region 新增任务 Request
/**
 * 新增任务 Request
 */
function main({content, timezone, api, token}) {
  return {
    request: JSON.stringify({
      inputs: {
        content,
        timezone,
        api,
        token
      },
      response_mode: 'blocking',
      user: 'deviceOn reply'
    })
  }
}

//#endregion
//#region 处理新增任务
/**
 * 处理新增任务
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
//#region 处理没有点击按钮

function main({}) {
  return {
    answer: 0,
  }
}

//#endregion
//#region 处理点击了按钮

function main({question, content}) {
  const obj = JSON.parse(content)
  const query = String(question)
  const device = Array.isArray(obj?.data?.targetDevices) ? Array.from(obj?.data?.targetDevices) : []
  const filter = device.filter(o => {
    return query.includes(o?.id) || query.includes(o?.name) || query.includes(o?.ip)
  })
  let result = JSON.stringify({
    type: 'find_device',
    data: {
      ...obj.data,
      assign_device: true,
      targetDevices: filter,
    }
  })
  let add_task = 0
  if (filter.length === 1) {
    if (query.endsWith(' REMOTE_DESKTOP')) {
      result = JSON.stringify({
        type: 'remote_desktop',
        data: {
          ...obj.data,
          targetDevices: filter,
        }
      })
    }
    if (query.endsWith(' REBOOT')) {
      result = JSON.stringify({
        type: 'control_task',
        data: {
          ...obj.data,
          targetDevices: filter,
          actionCode: '90001',
          schedule: {
            scheduleType: 'NONE',
          }
        }
      })
      add_task = 1
    }
  }
  return {
    result,
    content: filter.length > 1 ? result : '',
    type: filter.length > 1 ? 'find_device' : '',
    add_task,
    answer: 1
  }
}

//#endregion
//#region 新增任务 Request
/**
 * 新增任务 Request
 */
function main({result, timezone, api, token}) {
  return {
    request: JSON.stringify({
      inputs: {
        content: result,
        timezone,
        api,
        token
      },
      response_mode: 'blocking',
      user: 'deviceOn reply'
    })
  }
}

//#endregion
//#region 处理新增任务
/**
 * 处理新增任务
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
//#region 处理远程桌面

function main({question, content}) {
  const obj = JSON.parse(content)
  const query = String(question)
  const device = Array.isArray(obj?.data?.targetDevices) ? Array.from(obj?.data?.targetDevices) : []
  const filter = device.filter(o => {
    return query.includes(o?.id) || query.includes(o?.name) || query.includes(o?.ip)
  })
  const result = JSON.stringify({
    type: 'remote_desktop',
    data: {
      ...obj.data,
      targetDevices: filter,
    }
  })
  return {
    result,
    content: filter.length > 1 ? result : '',
    type: filter.length > 1 ? 'remote_desktop' : '',
    answer: 1
  }
}

//#endregion
//#region Test
//#endregion
