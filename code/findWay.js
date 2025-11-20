
//#region 处理检索结果

function parseToObject(str) {
  const obj = {};

  // 只把出现在 行首、分号或换行 后的 "key:" 识别为字段名
  const regex = /(^|;|\n)\s*([A-Za-z0-9_]+)\s*:/g;
  let match;
  const keys = [];

  while ((match = regex.exec(str)) !== null) {
    // match.index 是整个 match 的起始（包含前缀），
    // 找到 key 在 match[0] 中的偏移以算出 key 的全局起始位置
    const fullMatch = match[0];
    const keyName = match[2];
    const offsetInFull = fullMatch.indexOf(keyName);
    const keyIndex = match.index + offsetInFull;
    keys.push({ key: keyName, index: keyIndex });
  }

  for (let i = 0; i < keys.length; i++) {
    const current = keys[i];
    const next = keys[i + 1];

    const start = current.index + current.key.length + 1; // skip `key:`
    const end = next ? next.index : str.length;

    // 取片段并去掉收尾的分号与空白
    let value = str.slice(start, end).trim();
    value = value.replace(/^\s*;|;\s*$/g, "").trim();

    obj[current.key] = value;
  }

  return obj;
}
function main({result}) {
  const list = Array.from(result).map(o => o.content)
  const arr = list.map(o => parseToObject(o))
  const store = arr.filter(o => !Object.keys(o).includes('product_id'))
  const store_by_id = {}
  store.forEach(o => {
    store_by_id[String(o.store_id)] = o
  })
  const product = arr.filter(o => Object.keys(o).includes('product_id'))
  const product_store = product.map(o => String(o.store_id))
  const unique = [...new Set(product_store)]
  const need_query = unique.filter(n => !store_by_id[n])
  let sql = ''
  if (need_query.length > 0) {
    sql = `
      SELECT *
      FROM test_dify.store
      WHERE store_id IN (${need_query.join(', ')});
    `
  }
  return {
    sql,
  }
}
//#endregion
//#region 整合结果

function parseToObject(str) {
  const obj = {};

  // 只把出现在 行首、分号或换行 后的 "key:" 识别为字段名
  const regex = /(^|;|\n)\s*([A-Za-z0-9_]+)\s*:/g;
  let match;
  const keys = [];

  while ((match = regex.exec(str)) !== null) {
    // match.index 是整个 match 的起始（包含前缀），
    // 找到 key 在 match[0] 中的偏移以算出 key 的全局起始位置
    const fullMatch = match[0];
    const keyName = match[2];
    const offsetInFull = fullMatch.indexOf(keyName);
    const keyIndex = match.index + offsetInFull;
    keys.push({ key: keyName, index: keyIndex });
  }

  for (let i = 0; i < keys.length; i++) {
    const current = keys[i];
    const next = keys[i + 1];

    const start = current.index + current.key.length + 1; // skip `key:`
    const end = next ? next.index : str.length;

    // 取片段并去掉收尾的分号与空白
    let value = str.slice(start, end).trim();
    value = value.replace(/^\s*;|;\s*$/g, "").trim();

    obj[current.key] = value;
  }

  return obj;
}
function main({result, text}) {
  let stores = []
  if (!!text) {
    const md = String(text).replace(/(?<!\|)\n(?!\|)/g, ' ').replaceAll('\r', ' ')
    const lines = md.split('\n')
    const parseRow = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(col => col.trim())
    const head = parseRow(lines[0])
    const body = lines.slice(2)
    stores = body.map(line => {
      const cols = parseRow(line)
      const obj = {}
      head.forEach((h, i) => {
        obj[h] = cols[i] ?? "";
      })
      return obj
    })
  }
  const list = Array.from(result).map(o => o.content)
  const arr = list.map(o => parseToObject(o))
  const store = arr.filter(o => !Object.keys(o).includes('product_id'))
  const store_by_id = {}
  store.forEach(o => {
    const obj = {}
    obj.store_id = o.store_id
    Object.keys(o).forEach(key => {
      if (key !== 'store_id') {
        obj[`store_${key}`] = o[key]
      }
    })
    store_by_id[String(o.store_id)] = obj
  })
  stores.forEach(o => {
    const obj = {}
    obj.store_id = o.store_id
    Object.keys(o).forEach(key => {
      if (key !== 'store_id') {
        obj[`store_${key}`] = o[key]
      }
    })
    store_by_id[String(o.store_id)] = obj
  })
  const product = arr.filter(o => Object.keys(o).includes('product_id')).map(o => {
    return {
      ...o,
      ...(store_by_id[o.store_id] || {})
    }
  })
  const str_s = store.map(obj => {
    return Object.entries(obj)
      .map(([key, val]) => `${key}: ${val}`)
      .join('; ')
  })
  const str_p = product.map(obj => {
    return Object.entries(obj)
      .map(([key, val]) => `${key}: ${val}`)
      .join('; ')
  })
  return {
    store: str_s,
    product: str_p,
    store_obj: store,
    product_obj: product,
  }
}
//#endregion
//#region 处理筛选结果

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
function main({text, query, store_obj, product_obj}) {
  const obj = handleLLM(text)
  const product_id = {}
  Array.from(product_obj).forEach(o => {
    product_id[o.product_id] = o
  })
  const store_id = {}
  Array.from(store_obj).forEach(o => {
    store_id[o.store_id] = o
  })
  const product = Array.isArray(obj.product) ? Array.from(obj.product) : []
  const store = Array.isArray(obj.store) ? Array.from(obj.store) : []
  const answer = obj.answer
  const need = !!obj.need_confirm
  const str_s = store.map(id => {
    const obj = store_id[id] || {}
    return Object.entries(obj)
      .map(([key, val]) => `${key}: ${val}`)
      .join('; ')
  })
  const str_p = product.map(id => {
    const obj = product_id[id] || {}
    return Object.entries(obj)
      .map(([key, val]) => `${key}: ${val}`)
      .join('; ')
  })
  const history = {
    question: query,
    answer,
    product: str_p,
    store: str_s,
  }
  return {
    history,
    answer,
    need,
  }
}

