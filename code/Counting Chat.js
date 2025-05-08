//#region 处理地点列表

function main({body, llm_obj}) {
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
  let need_llm = 1
  switch (llm_obj?.step) {
    case 'site_enter':
      need_llm = 0
      break
    case 'date_enter':
      need_llm = 1
      break
    case 'data_enter':
      need_llm = 1
      break
  }
  return {
    need_llm,
    site: JSON.stringify(site),
    site_name: JSON.stringify(name, null, 2),
    date: `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  }
}

//#endregion
//#region 整合LLM

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
function isWithinNext7Days(dateString) {
  // 1. 解析输入
  const targetDate = new Date(dateString);
  if (isNaN(targetDate.getTime())) {
    // 如果解析失败，视为不在范围内
    return false;
  }
  targetDate.setHours(0, 0, 0, 0)
  // 2. 获取当前时间
  const now = new Date();
  now.setHours(0, 0, 0, 0)

  // 3. 计算毫秒差
  const diffMs = targetDate - now;

  // 4. 判断是否非负且不超过 7 天（7*24*3600*1000 毫秒）
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return diffMs >= 0 && diffMs <= sevenDaysMs;
}
function main({text, llm_obj, site_name, query}) {
  const llm = !!text ? handleLLM(text) : {}
  const name = Array.from(JSON.parse(site_name))
  let new_obj
  switch (llm_obj?.step) {
    case 'site_enter':
      const question = String(query)
      const site = name.filter(n => question.includes(String(n)))
      new_obj = {
        ...llm_obj,
        site,
      }
      break
    case 'date_enter':
      new_obj = {
        ...llm_obj,
        predict_start: llm?.start,
        predict_end: llm?.end,
      }
      break
    case 'data_enter':
      new_obj = {
        ...llm_obj,
        data: llm?.data,
      }
      break
    default:
      new_obj = {
        ...llm
      }
      break
  }
  let reply = ''
  const predict = !!new_obj?.predict
  if (predict) {
    const list = Array.isArray(new_obj?.site) ? Array.from(new_obj.site) : []
    const site = list.filter(o => name.includes(o))
    if (site.length === 0) {
      if (new_obj?.step === 'site_enter') {
        reply = new_obj?.error?.site_error ?? '没有找到匹配的地点，请重新提问'
        new_obj = null
      }
      else {
        reply = new_obj?.error?.site_enter ?? '请输入预测的地点'
        new_obj = {
          ...new_obj,
          step: 'site_enter',
        }
      }
    }
    else {
      const predict_start = String(new_obj?.predict_start ?? '')
      const predict_end = String(new_obj?.predict_end ?? '')
      if (!predict_start || !predict_end) {
        if (new_obj?.step === 'date_enter') {
          reply = new_obj?.error?.date_error ?? '预测的日期应在未来7天之内，请重新提问'
          new_obj = null
        }
        else {
          reply = new_obj?.error?.date_enter ?? '请输入预测的日期(请选择未来7天内的日期)'
          new_obj = {
            ...new_obj,
            step: 'date_enter',
          }
        }
      }
      else if (!isWithinNext7Days(predict_start) || !isWithinNext7Days(predict_end)) {
        reply = new_obj?.error?.date_error ?? '预测的日期应在未来7天之内，请重新提问'
        new_obj = null
      }
      else {
        const DATA = ['traffic', 'outside', 'turn_in_rate', 'total_amount', 'transaction_count', 'avg_amount', 'convert_rate', 'avg_item', 'queuing']
        const list = Array.isArray(new_obj?.data) ? Array.from(new_obj.data) : []
        const data = list.filter(o => DATA.includes(o))
        if (data.length === 0) {
          if (new_obj?.step === 'data_enter') {
            reply = new_obj?.error?.data_error ?? '没有找到匹配的数据类型，请重新提问'
            new_obj = null
          }
          else {
            reply = new_obj?.error?.data_enter ?? '请输入预测的数据类型'
            new_obj = {
              ...new_obj,
              step: 'data_enter',
            }
          }
        }
      }
    }
  }
  return {
    reply,
    new_obj,
  }
}

//#endregion
//#region 处理问题关键信息

function fm(num) {
  return `${num > 9 ? '' : '0'}${num}`
}
function format(date, show = true) {
  return `${date.getFullYear()}/${fm(date.getMonth() + 1)}${show ? ('/' + fm(date.getDate())) : ''}`
}
function isValidDate(dateString) {
  const date = new Date(dateString)
  return !!dateString && date instanceof Date && !isNaN(date.getTime())
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
function buildWidget(start, end, unit) {
  let sd = new Date(start)
  let ed = new Date(end)
  const date = []
  let label = []
  let data_range = ''
  let data_unit = ''
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
function buildPos(start, end, data_unit) {
  const unit = data_unit === 'hh' ? 'hh' : (data_unit ?? 'dd')
  const add_days = unit === 'hh' ? 31 : 366
  let sd = new Date(start)
  let ed = new Date(end)
  const periods = []
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
function buildQueuing(start, end) {
  const add_days = 59
  let sd = new Date(start)
  let ed = new Date(end)
  const periods = []
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
function main({new_obj, site, token, acc_id}) {
  const site_list = Array.from(JSON.parse(site))
  const site_name = Array.isArray(new_obj?.site) ?  Array.from(new_obj?.site) : []
  const store = site_list.filter(o => {
    return site_name.length === 0 || site_name.includes(o.store_name)
  })
  const sources = store.map(o => {
    return { target_id: o.store_id }
  })
  const rks = store.map(o => o.register_key)
  const sensor_ids = store.reduce((arr, o) => arr.concat(o?.sensor_ids ?? []), [])
  const store_ids = store.map(o => o.store_id)
  const DATA = [
    'traffic', 'outside', 'turn_in_rate', 'total_amount', 'transaction_count',
    'avg_amount', 'convert_rate', 'avg_item', 'queuing'
  ]
  const data = (Array.isArray(new_obj?.data) ? Array.from(new_obj?.data) : []).filter(o => DATA.includes(o))
  const predict = !!new_obj?.['predict']
  let widget_request = '', pos_request = [], queuing_request = [], weather_request = ''
  let predict_request = '', space_request = '', label, weather_label = {}, widget_unit
  const widget_base = {
    analytic: [
      {
        caption: '',
        method: 'convert_rate',
        preprocess_data: ['pin', 'crosscnt']
      }
    ],
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
  }
  if (predict) {
    widget_unit = 'dd'
    const predict_start = String(new_obj?.['predict_start'])
    const predict_end = String(new_obj?.['predict_end'])
    let history_start = String(new_obj?.['history_start'])
    let history_end = String(new_obj?.['history_end'])
    const history = !!new_obj?.['history']
    if (!history || !isValidDate(history_start) || !isValidDate(history_end)) {
      history_end = format(new Date())
      const sd = new Date()
      sd.setFullYear(sd.getFullYear() - 1)
      history_start = format(sd)
    }
    const weather_base = {
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
    const history_widget = buildWidget(history_start, history_end, 'dd')
    const predict_widget = buildWidget(predict_start, predict_end, 'dd')
    label = history_widget.label
    weather_label = predict_widget.label
    weather_request = JSON.stringify({
      data_source: {
        ...weather_base,
        ...history_widget.widget,
      },
      module_id: 0,
      token: JSON.parse(token)
    })
    predict_request = JSON.stringify({
      data_source: {
        ...weather_base,
        ...predict_widget.widget,
      },
      module_id: 0,
      token: JSON.parse(token)
    })
    if (data.includes('traffic') || data.includes('outside') || data.includes('turn_in_rate') || data.includes('convert_rate')) {
      widget_request = JSON.stringify({
        data_source: {
          ...widget_base,
          ...history_widget.widget,
        },
        module_id: 0,
        token: JSON.parse(token)
      })
    }
    if (data.includes('total_amount') || data.includes('transaction_count') || data.includes('avg_amount')
      || data.includes('convert_rate') || data.includes('avg_item')) {
      const history_pos = buildPos(history_start, history_end, 'dd')
      pos_request = history_pos.periods.map(item => {
        return JSON.stringify({
          account_id: acc_id,
          token: {
            token: JSON.parse(token)
          },
          period: JSON.parse(item),
          rks,
          unit: history_pos.unit ?? 'dd',
          ...(sensor_ids.length > 0 ? { sensor_ids } : {}),
        })
      })
    }
    if (data.includes('queuing')) {
      space_request = JSON.stringify({
        store_ids,
        token: JSON.parse(token)
      })
      const history_queuing = buildQueuing(history_start, history_end)
      queuing_request = history_queuing.map(item => {
        return JSON.stringify({
          token: JSON.parse(token),
          date_range: JSON.parse(item),
          store_ids,
          data_unit: 'hh',
        })
      })
    }
  }
  else {
    const start = isValidDate(new_obj?.['start']) ? new_obj.start : format(new Date())
    const end = isValidDate(new_obj?.['end']) ? new_obj.end : format(new Date())
    const UNIT = ['yyyy', 'mm', 'ww', 'dd', 'hh']
    const unit = UNIT.includes(new_obj?.['unit']) ? new_obj.unit : 'dd'
    widget_unit = unit
    const history_widget = buildWidget(start, end, unit)
    label = history_widget.label
    if (data.includes('traffic') || data.includes('outside') || data.includes('turn_in_rate') || data.includes('convert_rate')) {
      widget_request = JSON.stringify({
        data_source: {
          ...widget_base,
          ...history_widget.widget,
        },
        module_id: 0,
        token: JSON.parse(token)
      })
    }
    if (data.includes('total_amount') || data.includes('transaction_count') || data.includes('avg_amount')
      || data.includes('convert_rate') || data.includes('avg_item')) {
      const history_pos = buildPos(start, end, unit)
      pos_request = history_pos.periods.map(item => {
        return JSON.stringify({
          account_id: acc_id,
          token: {
            token: JSON.parse(token)
          },
          period: JSON.parse(item),
          rks,
          unit: history_pos.unit ?? 'dd',
          ...(sensor_ids.length > 0 ? { sensor_ids } : {}),
        })
      })
    }
    if (data.includes('queuing')) {
      space_request = JSON.stringify({
        store_ids,
        token: JSON.parse(token)
      })
      const history_queuing = buildQueuing(start, end)
      queuing_request = history_queuing.map(item => {
        return JSON.stringify({
          token: JSON.parse(token),
          date_range: JSON.parse(item),
          store_ids,
          data_unit: 'hh',
        })
      })
    }
  }
  return {
    data,
    predict: predict ? 1 : 0,
    site: JSON.stringify(store),
    widget_unit,
    weather_label,
    label,
    widget_request,
    pos_request,
    queuing_request,
    weather_request,
    predict_request,
    space_request,
  }
}

//#endregion
//#region 处理widget数据

function formatWidget(body, site, widget_unit, data) {
  const res = !!body ? JSON.parse(body) : {}
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
  const obj = formatWidget(body, site, widget_unit, data)
  return {
    widget: JSON.stringify(Object.values(obj))
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
  Array.isArray(output) && output.forEach(str => {
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
function main({label, output, widget, data, widget_unit}) {
  label = Object.keys(label)
  widget = JSON.parse(widget)
  const res = formatPos(label, output, widget, data, widget_unit)
  return {
    pos: JSON.stringify(res)
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
    const queuing_unit = {}
    obj[o.id] = {
      ...o,
      ...(Array.isArray(output) ? { queuing_unit } : {})
    }
  })
  Array.isArray(output) && output.forEach(str => {
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
function main({output, pos, monitor}) {
  pos = JSON.parse(pos)
  const res = formatQueuing(output, pos, monitor)
  return {
    queuing: JSON.stringify(Object.values(res))
  }
}

//#endregion
//#region 处理非预测问题数据

function main({queuing, label}) {
  const output = Array.from(JSON.parse(queuing))
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
    site_data: JSON.stringify(site_data, null, 2),
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
function main({queuing, label, weather_label, widget, weather, new_obj}) {
  const output = Array.from(JSON.parse(queuing))
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
  const en = {
    traffic: 'Traffic',
    outside: 'Outside Traffic',
    turn_in_rate: 'Turn in Rate',
    total_amount: 'Sales',
    transaction_count: 'Transaction',
    avg_amount: 'Average Transaction Value',
    convert_rate: 'Conversion Rate',
    avg_item: 'Average Basket Size',
  }
  const lang = new_obj?.lang
  const history = [], predict = []
  let predict_data = ''
  const head = ['地点名称', '日期', '星期', '天气']
  const md_head = ['Date', 'Weekday', 'Weather']
  output.forEach((o, index) => {
    const wea1 = weather1?.['retrived']?.[0]?.['data']?.find(i => i.store_id === o.id) ?? {}
    const wea2 = weather2?.['retrived']?.[0]?.['data']?.find(i => i.store_id === o.id) ?? {}
    const keys = Object.keys(o).filter(k => !!i18n[k])
    if (!predict_data) predict_data = keys.join('、')
    label.forEach((time, i) => {
      const weekday = getWeekday(time)
      const weather = getWeather(wea1?.conditions?.row?.[i])
      const data = []
      keys.forEach(key => {
        if (index === 0 && i === 0) {
          head.push(i18n[key])
          md_head.push('Predict ' + en[key])
        }
        data.push(o[key][i])
      })
      history.push([i === 0 ? o.name : '', time, weekday, weather].concat(data))
    })
    weather_label.forEach((time, i) => {
      const weekday = getWeekday(time)
      const weather = getWeather(wea2?.conditions?.row?.[i])
      const data = Array(head.length - 4).fill(null)
      predict.push(['', time, weekday, weather].concat(data))
    })
  })
  const markdown = arrayToMarkdownTable([md_head])
  return {
    history: arrayToMarkdownTable([head].concat(history)),
    predict: arrayToMarkdownTable([head].concat(predict)),
    data: predict_data,
    lang,
    markdown,
  }
}

//#endregion
//#region 删除思考过程

function main({output, predict}) {
  return {
    text: String(output ?? predict).replaceAll(/<think>[\s\S]*?<\/think>/g, '')
      .replaceAll(/<details[\s\S]*?<\/details>/g, '')
  }
}
//#region 处理问题关键信息



//#endregion
//#region Test
//#endregion
