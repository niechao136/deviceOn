//#region 确认任务信息
/**
 * 确认任务信息
 */
function timeStringToCron(timeStr) {
  // 分割日期部分和时间部分
  const [datePart, timePart] = timeStr.split(' ');
  if (!datePart || !timePart) {
    throw new Error('时间字符串格式错误，应为 "YYYY/MM/DD HH:mm:ss"');
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
  switch (res.type) {
    case 'control_task':
      const scheduleType = res.data.schedule.scheduleType
      const control_code = res.data.actionCode
      let parameter = {}
      if (control_code === '90003') {
        if (!!res.data.audioMute) {
          parameter = {
            audioMute: true,
          }
        } else {
          parameter = {
            volume: res.data.value,
          }
        }
      } else if (control_code === '90004') {
        parameter = {
          brightness: res.data.value,
        }
      }
      const targetDevices = Array.isArray(res?.data?.targetDevices) ? Array.from(res.data.targetDevices).map(o => {
        return {
          deviceId: o.id,
          deviceOs: o.os,
          timezone: o.timezone,
        };
      }) : [];
      switch (scheduleType) {
        case 'NONE':
          url = '/walle/ai/onceTask/addCommonImmediateTask'
          request = JSON.stringify({
            actionCode: control_code,
            parameter,
            targetDevices,
          })
          break
        case 'ONLINE':
          url = '/walle/ai/onceTask/addCommonOnlineTask'
          request = JSON.stringify({
            actionCode: control_code,
            parameter,
            targetDevices,
          })
          break
        case 'CRON ONCE':
          url = '/walle/ai/onceTask/addCommonCronTask'
          request = JSON.stringify({
            actionCode: control_code,
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
      const trigger_code = res.data.actionCode
      let trigger_param = {}
      if (trigger_code === '90003') {
        if (!!res.data.audioMute) {
          trigger_param = {
            audioMute: true,
          }
        } else {
          trigger_param = {
            volume: res.data.value,
          }
        }
      } else if (trigger_code === '90004') {
        trigger_param = {
          brightness: res.data.value,
        }
      }
      const trigger_device = Array.isArray(res?.data?.targetDevices) ? Array.from(res.data.targetDevices).map(o => {
        return {
          deviceId: o.id,
          deviceOs: o.os,
          timezone: o.timezone,
        };
      }) : []
      const baseUrl = String(api).endsWith('/api') ? String(api).slice(0, -4) : api
      url = '/walle/ai/triggerTask/addCommonTriggerTask'
      request = JSON.stringify({
        actionCode: trigger_code,
        baseUrl,
        parameter: trigger_param,
        targetDevices: trigger_device,
      })
      break
  }
  return {
    request,
    url,
  }
}

//#endregion
//#region 处理返回信息
/**
 * 处理返回信息
 */
function main({content, body}) {
  const res = JSON.parse(content)
  const result = JSON.parse(body)
  return {
    result: JSON.stringify({
      ...res,
      result,
    }),
    content: '',
    type: '',
  }
}

//#endregion
//#region Test
//#endregion
