//#region 处理数据

function main({list}) {
  const obj = JSON.parse(list)
  const num_list = Object.keys(obj).map(k => Number(k.split('i')[1]))
  const text_list = num_list.map(index => {
    const value = obj['i' + index]
    return String(value['t'] ?? '')
  })
  return {
    obj,
    num_list,
    text_list,
  }
}
//#endregion
//#region 格式化检索结果

function main({result, item}) {
  const format = Array.from(result).map(o => {
    const obj = {}
    String(o.content).split('\";\"').forEach(s => {
      const str = s.replaceAll('\"', '')
      const map = str.split(':')
      obj[map[0].trim()] = map[1].trim()
    })
    return obj
  })
  const find = format.find(o => o['zh-TW'] === item) ?? {}
  return {
    find
  }
}
//#endregion
//#region 处理检索结果

function main({output, head, num_list, obj}) {
  const head_arr = Array.from(JSON.parse(head))
  const lang_arr = head_arr.filter(o => !!o && !o.startsWith('Main') && !o.startsWith('i18') && !o.startsWith('History'))
  const processed = {}, unprocessed = {}
  Array.from(output).forEach((find, index) => {
    const item = num_list[index]
    const arr = String(obj['i' + item]['o']).split('|')
    const i18n_key = arr[2]
    const func_key = arr[1]
    if (!!find?.['zh-TW'] && lang_arr.every(lang => Object.keys(Object(find)).includes(String(lang)))) {
      processed[`i${item}`] = ['', func_key, i18n_key].concat(lang_arr.map(o => find[o])).concat(['', '']).join('|')
    }
    else {
      unprocessed[`i${item}`] = ['', func_key, i18n_key].concat(lang_arr.map(o => {
        const index = head_arr.findIndex(v => v === o)
        return find?.[o] ?? (arr?.[index] ?? '')
      })).concat(['', '']).join('|')
    }
  })
  return {
    processed,
    unprocessed,
  }
}
//#endregion
