
//#region 处理用户回复

function main({question, content, type, api, token, timezone}) {
  let request = '', action = '', osType = '', target_url = ''
  let cache_content = '', cache_type = '', answer = 0, result = ''
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
          cache_content = result
          cache_type = 'find_device'
        }
        answer = 1
        break
      }
      cache_content = content
      cache_type = type
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
          cache_content = result
          cache_type = 'remote_desktop'
        }
        answer = 1
      }
      break
    case 'ota_task':
      if (type === 'ota_task') {
        answer = 1
        const obj = JSON.parse(content)
        const query = String(question)
        const target = Array.isArray(obj?.data?.target) ? Array.from(obj.data.target) : []
        osType = obj?.data?.osType ?? ''
        const actionCode = String(obj?.data?.actionCode)
        const filter = target.filter(o => {
          return query.includes(o?.name)
        })
        if (!osType) {
          const oses = filter.map(o => o?.os)
          if (oses.length === 1) osType = oses[0]
        }
        const device = Array.isArray(obj?.data?.targetDevices) ? Array.from(obj.data.targetDevices) : []
        let filter_device = device.filter(o => osType === o?.os)
        const fail_device = device.filter(o => osType !== o?.os).map(o => o?.name)
        if (obj?.step === 'select_target') {
          result = JSON.stringify({
            ...obj,
            step: filter.length > 0 ? 'select_target' : 'no_target',
            data: {
              ...obj.data,
              target: filter,
              target_len: filter.length,
              osType,
              fail: [],
            }
          })
          if (filter.length === 0) {
            break
          }
          // 需要重新选择
          if (!osType || (filter.length > 1 && ['90071', '90081'].includes(actionCode))) {
            cache_content = result
            cache_type = type
            break
          }
          result = JSON.stringify({
            ...obj,
            step: filter_device.length > 0 ? 'confirm_device' : 'select_device',
            data: {
              ...obj.data,
              target: filter,
              osType,
              target_len: filter.length,
              fail: fail_device,
              device_len: device.length,
              targetDevices: filter_device
            }
          })
          if (filter_device.length > 0) {
            cache_content = result
            cache_type = type
            break
          }
          action = 'device'
          break
        }
        if (obj?.step === 'confirm_target') {
          result = JSON.stringify({
            ...obj,
            step: filter_device.length > 0 ? 'confirm_device' : 'select_device',
            data: {
              ...obj.data,
              target: filter.length > 0 ? filter : target,
              target_len: filter.length > 0 ? filter.length : target.length,
              fail: fail_device,
              device_len: device.length,
              targetDevices: filter_device,
            }
          })
          if (filter.length > 0) {
            if (filter_device.length > 0) {
              cache_content = result
              cache_type = type
              break
            }
            action = 'device'
            break
          }
          action = 'confirm'
          break
        }
        filter_device = device.filter(o => {
          return query.includes(o?.name) || query.includes(o?.id) || query.includes(o?.os)
        })
        switch (actionCode) {
          case '90021':
          case '90022':
            target_url = '/walle/ai/taskAssist/listSoftware'
            break
          case '90071':
            target_url = '/walle/ai/taskAssist/listScript'
            break
          case '90081':
            target_url = '/walle/ai/taskAssist/listFile'
            break
        }
        if (obj?.step === 'select_device') {
          result = JSON.stringify({
            ...obj,
            step: filter_device.length > 0 ? 'confirm_flow' : 'no_device',
            data: {
              ...obj.data,
              targetDevices: filter_device,
              device_len: filter_device.length,
            }
          })
          if (filter_device.length === 0) {
            break
          }
          action = 'target'
          break
        }
        if (obj?.step === 'confirm_device') {
          result = JSON.stringify({
            ...obj,
            step: 'confirm_flow',
            data: {
              ...obj.data,
              targetDevices: filter_device.length > 0 ? filter_device : device,
              device_len: filter_device.length > 0 ? filter_device.length : device.length,
            }
          })
          if (filter_device.length > 0) {
            action = 'target'
            break
          }
          action = 'confirm'
          break
        }
      }
      break
    default:
      break
  }
  return {
    action,
    answer,
    content: cache_content,
    request,
    result,
    type: cache_type,
    osType,
    target_url,
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
function main({text, type, result}) {
  const obj = handleLLM(text)
  const judgment = !!obj?.['judgment'] && obj?.['judgment'] !== 'false'
  let action = '', answer = 1
  if (!judgment) answer = 0
  if (judgment) {
    switch (type) {
      case 'control_task':
        action = 'task'
        break
      case 'ota_task':
        const obj = JSON.parse(result)
        if (obj?.step === 'select_device') {
          action = 'device'
        }
        if (obj?.step === 'confirm_flow') {
          action = 'target'
        }
        break
    }
  }
  return {
    answer,
    action,
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
//#region 处理设备

function main({body, result}) {
  const res = JSON.parse(body)
  const obj = JSON.parse(result)
  const device = Array.isArray(res?.rows) ? Array.from(res.rows) : []
  const filter = device.map(o => {
    return {
      id: o.deviceId,
      name: o.deviceName,
      os: o.deviceOs,
      timezone: o.timezone,
    }
  })
  const content = JSON.stringify({
    ...obj,
    data: {
      ...obj.data,
      targetDevices: filter,
    }
  })
  return {
    result: content,
    content,
  }
}

//#endregion
//#region 处理软件/脚本/档案

/**
 * 将字节数转换为带单位的字符串，例如 2048 -> "2KB"
 * @param {number} bytes - 文件大小（单位：字节）
 * @return {string} - 格式化后的文件大小字符串
 */
function formatFileSize(bytes) {
  if (bytes < 0) {
    throw new Error("文件大小不能为负数");
  }
  if (bytes === 0) return "0B";

  // 定义单位数组
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  // 计算文件大小对应的单位索引（向下取整），以 1024 为进制
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  // 根据单位计算转换后的大小
  let size = bytes / Math.pow(1024, index);
  // 如果结果是整数就不显示小数，否则保留两位小数
  size = size % 1 === 0 ? size : size.toFixed(2);

  return size + units[index];
}
function main({body, result}) {
  const res = JSON.parse(body)
  const obj = JSON.parse(result)
  const list = Array.isArray(res?.rows) ? Array.from(res.rows) : []
  const tenant = Array.isArray(res?.data?.tenantSoftwareList) ? Array.from(res.data.tenantSoftwareList) : []
  const system = Array.isArray(res?.data?.systemSoftwareList) ? Array.from(res.data.systemSoftwareList) : []
  const list_id = {}, tenant_id = {}, system_id = {}
  list.forEach(o => list_id[o?.frId ?? o?.srId] = o)
  tenant.forEach(o => tenant_id[o?.repoId] = o)
  system.forEach(o => system_id[o?.repoId] = o)
  const actionCode = String(obj?.data?.actionCode)
  const target = Array.isArray(obj?.data?.target) ? Array.from(obj.data.target) : []
  const device = Array.isArray(obj?.data?.targetDevices) ? Array.from(obj.data.targetDevices) : []
  const osType = String(obj?.data?.osType)
  let parameter = {}, flow = 0
  switch (actionCode) {
    case '90021':
      const installSoftwareList = target.map(v => {
        let use = false
        if (!!tenant[v?.id]) use = true
        const o = (tenant[v?.id] ?? system[v?.id]) ?? {}
        const pkg = o?.pkgList?.[0] ?? {}
        if (use) flow += Number(pkg?.fileSize ?? 0)
        return {
          ...pkg
        }
      })
      parameter = {
        osType,
        installSoftwareList,
      }
      break
    case '90022':
      const uninstallSoftwareList = target.map(v => {
        let use = false
        if (!!tenant[v?.id]) use = true
        const o = (tenant[v?.id] ?? system[v?.id]) ?? {}
        const pkg = o?.pkgList?.[0] ?? {}
        if (use) flow += Number(pkg?.fileSize ?? 0)
        return {
          ...pkg
        }
      })
      parameter = {
        osType,
        uninstallSoftwareList,
      }
      break
    case '90071':
      const script = target?.[0]?.scriptPkgList?.[0] ?? {}
      flow += Number(script?.fileSize ?? 0)
      parameter = {
        ...script,
        osType,
      }
      break
    case '90081':
      const fc = target?.[0]
      Array.isArray(fc?.filePkgList) && Array.from(fc.filePkgList).forEach(o => {
        flow += Number(o?.fileSize ?? 0)
      })
      parameter = {
        ...fc,
        osType,
      }
      break
  }
  flow = flow * device.length
  const content = JSON.stringify({
    ...obj,
    data: {
      ...obj.data,
      parameter,
      flow: formatFileSize(flow),
    }
  })
  return {
    result: content,
    content,
  }
}

//#endregion
//#region Test
//#endregion
