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
//#region 处理远程桌面
/**
 * 处理远程桌面
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
function main({text, device, content, type}) {
  device = JSON.parse(device)
  const list = Array.isArray(device) ? Array.from(device) : []
  const by_id = {}
  list.forEach(o => {
    by_id[o.id] = o
  })
  const obj = handleLLM(text)
  const assign_index = Number(obj?.assign_index)
  const assign_last = !!obj?.assign_last
  const id = Array.isArray(obj?.targetDevices?.id) ? Array.from(obj.targetDevices.id) : []
  const name = Array.isArray(obj?.targetDevices?.name) ? Array.from(obj.targetDevices.name) : []
  const ip = Array.isArray(obj?.targetDevices?.ip) ? Array.from(obj.targetDevices.ip) : []
  const assign_id = !!obj?.targetDevices?.assign_id
  const assign_name = !!obj?.targetDevices?.assign_name
  const assign_ip = !!obj?.targetDevices?.assign_ip
  let filter_id = [], filter_device = list.map(o => o)
  if (!!content && (type === 'find_device' || type === 'find_error')) {
    const obj = JSON.parse(content)
    filter_device = Array.isArray(obj?.data?.targetDevices) ? Array.from(obj?.data?.targetDevices).map(o => by_id[o.id]) : []
    if (!Number.isNaN(assign_index) && assign_index > 0 && assign_index <= filter_device.length) {
      let index = assign_index - 1
      if (assign_last) index = filter_device.length - 1 - index
      filter_id = [filter_device[index].id]
    }
    if (filter_id.length === 0 && !assign_id && !assign_name && !assign_ip
      && id.length === 0 && name.length === 0 && ip.length === 0) {
      filter_id = filter_device.map(o => o.id)
    }
  }
  if (filter_id.length === 0) {
    filter_id = filter_device.filter(o => {
      const match_id = id.includes(o.id)
      const match_name = name.includes(o.nm)
      const match_ip = ip.includes(o.ip)
      if (!assign_id && !assign_name && !assign_ip) {
        return match_id || match_name || match_ip
      }
      let match = true
      if (assign_id) match = match && match_id
      if (assign_name) match = match && match_name
      if (assign_ip) match = match && match_ip
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
      ip: o.ip,
      status: o.st,
    }
  })
  const result = JSON.stringify({
    type: 'remote_desktop',
    data: {
      ...obj,
      targetDevices: filter,
    },
  })
  const task = filter.length > 1 ? result : ''

  return {
    result,
    content: task,
    type: !!task ? 'remote_desktop' : '',
    device: obj,
  }
}

//#endregion
//#region Test
//#endregion
