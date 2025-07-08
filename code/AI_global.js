//#region 处理MD

function main({file_md}) {
  const array = file_md.toString().split(/\n|\\n/).filter(o => !!o?.trim() && o.trim().startsWith('|'))
  const head = array.slice(0, 2)
  const head_arr = String(head[0]).split('|').map(o => o.trim())
  const tw_index = String(head[0]).split('|').findIndex(o => o.trim() === 'zh-TW')
  const length = array.slice(2).length
  const obj = {}
  const obj_list = []
  let index = 0
  array.slice(2).forEach((value, key) => {
    obj['i' + key] = value
    index = Math.floor(key / 160)
    if (!obj_list[index]) obj_list[index] = {}
    const arr = value.split('|')
    const text = arr[tw_index]
    obj_list[index]['i' + key] = {
      o: value,
      t: text,
    }
  })
  const request_list = obj_list.map(arr => {
    const head = JSON.stringify(head_arr)
    const list = JSON.stringify(arr)
    return JSON.stringify({
      inputs: {
        list,
        head,
      },
      response_mode: 'blocking',
      user: 'ai'
    })
  })
  return {
    head,
    obj,
    request_list,
    length,
  }
}
//#endregion
//#region 整合数据

function main({output, head}) {
  let unprocessed = {}
  let processed = {}
  Array.from(output).forEach(body => {
    const obj = JSON.parse(String(body))
    const outputs = obj?.data?.outputs ?? {}
    unprocessed = {
      ...unprocessed,
      ...(outputs?.unprocessed ?? {})
    }
    processed = {
      ...processed,
      ...(outputs?.processed ?? {})
    }
  })
  const res = []
  let i = 0
  while (Object.values(unprocessed).length > i * 100) {
    const table = Array.from(head).concat(Object.values(unprocessed).slice(i * 100, i * 100 + 100))
    res.push(table.join('\n'))
    i++
  }
  return {
    res,
    processed,
    unprocessed,
  }
}
//#endregion
//#region 整合输出

function main({output, processed, unprocessed, length, head}) {
  const head_arr = String(head[0]).split('|').map(o => o.trim())
  const lang_arr = head_arr.filter(o => !!o && !o.startsWith('Main') && !o.startsWith('i18') && !o.startsWith('History'))
  const obj = {}
  Array.from(output).forEach(item => {
    const arr = String(item).split('\n').filter(o => !!o.trim() && (o.trim().startsWith('|') || o.trim().endsWith('|')))
    arr.slice(2).forEach(text => {
      const list = String(text).split('|')
      const func_key = !!list[1].trim() ? list[1].trim() : ' '
      const i18n_key = list[2].trim()
      const lang_text = list.filter((o, k) => k > 2 && !!o.trim()).map(o => o.trim())
      const trans = ['', func_key, i18n_key].concat(lang_arr.map((o, k) => {
        return lang_text?.[k] ?? ' '
      })).concat([' ', '']).join('|')
      obj[i18n_key] = trans.replaceAll('\"', '')
    })
  })
  const body = []
  for (let i = 0; i < length; i++) {
    if (!!processed?.['i' + i]) {
      body.push(processed['i' + i])
    } else {
      const list = String(unprocessed['i' + i]).split('|')
      const i18n_key = list[2]
      if (!!obj?.[i18n_key]) {
        body.push(obj[i18n_key])
      } else {
        body.push(unprocessed['i' + i])
      }
    }
  }
  const table = Array.from(head).concat(body)
  let totalLength = 0
  let result = []
  let item = ''
  for (const str of table) {
    if (totalLength + str.length + 2 > 80000) {
      result.push(item)
      item = (str + '\n')
      totalLength = (str.length + 2)
    } else {
      item += (str + '\n')
      totalLength += (str.length + 2)
    }
  }
  if (!!item) result.push(item)
  return {
    result,
    obj,
  }
}
//#endregion
