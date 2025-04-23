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
function filterDevice(device, llm_result, type, content, api, token, question, flow) {
  // 处理设备
  const device_list = Array.isArray(device) ? Array.from(device) : []
  const device_by_id = {}
  device_list.forEach(o => {
    device_by_id[o.id] = o
  })

  const lang = String(llm_result?.lang ?? '')
  // 设备异常相关变量
  const is_error = !!llm_result?.targetDevices?.assign_error
  const assign_offline = !!llm_result?.targetDevices?.assign_offline
  const assign_hardware = !!llm_result?.targetDevices?.assign_hardware
  const assign_software = !!llm_result?.targetDevices?.assign_software
  const assign_battery = !!llm_result?.targetDevices?.assign_battery
  const assign_peripheral = !!llm_result?.targetDevices?.assign_peripheral
  const assign_security = !!llm_result?.targetDevices?.assign_security
  const assign_now = !!llm_result?.targetDevices?.assign_now
  const assign_error = is_error && !assign_offline && !assign_hardware && !assign_software && !assign_battery && !assign_peripheral && !assign_security
  const has_error = assign_error || assign_offline || assign_hardware || assign_software || assign_battery || assign_peripheral || assign_security

  // 筛选设备
  let filter = [], request = '', is_find_device = 1
  // 如果没有涉及异常或者只涉及当前的异常时，只需要从设备列表进行筛选就可以
  if (!has_error || (has_error && assign_now)) {
    // 设备属性筛选相关变量
    const id = Array.isArray(llm_result?.targetDevices?.id) ? Array.from(llm_result.targetDevices.id) : []
    const name = Array.isArray(llm_result?.targetDevices?.name) ? Array.from(llm_result.targetDevices.name) : []
    const ip = Array.isArray(llm_result?.targetDevices?.ip) ? Array.from(llm_result.targetDevices.ip) : []
    const os = Array.isArray(llm_result?.targetDevices?.os) ? Array.from(llm_result.targetDevices.os).map(s => String(s).toLowerCase()) : []
    const label1 = Array.isArray(llm_result?.targetDevices?.label1) ? Array.from(llm_result.targetDevices.label1) : []
    const label2 = Array.isArray(llm_result?.targetDevices?.label2) ? Array.from(llm_result.targetDevices.label2) : []
    const assign_id = !!llm_result?.targetDevices?.assign_id
    const assign_name = !!llm_result?.targetDevices?.assign_name
    const assign_ip = !!llm_result?.targetDevices?.assign_ip
    const assign_os = !!llm_result?.targetDevices?.assign_os
    const assign_label1 = !!llm_result?.targetDevices?.assign_label1
    const assign_label2 = !!llm_result?.targetDevices?.assign_label2
    const assign_online = !!llm_result?.targetDevices?.assign_online
    const assign_index = Number(llm_result?.targetDevices?.assign_index)
    let not_prop = id.length === 0 && name.length === 0 && ip.length === 0 && os.length === 0 && label1.length === 0 && label2.length === 0
    let has_prop = assign_id || assign_name || assign_ip || assign_os || assign_label1 || assign_label2
    let use_cache = not_prop && !has_prop && !assign_online && !has_error
    if (flow === 'remote_desktop') {
      not_prop = id.length === 0 && name.length === 0 && ip.length === 0
      has_prop = assign_id || assign_name || assign_ip
      use_cache = not_prop && !has_prop && !has_error
    }
    let filter_id = []
    // 处理已存在设备筛选结果的情况
    if (!!content && (type === 'find_device' || type === 'find_error')) {
      const cache = JSON.parse(content)
      let cache_device = Array.isArray(cache?.data?.targetDevices) ? Array.from(cache?.data?.targetDevices) : []
      cache_device = cache_device.filter(o => !!device_by_id[o.id]).map(o => device_by_id[o.id])
      // 处理使用下标指定设备的情况
      const assign_last = !!llm_result?.targetDevices?.assign_last
      if (!Number.isNaN(assign_index) && assign_index > 0 && assign_index <= cache_device.length) {
        let index = assign_index - 1
        if (assign_last) index = cache_device.length - 1 - index
        filter_id = [cache_device[index].id]
      }
      else {
        filter_id = cache_device.filter(o => {
          const match_id = id.includes(o.id)
          const match_name = name.includes(o.nm)
          const match_ip = ip.includes(o.ip)
          const match_os = os.includes(o.os)
          const match_label1 = label1.includes(o.l1)
          const match_label2 = label2.includes(o.l2)
          // 当没有指定具体栏位时，只要满足一个条件就行
          if (!has_prop) {
            if (flow === 'remote_desktop') return match_id || match_name || match_ip
            return match_id || match_name || match_ip || match_os || match_label1 || match_label2
          }
          // 当有指定具体栏位时，需要满足所有指定栏位
          let match = true
          if (assign_id) match = match && match_id
          if (assign_name) match = match && match_name
          if (assign_ip) match = match && match_ip
          if (flow === 'remote_desktop') return match
          if (assign_os) match = match && match_os
          if (assign_label1 && !assign_label2) match = match && match_label1
          if (!assign_label1 && assign_label2) match = match && match_label2
          if (assign_label1 && assign_label2) match = match && (match_label2 || match_label1)
          return match
        }).map(o => o.id)
        if (filter_id.length === 0 && use_cache && flow !== 'find_device') {
          filter_id = cache_device.map(o => o.id)
        }
      }
    }
    // 如果经过之前的筛选后，结果仍然为空，则从所有设备中筛选
    if (filter_id.length === 0) {
      filter_id = Object.values(device_by_id).filter(o => {
        const offline = Number(o.st) === 0
        const hardware = Number(o.hw) > 0
        const software = Number(o.sw) > 0
        const battery = Number(o.bt) > 0
        const peripheral = Number(o.pp) > 0
        const security = Number(o.hw) > 0
        const match_error = offline || hardware || software || battery || peripheral || security
        let match = true

        // 处理异常筛选
        if (assign_error) match = match && match_error
        if (assign_offline) match = match && offline
        if (assign_hardware) match = match && hardware
        if (assign_software) match = match && software
        if (assign_battery) match = match && battery
        if (assign_peripheral) match = match && peripheral
        if (assign_security) match = match && security
        if (!match) return match

        // 处理属性筛选
        const match_id = id.includes(o.id)
        const match_name = name.includes(o.nm)
        const match_ip = ip.includes(o.ip)
        const match_os = os.includes(o.os)
        const match_label1 = label1.includes(o.l1)
        const match_label2 = label2.includes(o.l2)
        const match_online = assign_online && Number(o.st) === 1
        const match_status = match_online || (!assign_online)
        // 当没有匹配任何属性时，只筛选status
        if (not_prop) return match_status
        // 当没有指定具体栏位时，只要满足一个条件就行
        if (!has_prop) {
          if (flow === 'remote_desktop') return match_id || match_name || match_ip
          return (match_id || match_name || match_ip || match_os || match_label1 || match_label2) && match_status
        }
        // 当有指定具体栏位时，需要满足所有指定栏位
        if (assign_id) match = match && match_id
        if (assign_name) match = match && match_name
        if (assign_ip) match = match && match_ip
        if (flow === 'remote_desktop') return match
        match = match && match_status
        if (assign_os) match = match && match_os
        if (assign_label1 && !assign_label2) match = match && match_label1
        if (!assign_label1 && assign_label2) match = match && match_label2
        if (assign_label1 && assign_label2) match = match && (match_label2 || match_label1)
        return match
      }).map(o => o.id)
    }
    filter = filter_id.map(id => {
      const o = device_by_id[id]
      if (String(flow).endsWith('task')) {
        return {
          id: o.id,
          name: o.nm,
          os: o.os,
          timezone: o.tz,
        }
      }
      return {
        id: o.id,
        name: o.nm,
        os: o.os,
        timezone: o.tz,
        ip: o.ip,
        status: o.st,
      }
    })
    is_find_device = assign_index !== -1 || !not_prop || assign_online || has_error ? 1 : 0
  }
  // 如果涉及之前的异常，就需要再结合事件列表进行筛选
  else {
    const assign_time = !!llm_result?.targetDevices?.assign_time
    const start_date = String(llm_result?.targetDevices?.start_date ?? '')
    const end_date = String(llm_result?.targetDevices?.end_date ?? '')
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
    if (assign_offline) range = range.concat('4')
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
      user: `deviceOn ${flow}`
    })
  }
  return {
    filter,
    is_find_device,
    lang,
    request,
  }
}
function main({text, device, type, content, timezone, api, token, question, add_task, filter_error}) {
  // 处理 LLM 结果
  const obj = handleLLM(text)
  const is_trigger = !!obj?.is_trigger
  let request = '', bearer = ''

  const {
    request: event,
    filter,
  } = filterDevice(JSON.parse(device), obj, type, content, api, token, question, 'control_task')
  const result = JSON.stringify({
    type: is_trigger ? 'trigger_task' : 'control_task',
    data: {
      ...obj,
      targetDevices: !!event ? [] : filter,
    },
  })
  const task = filter.length > 0 ? 'control_task' : ''
  if (!!event) {
    request = event
    bearer = 'Bearer ' + filter_error
  }
  if (filter.length === 1) {
    const actionCode = obj?.actionCode
    const find_device = !!content && (type === 'find_device' || type === 'find_error')
    const cache = JSON.parse(content)
    const cache_device = Array.isArray(cache?.data?.targetDevices) ? Array.from(cache?.data?.targetDevices) : []
    if (actionCode === '90001' && !is_trigger && find_device && cache_device.length === 1) {
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
