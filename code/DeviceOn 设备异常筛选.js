//#region 处理设备异常记录

function main({body, device, range}) {
  const res = JSON.parse(body)
  const event = Array.isArray(res?.rows) ? Array.from(res.rows) : []
  device = JSON.parse(device)
  const list = Array.isArray(device) ? Array.from(device) : []
  const by_id = {}
  range = JSON.parse(range)
  const error = Array.isArray(range) ? Array.from(range) : []
  list.forEach(o => {
    let obj = error.length > 0 ? { er_n: 0 } : {
      ud_n: 0,
      hw_n: 0,
      sw_n: 0,
      bt_n: 0,
      pp_n: 0,
      sc_n: 0,
      er_n: 0,
    }
    if (error.includes('1')) obj = { ...obj, hw_n: 0 }
    if (error.includes('2')) obj = { ...obj, sw_n: 0 }
    if (error.includes('3')) obj = { ...obj, pp_n: 0 }
    if (error.includes('4')) obj = { ...obj, ud_n: 0 }
    if (error.includes('6')) obj = { ...obj, bt_n: 0 }
    if (error.includes('7')) obj = { ...obj, sc_n: 0 }
    by_id[o.id] = {
      id: o.id,
      nm: o.nm,
      ...obj,
    }
  })
  event.forEach(o => {
    switch (o?.category) {
      case '1':
        by_id[o.deviceId]['hw_n']++
        by_id[o.deviceId]['er_n']++
        break
      case '2':
        by_id[o.deviceId]['sw_n']++
        by_id[o.deviceId]['er_n']++
        break
      case '3':
        by_id[o.deviceId]['pp_n']++
        by_id[o.deviceId]['er_n']++
        break
      case '4':
        by_id[o.deviceId]['ud_n']++
        by_id[o.deviceId]['er_n']++
        break
      case '6':
        by_id[o.deviceId]['bt_n']++
        by_id[o.deviceId]['er_n']++
        break
      case '7':
        by_id[o.deviceId]['sc_n']++
        by_id[o.deviceId]['er_n']++
        break
    }
  })
  return {
    device: JSON.stringify(Object.values(by_id), null, 2),
    error: by_id,
  }
}

//#endregion
//#region 处理异常筛选

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
function main({text, device, error, lang}) {
  device = JSON.parse(device)
  const list = Array.isArray(device) ? Array.from(device) : []
  const by_id = {}
  list.forEach(o => {
    by_id[o.id] = o
  })
  const obj = handleLLM(text)
  const target = Array.isArray(obj?.device) ? Array.from(obj.device) : []
  const filter = target.filter(o => !!by_id[o?.id]).map(v => {
    const o = by_id[v.id]
    return {
      id: o.id,
      name: o.nm,
      os: o.os,
      timezone: o.tz,
      ip: o.ip,
      status: o.st,
      ...error[v.id]
    }
  })
  const result = JSON.stringify({
    type: 'find_error',
    data: {
      targetDevices: filter,
      lang,
    }
  })
  return {
    result,
    type: filter.length > 0 ? 'find_error' : '',
  }
}

//#endregion
//#region Test
//#endregion
