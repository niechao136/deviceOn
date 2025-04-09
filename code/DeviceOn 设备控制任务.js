//#region 处理设备列表

function convertToTimeZone(timezone) {
  // 检查格式是否以 "UTC" 开头
  if (!timezone.startsWith("UTC")) {
    throw new Error("时区格式必须以 'UTC' 开头");
  }
  // 获取符号和小时、分钟部分
  const sign = timezone[3]; // '+' 或 '-'
  if (sign !== '+' && sign !== '-') {
    throw new Error("无效的时区格式");
  }
  const hourStr = timezone.substr(4, 2);
  const minuteStr = timezone.substr(7, 2);
  const offsetHours = parseInt(hourStr, 10);
  const offsetMinutes = parseInt(minuteStr, 10);
  // 计算总偏移分钟数（正值代表比 UTC 晚，负值代表比 UTC 早）
  let totalOffset = offsetHours * 60 + offsetMinutes;
  if (sign === '-') {
    totalOffset = -totalOffset;
  }
  // 当前的 UTC 毫秒数（Date.now() 返回的是自1970年1月1日 UTC 以来的毫秒数）
  const nowMs = Date.now();
  // 目标时区的毫秒数 = 当前 UTC 毫秒数 + 时区偏移分钟数转换为毫秒
  const targetMs = nowMs + totalOffset * 60000;
  const targetDate = new Date(targetMs);
  // 使用 getUTC* 方法来提取目标时区的各部分
  const year = targetDate.getUTCFullYear();
  const month = String(targetDate.getUTCMonth() + 1).padStart(2, '0'); // 月份从 0 开始
  const day = String(targetDate.getUTCDate()).padStart(2, '0');
  const hours = String(targetDate.getUTCHours()).padStart(2, '0');
  const minutes = String(targetDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(targetDate.getUTCSeconds()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}
function main({body, timezone}) {
  const res = JSON.parse(body)
  const device = Array.isArray(res?.rows) ? Array.from(res.rows).map(o => {
    return {
      id: o.deviceId,
      nm: o.deviceName,
      os: o.deviceOs,
      ip: o.deviceIp,
      l1: o.labelDeviceName1,
      l2: o.labelDeviceName2,
      st: o.onlineStatus,
      tz: o.timezone,
      hw: o.hardwareError,
      sw: o.softwareError,
      bt: o.batteryError,
      pp: o.peripheralsError,
      sc: o.securityError,
    }
  }) : []
  const id = Array.from(new Set(device.map(o => o.id).filter(o => !!o)))
  const name = Array.from(new Set(device.map(o => o.nm).filter(o => !!o)))
  const ip = Array.from(new Set(device.map(o => o.ip).filter(o => !!o)))
  const label1 = Array.from(new Set(device.map(o => o.l1).filter(o => !!o)))
  const label2 = Array.from(new Set(device.map(o => o.l2).filter(o => !!o)))
  const date = convertToTimeZone(timezone);
  return {
    device: JSON.stringify(device),
    id: JSON.stringify(id, null, 2),
    name: JSON.stringify(name, null, 2),
    ip: JSON.stringify(ip, null, 2),
    label1: JSON.stringify(label1, null, 2),
    label2: JSON.stringify(label2, null, 2),
    date,
  }
}

//#endregion
//#region 处理设备控制任务
/**
 * 处理设备控制任务
 */
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
function main({text, device, type, content, timezone, api, token, question, add_task, filter_error}) {
  device = JSON.parse(device)
  const list = Array.isArray(device) ? Array.from(device) : []
  const by_id = {}
  list.forEach(o => {
    by_id[o.id] = o
  })
  const obj = handleLLM(text)
  const is_trigger = !!obj?.is_trigger
  const assign_index = Number(obj?.targetDevices?.assign_index)
  const assign_last = !!obj?.targetDevices?.assign_last
  const id = Array.isArray(obj?.targetDevices?.id) ? Array.from(obj.targetDevices.id) : []
  const name = Array.isArray(obj?.targetDevices?.name) ? Array.from(obj.targetDevices.name) : []
  const ip = Array.isArray(obj?.targetDevices?.ip) ? Array.from(obj.targetDevices.ip) : []
  const os = Array.isArray(obj?.targetDevices?.os) ? Array.from(obj.targetDevices.os).map(s => String(s).toLowerCase()) : []
  const label1 = Array.isArray(obj?.targetDevices?.label1) ? Array.from(obj.targetDevices.label1) : []
  const label2 = Array.isArray(obj?.targetDevices?.label2) ? Array.from(obj.targetDevices.label2) : []
  const assign_id = !!obj?.targetDevices?.assign_id
  const assign_name = !!obj?.targetDevices?.assign_name
  const assign_ip = !!obj?.targetDevices?.assign_ip
  const assign_os = !!obj?.targetDevices?.assign_os
  const assign_label1 = !!obj?.targetDevices?.assign_label1
  const assign_label2 = !!obj?.targetDevices?.assign_label2
  const assign_online = !!obj?.targetDevices?.assign_online
  const assign_offline = !!obj?.targetDevices?.assign_offline
  const assign_error = !!obj?.targetDevices?.assign_error
  const assign_up_down = !!obj?.targetDevices?.assign_up_down
  const assign_hardware = !!obj?.targetDevices?.assign_hardware
  const assign_software = !!obj?.targetDevices?.assign_software
  const assign_battery = !!obj?.targetDevices?.assign_battery
  const assign_peripheral = !!obj?.targetDevices?.assign_peripheral
  const assign_security = !!obj?.targetDevices?.assign_security
  const assign_now = !!obj?.targetDevices?.assign_now
  const assign_time = !!obj?.targetDevices?.assign_time
  const start_date = String(obj?.targetDevices?.start_date ?? '')
  const end_date = String(obj?.targetDevices?.end_date ?? '')
  const lang = String(obj?.lang ?? '')
  const has_error = assign_error || assign_up_down || assign_hardware || assign_software || assign_battery || assign_peripheral || assign_security
  const not_prop = id.length === 0 && name.length === 0 && ip.length === 0 && os.length === 0 && label1.length === 0 && label2.length === 0
  const has_prop = assign_id || assign_name || assign_ip || assign_os || assign_label1 || assign_label2
  const actionCode = obj?.actionCode
  const find_device = !!content && (type === 'find_device' || type === 'find_error')
  let result = '', task = '', request = '', bearer = ''
  if (!has_error || (has_error && assign_now)) {
    let filter_id = [], filter_device = list.map(o => o)
    if (find_device) {
      const obj = JSON.parse(content)
      filter_device = Array.isArray(obj?.data?.targetDevices) ? Array.from(obj?.data?.targetDevices).map(o => by_id[o.id]) : []
      if (!Number.isNaN(assign_index) && assign_index > 0 && assign_index <= filter_device.length) {
        let index = assign_index - 1
        if (assign_last) index = filter_device.length - 1 - index
        filter_id = [filter_device[index].id]
      }
      if (filter_id.length === 0 && not_prop && !has_prop && !assign_online && !assign_offline && !has_error) {
        filter_id = filter_device.map(o => o.id)
      }
    }
    if (filter_id.length === 0) {
      filter_id = filter_device.filter(o => {
        const match_id = id.includes(o.id)
        const match_name = name.includes(o.nm)
        const match_ip = ip.includes(o.ip)
        const match_os = os.includes(o.os)
        const match_label1 = label1.includes(o.l1)
        const match_label2 = label2.includes(o.l2)
        const match_online = assign_online && Number(o.st) === 1
        const match_offline = assign_offline && Number(o.st) === 0
        const match_status = match_online || match_offline || (!assign_online && !assign_offline)
        const hardware = Number(o.hw) > 0
        const software = Number(o.sw) > 0
        const battery = Number(o.bt) > 0
        const peripheral = Number(o.pp) > 0
        const security = Number(o.hw) > 0
        const match_error = assign_error && (hardware || software || battery || peripheral || security)
        const match_hardware = assign_hardware && hardware
        const match_software = assign_software && software
        const match_battery = assign_battery && battery
        const match_peripheral = assign_peripheral && peripheral
        const match_security = assign_security && security
        let match = true
        // 当只指定了异常时，只筛选异常相关
        if (not_prop && !assign_online && !assign_offline && has_error && !assign_up_down) {
          if (assign_error) match = match && match_error
          if (assign_hardware) match = match && match_hardware
          if (assign_software) match = match && match_software
          if (assign_battery) match = match && match_battery
          if (assign_peripheral) match = match && match_peripheral
          if (assign_security) match = match && match_security
          return match
        }
        // 当只指定了在线或者离线时，只筛选status
        if (not_prop && (assign_online || assign_offline)) {
          match = match_online || match_offline
        }
        // 当没有指定具体栏位时，只要满足一个条件就行
        else if (!has_prop) {
          match = (match_id || match_name || match_ip || match_os || match_label1 || match_label2) && match_status
        }
        // 当有指定具体栏位时，需要满足所有指定栏位
        else {
          match = match && match_status
          if (assign_id) match = match && match_id
          if (assign_name) match = match && match_name
          if (assign_ip) match = match && match_ip
          if (assign_os) match = match && match_os
          if (assign_label1 && !assign_label2) match = match && match_label1
          if (!assign_label1 && assign_label2) match = match && match_label2
          if (assign_label1 && assign_label2) match = match && (match_label2 || match_label1)
        }
        if (assign_error) match = match && match_error
        if (assign_hardware) match = match && match_hardware
        if (assign_software) match = match && match_software
        if (assign_battery) match = match && match_battery
        if (assign_peripheral) match = match && match_peripheral
        if (assign_security) match = match && match_security
        return match
      }).map(o => o.id)
    }
    const filter = filter_id.map(id => {
      const o = by_id[id]
      return {
        id: o.id,
        name: o.nm,
        os: o.os,
        timezone: o.tz,
      }
    })
    result = JSON.stringify({
      type: is_trigger ? 'trigger_task' : 'control_task',
      data: {
        ...obj,
        targetDevices: filter,
      },
    })
    task = filter.length > 0 ? 'control_task' : ''
    if (actionCode === '90001' && !is_trigger && find_device && filter.length === 1 && filter_device.length === 1) {
      request = JSON.stringify({
        inputs: {
          content: result,
          timezone,
          api,
          token
        },
        response_mode: 'blocking',
        user: 'deviceOn device_control'
      })
      bearer = 'Bearer ' + add_task
    }
  } else {
    let sd = new Date(start_date)
    let ed = new Date(end_date)
    if (!assign_time) {
      ed = new Date()
      ed.setHours(0, 0, 0, 0)
      const day = ed.getDate()
      let month = ed.getMonth() - 3
      let year = ed.getFullYear()
      if (month < 0) {
        month += 12
        year -= 1
      }
      const last = new Date(year, month + 1, 0).getDate()
      const date = Math.min(day, last)
      sd = new Date(year, month, date)
    }
    const start = sd.getTime()
    const end = ed.getTime() + (24 * 60 * 60 * 1000 - 1)
    let range = [], params = ''
    if (assign_up_down) range = range.concat('4')
    if (assign_hardware) range = range.concat('1')
    if (assign_software) range = range.concat('2')
    if (assign_battery) range = range.concat('6')
    if (assign_peripheral) range = range.concat('3')
    if (assign_security) range = range.concat('7')
    params = `?startTime=${start}&endTime=${end}`
    range.forEach(item => {
      params += `&categoryRange=${item}`
    })
    request = JSON.stringify({
      inputs: {
        params,
        range: JSON.stringify(range),
        lang,
        device: JSON.stringify(device),
        question,
        api,
        token
      },
      response_mode: 'blocking',
      user: 'deviceOn device_control'
    })
    bearer = 'Bearer ' + filter_error
    result = JSON.stringify({
      type: is_trigger ? 'trigger_task' : 'control_task',
      data: {
        ...obj,
        targetDevices: [],
      },
    })
  }

  return {
    result,
    content: !!task ? result : '',
    type: task,
    device: obj,
    request,
    bearer,
  }
}

//#endregion
//#region 处理工作流结果
/**
 * 处理工作流结果
 */
function main({body, filter_error, bearer, result}) {
  const obj = JSON.parse(body)
  const outputs = obj?.data?.outputs ?? {}
  if (bearer === `Bearer ${filter_error}`) {
    const res = JSON.parse(outputs?.result ?? '{}')
    const device = Array.isArray(res?.data?.targetDevices) ? Array.from(res.data.targetDevices) : []
    const obj = JSON.parse(result)
    const task = JSON.stringify({
      ...obj,
      data: {
        ...obj.data,
        targetDevices: device,
      }
    })
    return {
      result: task,
      content: device.length > 0 ? task : '',
      type: device.length > 0 ? 'control_task' : '',
    }
  }
  return {
    result: outputs?.result ?? '',
    content: outputs?.content ?? '',
    type: outputs?.type ?? ''
  }
}

//#endregion
//#region Test
//#endregion