//#endregion
//#region 解析缓存

function parseToObject(str) {
  const obj = {};

  // 只把出现在 行首、分号或换行 后的 "key:" 识别为字段名
  const regex = /(^|;|\n)\s*([A-Za-z0-9_]+)\s*:/g;
  let match;
  const keys = [];

  while ((match = regex.exec(str)) !== null) {
    // match.index 是整个 match 的起始（包含前缀），
    // 找到 key 在 match[0] 中的偏移以算出 key 的全局起始位置
    const fullMatch = match[0];
    const keyName = match[2];
    const offsetInFull = fullMatch.indexOf(keyName);
    const keyIndex = match.index + offsetInFull;
    keys.push({ key: keyName, index: keyIndex });
  }

  for (let i = 0; i < keys.length; i++) {
    const current = keys[i];
    const next = keys[i + 1];

    const start = current.index + current.key.length + 1; // skip `key:`
    const end = next ? next.index : str.length;

    // 取片段并去掉收尾的分号与空白
    let value = str.slice(start, end).trim();
    value = value.replace(/^\s*;|;\s*$/g, "").trim();

    obj[current.key] = value;
  }

  return obj;
}
function main({history}) {
  const product = Array.from(history.product).map(o => typeof o === 'string' ? o : JSON.stringify(o))
  const store = Array.from(history.store).map(o => typeof o === 'string' ? o : JSON.stringify(o))
  const product_obj = product.map(o => parseToObject(o))
  const store_obj = store.map(o => parseToObject(o))
  return {
    question: history.question,
    answer: history.answer,
    product,
    store,
    product_obj,
    store_obj,
  }
}

//#endregion
//#region 处理结果

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
function main({text, query, store_obj, product_obj}) {
  const obj = handleLLM(text)
  const action = obj.action
  const product_id = {}
  Array.from(product_obj).forEach(o => {
    product_id[o.product_id] = o
  })
  const store_id = {}
  Array.from(store_obj).forEach(o => {
    store_id[o.store_id] = o
  })
  const product = Array.isArray(obj.product) ? Array.from(obj.product) : []
  const store = Array.isArray(obj.store) ? Array.from(obj.store) : []
  const answer = obj.answer
  const need = action === 'further_filter'
  const str_s = store.map(id => {
    const obj = store_id[id] || {}
    return Object.entries(obj)
      .map(([key, val]) => `${key}: ${val}`)
      .join('; ')
  })
  const str_p = product.map(id => {
    const obj = product_id[id] || {}
    return Object.entries(obj)
      .map(([key, val]) => `${key}: ${val}`)
      .join('; ')
  })
  const history = {
    question: query,
    answer,
    product: str_p,
    store: str_s,
  }
  return {
    action,
    need,
    history,
    answer,
  }
}
//#endregion
//#region Test
//#endregion
