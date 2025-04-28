//#region 关键字替换

const code = ```
def case_insensitive_replace(text, old, new):
    lower_text = text.lower()  # 转换为小写以进行匹配
    lower_old = old.lower()    # 目标字符串也转换为小写
    result = []
    
    i = 0
    while i < len(text):
        if lower_text[i:i+len(old)] == lower_old:
            result.append(new)  # 替换为新字符串
            i += len(old)  # 跳过已匹配的部分
        else:
            result.append(text[i])  # 保留原字符
            i += 1

    return ''.join(result)

def main(arg1: str) -> dict:
    result = case_insensitive_replace(arg1, "deepseek", "Advantech")
    result1 = case_insensitive_replace(result, "深度求索", "研华科技")
    return {
        "result": result1,
    }

```

//#endregion
//#region 删除思考过程

function main({text}) {
  return {
    text: String(text).replaceAll(/<think>[\s\S]*?<\/think>/g, '')
      .replaceAll(/<details[\s\S]*?<\/details>/g, '')
  }
}

//#endregion
//#region 地点列表request

function main({token, user_id}) {
  return {
    store_list: JSON.stringify({
      user_id,
      token: JSON.parse(token)
    })
  }
}

//#endregion
//#region 处理地点列表

function main({body}) {
  const date = new Date()
  const result = JSON.parse(body)
  const site = result?.['stores']?.map(o => {
    return {
      store_id: o.store_id,
      store_name: o.store_name,
      register_key: o.register_key,
      sensor_ids: o?.sensors?.filter(s => s?.device_type.toLowerCase() === 'v-pos')
        ?.map(s => s?.sensor_id) ?? []
    }
  }) ?? []
  const name = site.map(o => o.store_name)
  return {
    site: JSON.stringify(site),
    site_name: JSON.stringify(name),
    date: `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  }
}

//#endregion
//#region 处理问题关键信息

const DATA = ['traffic', 'outside', 'turn_in_rate', 'total_amount', 'transaction_count', 'avg_amount', 'convert_rate', 'avg_item', 'queuing']
const UNIT = ['yyyy', 'mm', 'ww', 'dd', 'hh']
function fm(num) {
  return `${num > 9 ? '' : '0'}${num}`
}
function format(date, show = true) {
  return `${date.getFullYear()}/${fm(date.getMonth() + 1)}${show ? ('/' + fm(date.getDate())) : ''}`
}
function isSameYear(d1, d2) {
  return d1.getFullYear() === d2.getFullYear()
}
function isSameMonth(d1, d2) {
  return isSameYear(d1, d2) && d1.getMonth() === d2.getMonth()
}
function isSameDay(d1, d2) {
  return isSameMonth(d1, d2) && d1.getDate() === d2.getDate()
}
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 0 is Sunday, so adjust accordingly
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}
function buildWidget(start, end, unit, predict, predict_data) {
  let sd = new Date(start)
  let ed = new Date(end)
  const date = []
  let label = []
  let data_range = ''
  let data_unit = ''
  if (predict && !predict_data) {
    ed = new Date()
    sd = new Date()
    sd.setFullYear(sd.getFullYear() - 1)
  }
  switch (unit) {
    case 'hh':
      const hour = Array(24).fill(0).map((v, k) => `${fm(k)}:00`)
      while (!isSameDay(sd, ed)) {
        date.push(format(sd))
        label = label.concat(hour.map(o => `${format(sd)} ${o}`))
        sd.setDate(sd.getDate() + 1)
      }
      date.push(format(ed))
      label = label.concat(hour.map(o => `${format(ed)} ${o}`))
      data_range = 'dd'
      data_unit = 'hh'
      break
    case 'dd':
      date.push(format(sd))
      while (!isSameDay(sd, ed)) {
        label.push(format(sd))
        sd.setDate(sd.getDate() + 1)
      }
      date.push(format(ed))
      label.push(format(ed))
      data_range = 'any'
      data_unit = 'dd'
      break
    case 'ww':
      const wsd = getStartOfWeek(sd)
      ed.setDate(ed.getDate() + 7)
      const wed = getStartOfWeek(ed)
      date.push(format(wsd))
      date.push(format(wed))
      while (!isSameDay(wsd, wed)) {
        const start = new Date(wsd)
        const monday = format(start)
        start.setDate(start.getDate() + 6)
        label.push(`${monday} - ${format(start)}`)
        wsd.setDate(sd.getDate() + 7)
      }
      data_range = 'any'
      data_unit = 'ww'
      break
    case 'mm':
      sd.setDate(1)
      ed.setDate(1)
      ed.setMonth(ed.getMonth() + 1)
      date.push(format(sd))
      date.push(format(ed))
      while (!isSameDay(sd, ed)) {
        label.push(format(sd, false))
        sd.setMonth(sd.getMonth() + 1)
      }
      data_range = 'any'
      data_unit = 'mm'
      break
    case 'yyyy':
      while (!isSameYear(sd, ed)) {
        date.push(format(sd))
        label.push(sd.getFullYear())
        sd.setFullYear(sd.getFullYear() + 1)
      }
      date.push(format(ed))
      label.push(ed.getFullYear())
      data_range = 'yyyy'
      data_unit = 'yyyy'
      break
  }
  const label_obj = {}
  label.forEach(o => label_obj[o] = 0)
  return {
    widget: {
      data_range,
      data_unit,
      date,
      time_compare: date.length > 1 && data_range !== 'any' ? 'on' : '',
    },
    label: label_obj,
  }
}
function buildPos(start, end, data_unit, predict, predict_data) {
  const unit = data_unit === 'hh' ? 'hh' : (data_unit ?? 'dd')
  const add_days = unit === 'hh' ? 31 : 366
  let sd = new Date(start)
  let ed = new Date(end)
  const periods = []
  if (predict && !predict_data) {
    ed = new Date()
    sd = new Date()
    sd.setFullYear(sd.getFullYear() - 1)
  }
  while (sd < ed) {
    const add = new Date(sd)
    add.setDate(add.getDate() + add_days)
    if (add < ed) {
      periods.push(JSON.stringify([format(sd), format(add)]))
      sd = add
    } else {
      break
    }
  }
  periods.push(JSON.stringify([format(sd), format(ed)]))
  return {
    unit,
    periods
  }
}
function buildQueuing(start, end, predict, predict_data) {
  const add_days = 59
  let sd = new Date(start)
  let ed = new Date(end)
  const periods = []
  if (predict && !predict_data) {
    ed = new Date()
    sd = new Date()
    sd.setFullYear(sd.getFullYear() - 1)
  }
  while (sd < ed) {
    const add = new Date(sd)
    add.setDate(add.getDate() + add_days)
    if (add < ed) {
      periods.push(JSON.stringify([format(sd) + ' 00:00:00', format(add) + ' 23:59:59']))
      sd = add
    } else {
      break
    }
  }
  periods.push(JSON.stringify([format(sd) + ' 00:00:00', format(ed) + ' 23:59:59']))
  return periods
}
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
function main({text, site}) {
  site = JSON.parse(site)
  const obj = handleLLM(text)
  const data = Array.isArray(obj?.data) ? (obj.data?.filter(o => DATA.includes(o)) ?? []) : []
  const predict = !!obj?.['predict']
  const predict_data = !!obj?.['predict_data']
  const predict_start = isValidDate(obj?.['predict_start']) && !!obj?.['predict_start'] ? obj['predict_start'] : format(new Date())
  const predict_end = isValidDate(obj?.['predict_end']) && !!obj?.['predict_end'] ? obj['predict_end'] : format(new Date())
  const site_name = Array.isArray(obj?.site) ? obj.site : []
  const store = site.filter(o => {
    return site_name.length === 0 || site_name.includes(o.store_name)
  })
  const start = isValidDate(obj?.['start']) && !!obj?.['start'] ? obj.start : format(new Date())
  const end = isValidDate(obj?.['end']) && !!obj?.['end'] ? obj.end : format(new Date())
  const unit = UNIT.includes(obj?.['unit']) ? obj.unit : 'dd'
  const widget_unit = predict ? 'dd' : unit
  const { widget, label } = buildWidget(start, end, widget_unit, predict, predict_data)
  const { unit: pos_unit, periods: pos } = buildPos(start, end, predict ? 'dd' : unit, predict, predict_data)
  const queuing = buildQueuing(start, end, predict, predict_data)
  const { widget: weather, label: weather_label } = buildWidget(predict_start, predict_end, 'dd', false, false)
  return {
    data,
    predict: predict ? 1 : 0,
    site: JSON.stringify(store),
    widget,
    widget_unit,
    pos,
    pos_unit,
    queuing,
    weather,
    weather_label,
    label
  }
}

//#endregion
//#region widget数据request

function main({site, token, widget}) {
  site = JSON.parse(site)
  const sources = site.map(o => {
    return { target_id: o.store_id }
  })
  return {
    widget: JSON.stringify({
      data_source: {
        analytic: [
          {
            caption: '',
            method: 'convert_rate',
            preprocess_data: ['pin', 'crosscnt']
          }
        ],
        ...widget,
        date_display: 'specific',
        date_end: '',
        folding_unit: '',
        is_aggregate: false,
        row_type: 'chart',
        tags: [],
        source: [
          {
            caption: '',
            chart_type: ['line'],
            monitor_type: 'ppc_store_entry',
            preprocess_data: ['pin'],
            merge_type: 'none',
            sources
          },
          {
            caption: '',
            chart_type: ['line'],
            monitor_type: 'ppc_store_outside',
            preprocess_data: ['crosscnt'],
            merge_type: 'none',
            sources
          }
        ]
      },
      module_id: 0,
      token: JSON.parse(token)
    })
  }
}

//#endregion
//#region 处理widget数据

function formatWidget(res, site, widget_unit, data) {
  const obj = {}
  site.forEach(o => {
    obj[o.store_id] = {
      name: o.store_name,
      id: o.store_id,
      rk: o.register_key
    }
  })
  function format(arr, type, key, rate = 1) {
    arr?.forEach(o => {
      if (!Array.isArray(obj[o.target_id][type])) {
        obj[o.target_id][type] = []
      }
      const row = o?.[key]?.row?.map(v => v === -99999 ? null : v * rate) ?? []
      let sum = o?.[key]?.sum ?? null
      sum = sum === -99999 ? null : sum * rate
      switch (widget_unit) {
        case 'hh':
          obj[o.target_id][type] = obj[o.target_id][type].concat(row)
          break
        case 'dd':
        case 'ww':
        case 'mm':
          obj[o.target_id][type] = row
          break
        case 'yyyy':
          obj[o.target_id][type] = obj[o.target_id][type].concat([sum])
          break
      }
    })
  }
  if (data.includes('traffic') || data.includes('convert_rate')) {
    format(res?.['retrived']?.[0]?.['data'], 'traffic', 'pin')
  }
  if (data.includes('outside')) {
    format(res?.['retrived']?.[1]?.['data'], 'outside', 'crosscnt')
  }
  if (data.includes('turn_in_rate')) {
    format(res?.['analytic']?.[0]?.['data'], 'turn_in_rate', 'pin', 100)
  }
  return obj
}
function main({site, body, data, widget_unit}) {
  site = JSON.parse(site)
  const res = JSON.parse(body)
  const obj = formatWidget(res, site, widget_unit, data)
  return {
    widget: JSON.stringify(Object.values(obj))
  }
}

//#endregion
//#region 不获取widget

function main({site}) {
  site = JSON.parse(site)
  const widget = site.map(o => {
    return {
      name: o.store_name,
      id: o.store_id,
      rk: o.register_key
    }
  })
  return {
    widget: JSON.stringify(widget)
  }
}

//#endregion
//#region pos数据request

function main({site, token, acc_id, pos_unit, item}) {
  site = JSON.parse(site)
  const rks = site.map(o => o.register_key)
  const sensor_ids = site.reduce((arr, o) => arr.concat(o?.sensor_ids ?? []), [])
  return {
    pos: JSON.stringify({
      account_id: acc_id,
      token: {
        token: JSON.parse(token)
      },
      period: JSON.parse(item),
      rks,
      unit: pos_unit ?? 'dd',
      ...(sensor_ids.length > 0 ? { sensor_ids } : {}),
    })
  }
}

//#endregion
//#region 处理pos数据

function fm(num) {
  return `${num > 9 ? '' : '0'}${num}`
}
function format(date, show = true, hour = false) {
  return `${date.getFullYear()}/${fm(date.getMonth() + 1)}${show ? ('/' + fm(date.getDate())) : ''}${hour ? ' ' + fm(date.getHours()) + ':00' : ''}`
}
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 0 is Sunday, so adjust accordingly
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function getDateOfWeek(date) {
  const start = getStartOfWeek(date)
  const sd = format(start)
  start.setDate(start.getDate() + 6)
  return `${sd} - ${format(start)}`
}
function division(target, data, rate = 1) {
  if (data === -99999 || target === -99999) return null
  if (data === null || target === null) return null
  if (data === 0 || target === 0) return 0
  return Math.round(target * 100 * rate / data) / 100
}
function getDivision(target, data, rate = 1) {
  return data.map((v, k) => {
    return division(target[k], v, rate)
  })
}
function formatPos(label, output, site, data, widget_unit) {
  const obj = {}
  const label_obj = {}
  label.forEach((v, k) => {
    label_obj[v] = k
  })
  site.forEach(o => {
    obj[o.rk] = {
      ...o,
      total_amount: Array(label.length).fill(0),
      transaction_count: Array(label.length).fill(0),
      item_count: Array(label.length).fill(0),
    }
  })
  output.forEach(str => {
    const body = JSON.parse(str)
    Array.isArray(body?.datas) && body.datas.forEach(pos => {
      Array.isArray(pos?.retrived) && pos.retrived.forEach(o => {
        const date_time = new Date(o.date_time)
        let text = ''
        switch (widget_unit) {
          case 'hh':
            text = format(date_time, true, true)
            break
          case 'dd':
            text = format(date_time)
            break
          case 'ww':
            text = getDateOfWeek(date_time)
            break
          case 'mm':
            text = format(date_time, false)
            break
          case 'yyyy':
            text = date_time.getFullYear()
            break
        }
        const index = label_obj[text]
        obj[pos.rk].item_count[index] += parseFloat(o.item_count)
        obj[pos.rk].total_amount[index] += parseFloat(o.total_amount)
        obj[pos.rk].transaction_count[index] += parseFloat(o.transaction_count)
      })
    })
  })
  return Object.values(obj).map(o => {
    const data_obj = {}
    if (data.includes('traffic')) {
      data_obj.traffic = o.traffic
    }
    if (data.includes('outside')) {
      data_obj.outside = o.outside
    }
    if (data.includes('turn_in_rate')) {
      data_obj.turn_in_rate = o.turn_in_rate
    }
    if (data.includes('total_amount')) {
      data_obj.total_amount = o.total_amount
    }
    if (data.includes('transaction_count')) {
      data_obj.transaction_count = o.transaction_count
    }
    if (data.includes('convert_rate')) {
      data_obj.convert_rate = getDivision(o.transaction_count, o.traffic, 100)
    }
    if (data.includes('avg_amount')) {
      data_obj.avg_amount = getDivision(o.total_amount, o.transaction_count)
    }
    if (data.includes('avg_item')) {
      data_obj.avg_item = getDivision(o.item_count, o.transaction_count)
    }
    return {
      name: o.name,
      id: o.id,
      rk: o.rk,
      ...data_obj
    }
  })
}
function main({label, output, site, data, widget_unit}) {
  label = Object.keys(label)
  site = JSON.parse(site)
  const res = formatPos(label, output, site, data, widget_unit)
  return {
    result: JSON.stringify(res)
  }
}

//#endregion
//#region 不获取pos

function main({output}) {
  return {
    output
  }
}

//#endregion
//#region space数据request

function main({site, token}) {
  site = JSON.parse(site)
  const store_ids = site.map(o => o.store_id)
  return {
    space: JSON.stringify({
      store_ids,
      token: JSON.parse(token)
    })
  }
}

//#endregion
//#region monitor数据request

function main({body, token}) {
  const res = JSON.parse(body)
  const map = {}
  res?.store_spaces?.forEach(space => {
    const add = space?.spaces.find(o => o?.id?.startsWith('sp_u_'))
    if (Array.isArray(add?.maps)) {
      const add_map = add?.maps?.find(o => o?.id?.startsWith('mp_u_'))
      if (!!add_map?.id) {
        map[add.store_id] = add_map.id
      }
    }
  })
  const obj_type = 'map'
  const ids = Object.values(map).map(id => {
    return { id, obj_type }
  })
  return {
    monitor: JSON.stringify({
      ids,
      token: JSON.parse(token)
    })
  }
}

//#endregion
//#region 处理monitor数据

function main({body}) {
  const res = JSON.parse(body)
  const obj = {}
  res?.spaces?.forEach(o => {
    Array.isArray(o?.monitors) && o.monitors.forEach(m => {
      obj[m.id] = o.store_id
    })
  })
  return {
    monitor: obj
  }
}

//#endregion
//#region queuing数据request

function main({site, item, token}) {
  site = JSON.parse(site)
  const store_ids = site.map(o => o.store_id)
  return {
    queuing: JSON.stringify({
      token: JSON.parse(token),
      date_range: JSON.parse(item),
      store_ids,
      data_unit: 'hh',
    })
  }
}

//#endregion
//#region 处理queuing数据

function fm(num) {
  return `${num > 9 ? '' : '0'}${num}`
}
function format(timestamp) {
  const d = new Date(timestamp * 1000)
  return `${d.getUTCFullYear()}/${fm(d.getUTCMonth() + 1)}/${fm(d.getUTCDate())} ${fm(d.getUTCHours())}:00`
}
function formatQueuing(output, site, monitor) {
  const obj = {}
  site.forEach(o => {
    obj[o.id] = {
      ...o,
      queuing_unit: {}
    }
  })
  output.forEach(str => {
    const body = JSON.parse(str)
    Array.isArray(body?.retrieved?.monitors) && body.retrieved.monitors.forEach(m => {
      if (m?.type === 'queuing') {
        const store_id = monitor[m.id]
        if (!obj?.[store_id]?.queuing_unit?.[m.id]) obj[store_id].queuing_unit[m.id] = {
          queuing_name: m.name,
          max_queuing: {},
          min_queuing: {},
          avg_queuing: {},
        }
        Array.isArray(m?.datas) && m.datas.forEach(o => {
          const time = format(o.starttime)
          obj[store_id].queuing_unit[m.id].max_queuing[time] = o?.content?.data?.max ?? null
          obj[store_id].queuing_unit[m.id].min_queuing[time] = o?.content?.data?.min ?? null
          obj[store_id].queuing_unit[m.id].avg_queuing[time] = o?.content?.data?.avg ?? null
        })
      }
    })
  })
  return obj
}
function main({output, site, monitor}) {
  site = JSON.parse(site)
  const res = formatQueuing(output, site, monitor)
  return {
    result: JSON.stringify(Object.values(res))
  }
}

//#endregion
//#region 不获取queuing

function main({output}) {
  return {
    output
  }
}

//#endregion
//#region 天气数据request

function main({site, token, widget, weather}) {
  site = JSON.parse(site)
  const sources = site.map(o => {
    return { target_id: o.store_id }
  })
  const base = {
    analytic: [],
    date_display: 'specific',
    date_end: '',
    folding_unit: '',
    is_aggregate: false,
    row_type: 'chart',
    tags: [],
    source: [
      {
        caption: '',
        chart_type: ['line'],
        preprocess_type: 'weather',
        preprocess_data: ['conditions'],
        merge_type: 'none',
        sources
      }
    ]
  }
  return {
    widget: JSON.stringify({
      data_source: {
        ...base,
        ...widget,
      },
      module_id: 0,
      token: JSON.parse(token)
    }),
    weather: JSON.stringify({
      data_source: {
        ...base,
        ...weather,
      },
      module_id: 0,
      token: JSON.parse(token)
    }),
  }
}

//#endregion
//#region 处理预测问题数据

function getWeekday(dateInput) {
  // 将输入转换为 Date 对象
  const date = new Date(dateInput);
  // 定义星期数组，注意 JavaScript 中的 getDay() 返回 0-6，其中 0 表示星期日
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[date.getDay()];
}
function getWeather(code) {
  switch (parseInt(code)) {
    case 1:
    case 10:
    case 11:
      return '晴'
    case 12:
    case 13:
      return '多云'
    case 2:
    case 20:
      return '阴'
    case 3:
    case 30:
      return '雨'
    case 31:
      return '雷雨'
    case 4:
    case 40:
      return '雪'
    case 5:
      return '极端'
    case 50:
      return '雾'
    case 60:
      return '沙暴'
    case 70:
      return '霾'
    case 80:
      return '热'
    case 81:
      return '冷'
    default:
      return '未知'
  }
}
function arrayToMarkdownTable(data) {
  if (!data || data.length === 0) return '';

  let markdown = '';

  // 如果数组中的元素是对象，则取对象的键作为表头
  if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
    const headers = Object.keys(data[0]);
    // 构造表头行
    markdown += `| ${headers.join(' | ')} |\n`;
    // 构造分隔符行
    markdown += `| ${headers.map(() => '---').join(' | ')} |\n`;
    // 构造数据行
    data.forEach(item => {
      const row = headers.map(header => item[header] !== undefined ? item[header] : '').join(' | ');
      markdown += `| ${row} |\n`;
    });
  } else if (Array.isArray(data[0])) {
    // 如果数组中的元素也是数组，则默认第一行为表头
    markdown += `| ${data[0].join(' | ')} |\n`;
    markdown += `| ${data[0].map(() => '---').join(' | ')} |\n`;
    for (let i = 1; i < data.length; i++) {
      markdown += `| ${data[i].join(' | ')} |\n`;
    }
  } else {
    // 其他情况：将每个元素作为一行（单列表格）
    markdown += '| Value |\n';
    markdown += '| --- |\n';
    data.forEach(item => {
      markdown += `| ${item} |\n`;
    });
  }

  return markdown;
}
function main({output, label, weather_label, widget, weather}) {
  output = JSON.parse(output)
  label = Object.keys(label)
  weather_label = Object.keys(weather_label)
  const weather1 = JSON.parse(widget)
  const weather2 = JSON.parse(weather)
  const i18n = {
    traffic: '来店人数',
    outside: '店外人数',
    turn_in_rate: '进店率',
    total_amount: '营业额',
    transaction_count: '交易数',
    avg_amount: '客单价',
    convert_rate: '转化率',
    avg_item: '客单量',
  }
  const mark = []
  const head = ['地点名称', '日期', '星期', '天气']
  output.forEach((o, index) => {
    const wea1 = weather1?.['retrived']?.[0]?.['data']?.find(i => i.store_id === o.id) ?? {}
    const wea2 = weather2?.['retrived']?.[0]?.['data']?.find(i => i.store_id === o.id) ?? {}
    const keys = Object.keys(o).filter(k => !!i18n[k])
    label.forEach((time, i) => {
      const weekday = getWeekday(time)
      const weather = getWeather(wea1?.conditions?.row?.[i])
      const data = []
      keys.forEach(key => {
        if (index === 0 && i === 0) head.push(i18n[key])
        data.push(o[key][i])
      })
      mark.push([i === 0 ? o.name : '', time, weekday, weather].concat(data))
    })
    weather_label.forEach((time, i) => {
      const weekday = getWeekday(time)
      const weather = getWeather(wea2?.conditions?.row?.[i])
      const data = Array(head.length - 4).fill(null)
      mark.push(['', time, weekday, weather].concat(data))
    })
  })
  const markdown = arrayToMarkdownTable([head].concat(mark))
  return {
    markdown
  }
}

//#endregion
//#region 处理非预测问题数据

function main({output, label}) {
  output = JSON.parse(output)
  label = Object.keys(label)
  const site_key = {
    traffic: 'a',
    outside: 'o',
    turn_in_rate: 'i',
    total_amount: 'r',
    transaction_count: 'n',
    avg_amount: 'p',
    convert_rate: 'c',
    avg_item: 'u',
  }
  const site_data = []
  let description = ''
  output.forEach((o, index) => {
    const keys = Object.keys(o)
    const has_queuing = keys.includes('queuing_unit')
    const site = keys.filter(s => !!site_key[s])
    const item = {
      n: o.name
    }
    if (site.length > 0) {
      if (index === 0) {
        description += '    - **"m"：** 地点指标数组，每个对象包含：  \n'
        description += '        - **"t"：** 时间  \n'
        site.forEach(key => {
          switch (key) {
            case 'traffic':
              description += '        - **"a"：** 来点人数  \n'
              break
            case 'outside':
              description += '        - **"o"：** 店外人数  \n'
              break
            case 'turn_in_rate':
              description += '        - **"i"：** 进店率  \n'
              break
            case 'total_amount':
              description += '        - **"r"：** 营业额  \n'
              break
            case 'transaction_count':
              description += '        - **"n"：** 交易数  \n'
              break
            case 'avg_amount':
              description += '        - **"p"：** 客单价  \n'
              break
            case 'convert_rate':
              description += '        - **"c"：** 转化率  \n'
              break
            case 'avg_item':
              description += '        - **"u"：** 客单量  \n'
              break
          }
        })
      }
      item['m'] = label.map((t, i) => {
        const obj = {}
        site.forEach(key => {
          obj[site_key[key]] = o[key][i]
        })
        return {
          t,
          ...obj,
        }
      })
    }
    if (has_queuing) {
      if (index === 0) {
        description +=
          '    - **"q"：** 排队单元数组，每个单元包含：  \n' +
          '        - **"n"：** 排队单元名称  \n' +
          '        - **"m"：** 排队指标数组，每个对象包含：  \n' +
          '            - **"t"：** 时间  \n' +
          '            - **"m"：** 最大排队人数  \n' +
          '            - **"i"：** 最小排队人数  \n' +
          '            - **"a"：** 平均排队人数  \n'
      }
      item['q'] = Object.values(o.queuing_unit ).map(u => {
        return {
          n: u.queuing_name,
          m: Object.keys(u.max_queuing).map(t => {
            return {
              t,
              a: u.avg_queuing[t],
              m: u.max_queuing[t],
              i: u.min_queuing[t],
            }
          })
        }
      })
    }
    site_data.push(item)
  })
  return {
    description,
    site_data: JSON.stringify(site_data),
  }
}

//#endregion
//#region 删除思考过程

function main({output}) {
  return {
    text: String(output).replaceAll(/<think>[\s\S]*?<\/think>/g, '')
      .replaceAll(/<details[\s\S]*?<\/details>/g, '')
  }
}

//#endregion
//#region Test
//#endregion
