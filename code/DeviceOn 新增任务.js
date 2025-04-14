//#region 确认任务信息
/**
 * 确认任务信息
 */
function timeStringToCron(timeStr) {
  // 分割日期部分和时间部分
  const [datePart, timePart] = timeStr.split(' ');
  if (!datePart || !timePart) {
    const dt = new Date()
    const year = dt.getFullYear()
    return `0 ${dt.getMinutes()} ${dt.getHours()} ${dt.getDate()} ${dt.getMonth() + 1} ? ${year}-${year}`
  }
  // 分割出年、月、日
  const [year, month, day] = datePart.split('/');
  // 分割出时、分、秒
  const [hour, minute, second] = timePart.split(':');

  // 构造 Cron 表达式，Quartz 格式为 "ss mm HH dd MM ? YYYY-YYYY"
  return `${Number(second)} ${Number(minute)} ${Number(hour)} ${Number(day)} ${Number(month)} ? ${year}-${year}`;
}
function main({content, timezone, api}) {
  const res = JSON.parse(content)
  let url = ''
  let request = ''
  let need_token = 0
  const scheduleType = res.data.schedule.scheduleType
  const actionCode = res.data.actionCode
  const targetDevices = Array.isArray(res?.data?.targetDevices) ? Array.from(res.data.targetDevices).map(o => {
    return {
      deviceId: o.id,
      deviceOs: o.os,
      timezone: o.timezone,
    };
  }) : []
  const baseUrl = String(api).endsWith('/api') ? String(api).slice(0, -4) : api
  let parameter = {}
  const tab_name = {
    '90021': 'Install Software',
    '90022': 'Uninstall Software',
    '90071': 'Execute Script',
    '90081': 'Transfer Files',
  }
  switch (actionCode) {
    case '90003':
      parameter = !!res.data.audioMute ? { audioMute: true } : { volume: Number(res.data?.value ?? 0) }
      break
    case '90004':
      parameter = { brightness: Number(res.data?.value ?? 0) }
      break
    case '90021':
    case '90022':
    case '90071':
    case '90081':
      parameter = res.data?.parameter ?? {}
      break
  }
  switch (res.type) {
    case 'control_task':
      switch (scheduleType) {
        case 'NONE':
          url = '/walle/ai/onceTask/addCommonImmediateTask'
          request = JSON.stringify({
            actionCode,
            parameter,
            targetDevices,
          })
          break
        case 'ONLINE':
          url = '/walle/ai/onceTask/addCommonOnlineTask'
          request = JSON.stringify({
            actionCode,
            parameter,
            targetDevices,
          })
          break
        case 'CRON ONCE':
          url = '/walle/ai/onceTask/addCommonCronTask'
          request = JSON.stringify({
            actionCode,
            parameter,
            targetDevices,
            userTimeZone: timezone,
            timezoneLocalEnabled: !!res.data?.schedule?.timezoneLocalEnabled,
            scheduleCron: timeStringToCron(res.data?.schedule?.scheduleCron)
          })
          break
      }
      break
    case 'trigger_task':
      url = '/walle/ai/triggerTask/addCommonTriggerTask'
      request = JSON.stringify({
        actionCode,
        baseUrl,
        parameter,
        targetDevices,
      })
      break
    case 'ota_task':
      const is_trigger = !!res?.data?.is_trigger
      url = is_trigger ? '/walle/triggerTask/add' : '/walle/task/add'
      if (is_trigger) {
        need_token = 1
        request = JSON.stringify({
          actionCode,
          triggerUrlEnabled: true,
          parameter,
          targetDevices,
          taskName: tab_name[actionCode] ?? '',
        })
      }
      else {
        request = JSON.stringify({
          actionCode,
          parameter,
          targetDevices,
          userTimeZone: timezone,
          scheduleType,
          timezoneLocalEnabled: res.data?.schedule?.timezone === 'device',
          scheduleCron: timeStringToCron(res.data?.schedule?.scheduleCron)
        })
      }
      break
  }
  return {
    request,
    url,
    need_token,
  }
}

//#endregion
//#region 处理token

function main({request, body}) {
  let req = request, token = ''
  if (!!body) {
    const obj = JSON.parse(body)
    const data = JSON.parse(request)
    token = obj?.msg ?? ''
    req = JSON.stringify({
      ...data,
      triggerUrlToken: token
    })
  }
  return {
    request: req,
    token,
  }
}

//#endregion
//#region 处理返回信息
/**
 * 处理返回信息
 */
function main({content, body, need_token, api, token}) {
  const res = JSON.parse(content)
  const result = JSON.parse(body)
  let obj = {}
  if (need_token === 1) {
    obj = {
      triggerUrl: `${api}/walle/triggerTask/execByUrl/${token}`
    }
  }
  return {
    result: JSON.stringify({
      ...res,
      result: {
        ...result,
        data: {
          ...(result?.data ?? {}),
          ...obj
        }
      },
    }),
    content: '',
    type: '',
  }
}

//#endregion
//#region Test
//#endregion
