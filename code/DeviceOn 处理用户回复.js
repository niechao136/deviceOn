
//#region 处理用户回复

function main({question, content, type, api, token, timezone}) {
  let request = '', action = ''
  let con = '', ty = '', answer = 0, result = ''
  switch (type) {
    case 'control_task':
      request = JSON.stringify({
        inputs: {
          content,
          timezone,
          api,
          token
        },
        response_mode: 'blocking',
        user: 'deviceOn reply'
      })
      action = 'confirm'
      answer = 1
      break
    case 'find_device':
    case 'find_error':
      const query = String(question)
      if (query.endsWith(' REMOTE_DESKTOP') || query.endsWith(' REBOOT')) {
        const obj = JSON.parse(content)
        const device = Array.isArray(obj?.data?.targetDevices) ? Array.from(obj?.data?.targetDevices) : []
        const filter = device.filter(o => {
          return query.includes(o?.id) || query.includes(o?.name) || query.includes(o?.ip)
        })
        result = JSON.stringify({
          type: 'find_device',
          data: {
            ...obj.data,
            assign_device: true,
            targetDevices: filter,
          }
        })
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
            request = JSON.stringify({
              inputs: {
                content: result,
                timezone,
                api,
                token
              },
              response_mode: 'blocking',
              user: 'deviceOn reply'
            })
            action = 'task'
          }
        }
        if (filter.length > 1) {
          con = result
          ty = 'find_device'
        }
        answer = 1
      } else {
        con = content
        ty = type
      }
      break
    case 'remote_desktop':
      if (type === 'remote_desktop') {
        const obj = JSON.parse(content)
        const query = String(question)
        const device = Array.isArray(obj?.data?.targetDevices) ? Array.from(obj?.data?.targetDevices) : []
        const filter = device.filter(o => {
          return query.includes(o?.id) || query.includes(o?.name) || query.includes(o?.ip)
        })
        result = JSON.stringify({
          type: 'remote_desktop',
          data: {
            ...obj.data,
            targetDevices: filter,
          }
        })
        if (filter.length > 1) {
          con = result
          ty = 'remote_desktop'
        }
        answer = 1
      }
      break
    default:
      break
  }
  return {
    action,
    answer,
    content: con,
    request,
    result,
    type: ty,
  }
}

//#endregion
//#region 处理确认判断

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
//#region Test
//#endregion
