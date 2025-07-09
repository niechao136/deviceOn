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
const input = {
  "file_md": "|Main Function|i18N - Key|zh-TW|zh-CN|en-US|ja-JP|ko-KR|History / Comment / Note|\n|---|---|---|---|---|---|---|---|\n|Router|Router_/appointment|預約管理| | | | | |\n| |Router_/visitor|訪客紀錄| | | | | |\n| |Router_/analysis|統計分析| | | | | |\n| |Router_/analysis/overview|訪客數據總覽| | | | | |\n| |Router_/template|文字範本管理| | | | | |\n| |Router_/template/pass|訪客通行證| | | | | |\n| |Router_/template/bulletin|訪客公告資訊| | | | | |\n| |Router_/setting|系統設定| | | | | |\n| |Router_/setting/position|職務管理| | | | | |\n| |Router_/setting/visit|訪問資料設定| | | | | |\n| |Router_/setting/edge|訪客終端顯示| | | | | |\n|Button|Button_Clear|清除| | | | | |\n| |Button_Submit|提交| | | | | |\n| |Button_Cancel|取消| | | | | |\n| |Button_Confirm|確認| | | | | |\n| |Button_Send|發送| | | | | |\n| |Button_Close|關閉| | | | | |\n| |Button_Reset|重設| | | | | |\n| |Button_Save|保存| | | | | |\n|Common|Common_Keyword|關鍵詞| | | | | |\n| |Common_Search|請輸入關鍵詞| | | | | |\n| |Common_NoData|無資料| | | | | |\n| |Common_Enter|請輸入| | | | | |\n| |Common_Choose|請選擇| | | | | |\n| |Common_add_item|新增項目| | | | | |\n| |Common_delete_item|刪除項目| | | | | |\n| |Common_delete_none|請選擇需要刪除的項目！| | | | | |\n| |Common_delete_multiple|已選擇{0}個項目，確認刪除這些項目？| | | | | |\n| |Common_delete_single|確認要刪除該項目：{0}嗎？| | | | | |\n| |Common_SiteSelect|地點篩選| | | | | |\n| |Common_TimePeriod|時間週期| | | | | |\n| |Common_Time|時| | | | | |\n| |Common_Country|國家/地區| | | | | |\n| |Common_Province|區域一| | | | | |\n| |Common_City|區域二| | | | | |\n| |Common_Group|地點群組| | | | | |\n| |Common_Type|地點類型| | | | | |\n| |Common_Site|地點名稱| | | | | |\n| |Common_Site1|地點| | | | | |\n| |Common_minutes|{0}分鐘| | | | | |\n| |Common_hours|{0}小時| | | | | |\n| |Common_none|不限制| | | | | |\n| |Common_date|日| | | | | |\n| |Common_week|週| | | | | |\n| |Common_month|月| | | | | |\n| |Common_year|年| | | | | |\n| |Common_ThisDay|今天| | | | | |\n| |Common_PreviousDay|昨天| | | | | |\n| |Common_ThisWeek|本週| | | | | |\n| |Common_PreviousWeek|前一週| | | | | |\n| |Common_Last7Day|過去 7 天| | | | | |\n| |Common_ThisMonth|本月| | | | | |\n| |Common_PreviousMonth|前一月| | | | | |\n| |Common_ThisYear|本年| | | | | |\n| |Common_PreviousYear|前一年| | | | | |\n| |Common_Custom|自定義| | | | | |\n| |Common_Customized|客製化| | | | | |\n| |Common_DatepickerTip|顯示報告| | | | | |\n| |Common_All|全部| | | | | |\n| |Common_Total|全部| | | | | |\n| |Common_Mon|週一| | | | | |\n| |Common_Tue|週二| | | | | |\n| |Common_Wed|週三| | | | | |\n| |Common_Thu|週四| | | | | |\n| |Common_Fri|週五| | | | | |\n| |Common_Sat|週六| | | | | |\n| |Common_Sun|週日| | | | | |\n| |Common_Week|星期| | | | | |\n| |Common_WeekNum|第一週;第二週;第三週;第四週;第五週;第六週| | | | | |\n| |Common_WeekdayDay|星期一;星期二;星期三;星期四;星期五;星期六;星期日| | | | | |\n| |Common_Weekday|一;二;三;四;五;六;日| | | | | |\n| |Common_weekdaysMin|日;一;二;三;四;五;六| | | | | |\n| |Common_weekdaysAll|星期日;星期一;星期二;星期三;星期四;星期五;星期六| | | | | |\n| |Common_monthsShort|1月;2月;3月;4月;5月;6月;7月;8月;9月;10月;11月;12月| | | | | |\n| |Common_selected|已選擇 {0} 項| | | | | |\n| |Common_TableTotal|資料筆數：| | | | | |\n| |Common_TableNow|當前頁面| | | | | |\n| |Common_TableRow|顯示行數| | | | | |\n| |Common_TablePrevious5|前5頁| | | | | |\n| |Common_TableNext5|後5頁| | | | | |\n| |Common_SelectAll|全選| | | | | |\n| |Common_SelectMax|選項被選中，請在選擇新項目之前刪除所選項目| | | | | |\n| |Common_SelectNoResult|找不到選項，請重新搜索| | | | | |\n| |Common_SelectNoOption|選項列表為空| | | | | |\n| |Common_Operation|操作| | | | | |\n| |Common_Execute|執行| | | | | |\n| |Common_update_time|更新時間| | | | | |\n| |Common_note|備註| | | | | |\n| |Common_status|狀態| | | | | |\n| |Common_use|啟用| | | | | |\n| |Common_email|電子郵件| | | | | |\n| |Common_company|公司| | | | | |\n| |Common_edit|編輯| | | | | |\n| |Common_detail|詳情| | | | | |\n| |Common_back|返回| | | | | |\n| |Common_Save|儲存成功！| | | | | |\n| |Common_Save_Success|儲存成功！| | | | | |\n| |Common_Save_Failed|儲存失敗！| | | | | |\n| |Common_Delete_Success|刪除成功！| | | | | |\n| |Common_Delete_Failed|刪除失敗！| | | | | |\n| |Common_Deactivate_Success|停止成功！| | | | | |\n| |Common_Deactivate_Failed|停止失敗！| | | | | |\n| |Common_Publish_Success|執行成功！| | | | | |\n| |Common_Publish_Failed|執行失敗！| | | | | |\n| |Common_api_err|API服務發生錯誤| | | | | |\n| |Common_logoutMsg|帳號已登出，請重新登錄！| | | | | |\n| |Common_logoutTitle|帳號異常| | | | | |\n| |Common_require|(必填)| | | | | |\n| |Common_need|是/否| | | | | |\n| |Common_delete_success|刪除成功!| | | | | |\n| |Common_delete_fail|刪除失敗!| | | | | |\n| |Common_add_success|新增成功!| | | | | |\n| |Common_add_fail|新增失敗!| | | | | |\n| |Common_edit_success|編輯成功!| | | | | |\n| |Common_edit_fail|編輯失敗!| | | | | |\n| |Common_emailFormat|請輸入正確的信箱地址| | | | | |\n| |Common_PhoneFormat|請輸入正確的電話號碼| | | | | |\n| |Common_img_title|裁剪| | | | | |\n| |Common_img_close|使用原始影像| | | | | |\n| |Common_img_confirm|使用裁剪影像| | | | | |\n| |Common_img_square|正方形| | | | | |\n| |Common_img_free|自由| | | | | |\n| |Common_img_Rotate|旋轉| | | | | |\n| |Common_img_Ratio|比率| | | | | |\n| |Common_img_Quality|裁剪圖像品質| | | | | |\n| |Common_img_Type|輸出類型| | | | | |\n| |Common_img_size|影像限制大小| | | | | |\n| |Common_img_Original|影像原始大小| | | | | |\n| |Common_img_Cropper|影像裁剪器大小| | | | | |\n| |Common_Error_EmptyFile|請不要上傳空的excel文件！| | | | | |\n| |Common_Error_DataFormat|excel文件數據格式錯誤！| | | | | |\n| |Common_Error_ImportEmpty|第{0}行：{1}不能為空或空格！| | | | | |\n| |Common_Error_NotList|第{0}行：{1}不在列表中！| | | | | |\n| |Common_Error_NotFormat|第{0}行：{1}格式不正確！| | | | | |\n| |Common_Error_ImportBlank|第{0}行：{1}不能為空格！| | | | | |\n|Unit|Unit_per|人| | | | | |\n|Layout|Layout_Brand|公司 ID : {0}| | | | | |\n| |Layout_Home|平台首頁| | | | | |\n| |Layout_Setting|系統設定| | | | | |\n| |Layout_Logout|登出| | | | | |\n| |Layout_Rule_1|系統管理員| | | | | |\n| |Layout_Rule_2|管理員| | | | | |\n| |Layout_Rule_3|一般用戶| | | | | |\n| |Layout_logoutTitle|帳號異常| | | | | |\n| |Layout_logoutMsg|帳號已登出，請重新登錄！| | | | | |\n|Appoint|Appoint_appointer|預約人| | | | | |\n| |Appoint_list|預約管理列表| | | | | |\n| |Appoint_add|新增預約| | | | | |\n| |Appoint_cancel|是否確認取消？| | | | | |\n| |Appoint_send_email|向訪客發送取消通知| | | | | |\n| |Appoint_name|預約人名稱| | | | | |\n| |Appoint_date|預約日期| | | | | |\n| |Appoint_time|預約時間| | | | | |\n| |Appoint_site|預約地點| | | | | |\n| |Appoint_reason|訪問事由| | | | | |\n| |Appoint_num|訪客人數| | | | | |\n| |Appoint_basic|基本資訊| | | | | |\n| |Appoint_visit_time|訪問日期| | | | | |\n| |Appoint_visit_period|訪問時段| | | | | |\n| |Appoint_visit_site|訪問地點| | | | | |\n| |Appoint_visit_reason|訪問事由| | | | | |\n| |Appoint_visit_part|被訪人部門| | | | | |\n| |Appoint_visit_interviewee|被訪人| | | | | |\n| |Appoint_visit_valid|人臉辨識驗證| | | | | |\n| |Appoint_visit_remark|備註事項| | | | | |\n| |Appoint_visit_list|訪客列表| | | | | |\n| |Appoint_visit_add|新增訪客| | | | | |\n| |Appoint_visit_import|匯入訪客| | | | | |\n| |Appoint_visit_import_photo|匯入照片| | | | | |\n| |Appoint_visit_export|匯出訪客資料表| | | | | |\n| |Appoint_visit_export_t|下載範本| | | | | |\n| |Appoint_visit_export_all|匯出全部資料| | | | | |\n| |Appoint_visit_export_part|匯出選取項目| | | | | |\n| |Appoint_visit_file|訪客資料表| | | | | |\n| |Appoint_visit_exporttempalte|訪客資料表模板| | | | | |\n| |Appoint_visit_noData|請選擇需要匯出的訪客！| | | | | |\n| |Appoint_visit_name|訪客姓名| | | | | |\n| |Appoint_visit_ID|訪客ID| | | | | |\n| |Appoint_visit_id|身分證或護照ID| | | | | |\n| |Appoint_visit_phone|連絡電話| | | | | |\n| |Appoint_visit_car|車牌號碼| | | | | |\n| |Appoint_visit_stay_tip|是否需要安排住宿| | | | | |\n| |Appoint_visit_need|需要| | | | | |\n| |Appoint_visit_photo|照片| | | | | |\n| |Appoint_visit_edit|編輯訪客| | | | | |\n| |Appoint_visit_send|重寄送邀請信| | | | | |\n| |Appoint_Error_FileType|請上傳xlsx類型的文件！| | | | | |\n| |Appoint_Error_FileType1|請上傳zip壓縮包！| | | | | |\n| |Appoint_Error_FileType_max|上傳壓縮包超過5M！| | | | | |\n| |Appoint_Error_excel1|第{scope}行訪客姓名不能為空| | | | | |\n| |Appoint_Error_excel2|第{scope}行身分證或護照ID不能為空| | | | | |\n| |Appoint_Error_excel3|第{scope}行連絡電話不能為空| | | | | |\n| |Appoint_Error_excel4|第{scope}行郵箱地址格式錯誤| | | | | |\n| |Appoint_Error_excel5|第{scope}行郵箱地址不能為空| | | | | |\n| |Appoint_visit_qrcode|訪客二維碼| | | | | |\n| |Appoint_time_error|訪問時段不得早於當前| | | | | |\n| |Appoint_import_success|匯入成功!| | | | | |\n| |Appoint_import_fail|匯入失敗!| | | | | |\n| |Appoint_upload_success|照片上傳成功!| | | | | |\n| |Appoint_upload_fail|照片上傳失敗!| | | | | |\n| |Appoint_img_limit|上傳圖片請小於50kb!| | | | | |\n| |Appoint_img_type|請上傳圖片類型檔案(png/jpeg/webp)!| | | | | |\n| |Appoint_resend_success|重寄送邀請信成功!| | | | | |\n| |Appoint_resend_fail|重寄送邀請信失敗!| | | | | |\n|Visitor|Visit_list|訪客紀錄列表| | | | | |\n| |Visit_export|報表匯出| | | | | |\n| |Visit_card|發卡| | | | | |\n| |Visit_card_num|卡片通行證號碼| | | | | |\n| |Visit_type|訪客類型| | | | | |\n| |Visit_reason|訪問事由| | | | | |\n| |Visit_depart|被訪人部門| | | | | |\n| |Visit_visitors|被訪人| | | | | |\n| |Visit_company|訪客公司| | | | | |\n| |Visit_registration|報到時間| | | | | |\n| |Visit_status|訪客狀態| | | | | |\n| |Visit_off|註銷| | | | | |\n| |Visit_off_tip|請確認是否註銷此通行證| | | | | |\n| |Visit_leave|離開時間| | | | | |\n| |Visit_ic|顯示其他外部通行IC卡號| | | | | |\n| |Visit_vcode|顯示訪客通行證二維碼| | | | | |\n| |Visit_pdf|列印PDF| | | | | |\n| |Visit_reservation|預約| | | | | |\n| |Visit_temporary|临时| | | | | |\n| |Visit_arrived|已報到| | | | | |\n| |Visit_leaved|離場| | | | | |\n| |Visit_time_range|訪問時間區間| | | | | |\n| |Visit_status_1|已註冊| | | | | |\n| |Visit_status_20|已報到| | | | | |\n| |Visit_status_60|離場| | | | | |\n| |Visit_status_61|逾時| | | | | |\n| |Visit_loguot_success|註銷成功| | | | | |\n| |Visit_loguot_fail|註銷失敗| | | | | |\n|Overview|Overview_this_day|今日| | | | | |\n| |Overview_this_week|本週| | | | | |\n| |Overview_this_month|本月| | | | | |\n| |Overview_this_year|本年| | | | | |\n| |Overview_no_change_day|今日沒有變化| | | | | |\n| |Overview_no_change_week|本周沒有變化| | | | | |\n| |Overview_no_change_month|本月沒有變化| | | | | |\n| |Overview_no_change_year|本年沒有變化| | | | | |\n| |Overview_Weekday|工作日| | | | | |\n| |Overview_Weekend|週末| | | | | |\n| |Overview_Actual|實際訪客人數| | | | | |\n| |Overview_Scheduled|預約訪客人數| | | | | |\n| |Overview_OnSite|現場登記人數| | | | | |\n| |Overview_Missed|預約未到人數| | | | | |\n| |Overview_trend|訪客人數趨勢圖| | | | | |\n| |Overview_heatmap|訪客熱點圖| | | | | |\n| |Overview_purpose|訪問事由分佈| | | | | |\n| |Overview_average|平均訪客比例圖| | | | | |\n| |Overview_total|加總訪客比例圖| | | | | |\n| |Overview_distribution|訪客週分佈圖| | | | | |\n|Position|Position_list|職務列表| | | | | |\n| |Position_add|新增職務| | | | | |\n| |Position_delete|刪除職務| | | | | |\n| |Position_delete_single|確認刪除該職務：{0}嗎？| | | | | |\n| |Position_name|職務名稱| | | | | |\n| |Position_set|職務設定| | | | | |\n| |Position_permission|職務權限| | | | | |\n|Purpose|Purpose_list|訪問事由| | | | | |\n| |Purpose_add|新增訪問事由| | | | | |\n| |Purpose_edit|編輯訪問事由| | | | | |\n| |Purpose_delete|刪除訪問事由| | | | | |\n| |Purpose_content|訪問事由內容| | | | | |\n| |Purpose_delete_none|請選擇需要刪除的訪問事由！| | | | | |\n| |Purpose_delete_multiple|已選擇{0}個訪問事由，確認刪除這些訪問事由？| | | | | |\n| |Purpose_delete_single|確認要刪除該訪問事由嗎？| | | | | |\n|Registration|Registration_time|可報到時間| | | | | |\n| |Registration_before|預約時間前| | | | | |\n| |Registration_after|預約時間後| | | | | |\n|Recipient|Recipient_list|被訪人列表| | | | | |\n| |Recipient_add|新增被訪人| | | | | |\n| |Recipient_import|匯入被訪人| | | | | |\n| |Recipient_no_excel|Excel文件中沒有符合格式要求的被訪人！| | | | | |\n| |Recipient_import_finish|匯入完成，{0}個被訪人中，匯入成功{1}個！| | | | | |\n| |Recipient_export|匯出被訪人| | | | | |\n| |Recipient_file|被訪人資料表| | | | | |\n| |Recipient_template|被訪人資料表模板| | | | | |\n| |Recipient_select|請選擇需要匯出的被訪人！| | | | | |\n| |Recipient_edit|編輯被訪人| | | | | |\n| |Recipient_delete|刪除被訪人| | | | | |\n| |Recipient_delete_single|確認要刪除該被訪人嗎？| | | | | |\n| |Recipient_id|被訪人ID| | | | | |\n| |Recipient_name|被訪人名稱| | | | | |\n| |Recipient_foreign_name|外文名稱| | | | | |\n| |Recipient_email|信箱| | | | | |\n| |Recipient_phone|電話| | | | | |\n| |Recipient_department|部門| | | | | |\n| |Recipient_s_department|被訪人部門| | | | | |\n| |Recipient_sign|被訪人簽名| | | | | |\n| |Recipient_department_list|部門對照表| | | | | |\n| |Recipient_department_id|部門ID| | | | | |\n| |Recipient_department_name|部門名稱| | | | | |\n| |Recipient_department_code|部門代碼| | | | | |\n| |Recipient_department_refer|（請參考部門對照表）| | | | | |\n| |Recipient_department_note|（請參考部門對照表，填入部門ID）| | | | | |\n|Terminal|Terminal_set|歡迎標題與圖示設定| | | | | |\n| |Terminal_title|歡迎標題| | | | | |\n| |Terminal_sub_title|歡迎副標| | | | | |\n| |Terminal_image|Logo圖示顯示| | | | | |\n| |Terminal_img_limit|請上傳大小小於等於 300 * 160 的圖片| | | | | |\n| |Terminal_display|文字顯示設定| | | | | |\n| |Terminal_font_size|字體大小| | | | | |\n| |Terminal_zoom_0|不放大| | | | | |\n| |Terminal_zoom_1|放大1級| | | | | |\n| |Terminal_zoom_2|放大2級| | | | | |\n| |Terminal_function|功能設定| | | | | |\n| |Terminal_photography|啟用訪客拍照| | | | | |\n| |Terminal_bulletin|啟用訪客公告資訊| | | | | |\n| |Terminal_printing|啟用列印通行證| | | | | |\n|Pass|Pass_list|通行證範本列表| | | | | |\n| |Pass_add|新增通行證| | | | | |\n| |Pass_edit|編輯通行證| | | | | |\n| |Pass_view|檢視通行證| | | | | |\n| |Pass_delete|刪除通行證| | | | | |\n| |Pass_delete_single|確認要刪除該通行證範本嗎？| | | | | |\n| |Pass_template|範本名稱| | | | | |\n| |Pass_name|通行證名稱| | | | | |\n| |Pass_deactivate|停止| | | | | |\n| |Pass_deactivate_single|是否不執行此通行證？| | | | | |\n| |Pass_publish|執行| | | | | |\n| |Pass_publish_single|是否執行此通行證？| | | | | |\n| |Pass_publish_stop|請先停止目前使用中通行證！| | | | | |\n| |Pass_info|通行證範本訊息| | | | | |\n| |Pass_set|通行證設定| | | | | |\n| |Pass_title|通行證標題| | | | | |\n| |Pass_qrcode|是否顯示二維碼| | | | | |\n| |Pass_lang|顯示語言| | | | | |\n| |Pass_word|文字內容編輯| | | | | |\n| |Pass_page|頁面標題| | | | | |\n| |Pass_show|顯示訊息| | | | | |\n| |Pass_fix|固定欄位| | | | | |\n| |Pass_logo|Logo| | | | | |\n| |Pass_printing|列印時間| | | | | |\n| |Pass_qr_code|二維碼| | | | | |\n| |Pass_preview|通行證預覽| | | | | |\n| |Pass_upload|請先上傳 Logo 圖檔！| | | | | |\n|Bulletin|Bulletin_list|訪客公告列表| | | | | |\n| |Bulletin_add|新增公告| | | | | |\n| |Bulletin_edit|編輯公告| | | | | |\n| |Bulletin_view|檢視公告| | | | | |\n| |Bulletin_delete|刪除公告| | | | | |\n| |Bulletin_delete_single|確認要刪除此訪客公告嗎？| | | | | |\n| |Bulletin_name|公告名稱| | | | | |\n| |Bulletin_content|公告內容| | | | | |\n| |Bulletin_deactivate|停止| | | | | |\n| |Bulletin_deactivate_single|是否不執行此訪客公告？| | | | | |\n| |Bulletin_publish|執行| | | | | |\n| |Bulletin_publish_single|是否執行此訪客公告？| | | | | |\n| |Bulletin_publish_stop|請先停止目前使用中訪客公告！| | | | | |\n|Country|Country_Iceland|冰島| | | | | |\n| |Country_Afghanistan|阿富汗| | | | | |\n| |Country_Aland|奧蘭群島| | | | | |\n| |Country_Arab|阿拉伯聯合酋長國| | | | | |\n| |Country_Oman|阿曼| | | | | |\n| |Country_Azerbaijan|亞塞拜然| | | | | |\n| |Country_Estonia|愛沙尼亞| | | | | |\n| |Country_Austria|奧地利| | | | | |\n| |Country_Ireland|愛爾蘭| | | | | |\n| |Country_Bahamas|巴哈馬| | | | | |\n| |Country_Botswana|博茨瓦納| | | | | |\n| |Country_Albania|阿爾巴尼亞| | | | | |\n| |Country_Andorra|安道爾| | | | | |\n| |Country_Antarctica|南極洲| | | | | |\n| |Country_Egypt|埃及| | | | | |\n| |Country_Bouvet|布威島| | | | | |\n| |Country_Algeria|阿爾及利亞| | | | | |\n| |Country_Ethiopia|埃塞俄比亞| | | | | |\n| |Country_Angola|安哥拉| | | | | |\n| |Country_Australia|澳洲| | | | | |\n| |Country_Antigua|安地卡島| | | | | |\n| |Country_Anguilla|安奎拉(英)| | | | | |\n| |Country_Aruba|阿魯巴(荷)| | | | | |\n| |Country_Argentina|阿根廷| | | | | |\n| |Country_Bhutan|不丹| | | | | |\n| |Country_Pakistan|巴基斯坦| | | | | |\n| |Country_Palestine|巴勒斯坦| | | | | |\n| |Country_Bahrain|巴林| | | | | |\n| |Country_Belarus|白俄羅斯| | | | | |\n| |Country_Poland|波蘭| | | | | |\n| |Country_Belgium|比利時| | | | | |\n| |Country_Bulgaria|保加利亞| | | | | |\n| |Country_Bosnia|波士尼亞與赫塞哥維納| | | | | |\n| |Country_Burundi|蒲隆地| | | | | |\n| |Country_Burkina|布吉納法索| | | | | |\n| |Country_Benin|貝南| | | | | |\n| |Country_Papua|巴布亞| | | | | |\n| |Country_Northern|北馬利安納群島| | | | | |\n| |Country_Belize|貝里斯| | | | | |\n| |Country_Panama|巴拿馬| | | | | |\n| |Country_Barbados|巴貝多| | | | | |\n| |Country_Puerto|波多黎各(美)| | | | | |\n| |Country_Bolivia|玻利維亞| | | | | |\n| |Country_Brazil|巴西| | | | | |\n| |Country_Paraguay|巴拉圭| | | | | |\n| |Country_North|北韓| | | | | |\n| |Country_Equatorial|赤道幾內亞共和國| | | | | |\n| |Country_Timor|東帝汶| | | | | |\n| |Country_Denmark|丹麥| | | | | |\n| |Country_Germany|德國| | | | | |\n| |Country_Togo|多哥| | | | | |\n| |Country_Dominican|多米尼加共和國| | | | | |\n| |Country_Dominica|多米尼克| | | | | |\n| |Country_Russia|俄羅斯| | | | | |\n| |Country_Eritrea|厄立特里亞| | | | | |\n| |Country_Ecuador|厄瓜多爾| | | | | |\n| |Country_Philippines|菲律賓| | | | | |\n| |Country_Finland|芬蘭| | | | | |\n| |Country_Faroe|法羅群島(丹)| | | | | |\n| |Country_France|法國| | | | | |\n| |Country_Vatican|梵蒂岡| | | | | |\n| |Country_Cape|佛得角| | | | | |\n| |Country_Fiji|斐濟群島| | | | | |\n| |Country_Polynesia|法屬波利尼西亞| | | | | |\n| |Country_Guiana|法屬圭亞那| | | | | |\n| |Country_Georgia|格魯吉亞| | | | | |\n| |Country_Congo|剛果共和國| | | | | |\n| |Country_Democratic|剛果民主共和國| | | | | |\n| |Country_Gambia|岡比亞| | | | | |\n| |Country_Guam|關島(美)| | | | | |\n| |Country_Greenland|格陵丹(丹)| | | | | |\n| |Country_Costa|哥斯達黎加| | | | | |\n| |Country_Cuba|古巴| | | | | |\n| |Country_Grenada|格林納達| | | | | |\n| |Country_Guadeloupe|瓜德羅普(法)| | | | | |\n| |Country_Columbia|哥倫比亞| | | | | |\n| |Country_Guyana|圭亞那| | | | | |\n| |Country_Korea|韓國| | | | | |\n| |Country_Kazakhstan|哈薩克斯坦| | | | | |\n| |Country_Netherlands|荷蘭| | | | | |\n| |Country_Honduras|洪都拉斯| | | | | |\n| |Country_Haiti|海地| | | | | |\n| |Country_Antilles|荷屬安的列斯| | | | | |\n| |Country_Cambodia|柬埔寨| | | | | |\n| |Country_Kyrgyzstan|吉爾吉斯斯坦| | | | | |\n| |Country_Czech|捷克| | | | | |\n| |Country_Djibouti|吉佈提| | | | | |\n| |Country_Guinea|幾內亞| | | | | |\n| |Country_Bissau|幾內亞比紹| | | | | |\n| |Country_Ghana|加納| | | | | |\n| |Country_Canary|加那利群島(西)| | | | | |\n| |Country_Zimbabwe|津巴布韋| | | | | |\n| |Country_Kiribati|基里巴斯| | | | | |\n| |Country_Canada|加拿大| | | | | |\n| |Country_Qatar|卡塔爾| | | | | |\n| |Country_Kuwait|科威特| | | | | |\n| |Country_Croatia|克羅地亞| | | | | |\n| |Country_Kenya|肯尼亞| | | | | |\n| |Country_Cameroon|客麥隆| | | | | |\n| |Country_Cote|科特迪瓦| | | | | |\n| |Country_Comoros|科摩羅| | | | | |\n| |Country_Cook|庫克群島(新)| | | | | |\n| |Country_Cayman|開曼群島(英)| | | | | |\n| |Country_Bermuda|百慕大(英)| | | | | |\n| |Country_Laos|老撾| | | | | |\n| |Country_Lebanon|黎巴嫩| | | | | |\n| |Country_Lithuania|立陶宛| | | | | |\n| |Country_Liechtenstein|列支敦士登| | | | | |\n| |Country_Luxembourg|盧森堡| | | | | |\n| |Country_Romania|羅馬尼亞| | | | | |\n| |Country_Libya|利比亞| | | | | |\n| |Country_Rwanda|盧旺達| | | | | |\n| |Country_Liberia|利比里亞| | | | | |\n| |Country_Lesotho|萊索托| | | | | |\n| |Country_Reunion|留尼旺(法)| | | | | |\n| |Country_Mongolia|蒙古| | | | | |\n| |Country_Myanmar|緬甸| | | | | |\n| |Country_Malaysia|馬來西亞| | | | | |\n| |Country_Bangladesh|孟加拉國| | | | | |\n| |Country_Maldives|馬爾代夫| | | | | |\n| |Country_Moldova|摩爾多瓦| | | | | |\n| |Country_Monaco|摩納哥| | | | | |\n| |Country_Macedonia|馬其頓| | | | | |\n| |Country_Malta|馬耳他| | | | | |\n| |Country_Morocco|摩洛哥| | | | | |\n| |Country_Madeira|马德拉群岛(葡)| | | | | |\n| |Country_Mauritania|毛里塔尼亚| | | | | |\n| |Country_Mali|马里| | | | | |\n| |Country_Malawi|马拉维| | | | | |\n| |Country_Mozambique|莫桑比克| | | | | |\n| |Country_Madagascar|马达加斯加| | | | | |\n| |Country_Mauritius|毛里求斯| | | | | |\n| |Country_Micronesia|密克羅尼西亞| | | | | |\n| |Country_Marshall|馬紹爾群島| | | | | |\n| |Country_USA|美國| | | | | |\n| |Country_Mexico|墨西哥| | | | | |\n| |Country_Virgin|美屬維爾京群島| | | | | |\n| |Country_Montserrat|蒙特塞拉特(英)| | | | | |\n| |Country_Martinique|馬提尼克(法)| | | | | |\n| |Country_Peru|秘魯| | | | | |\n| |Country_Nepal|尼泊爾| | | | | |\n| |Country_Norway|挪威| | | | | |\n| |Country_Niger|尼日亞| | | | | |\n| |Country_Namibia|納米比亞| | | | | |\n| |Country_Africa|南非| | | | | |\n| |Country_Nauru|瑙魯| | | | | |\n| |Country_Niue|紐埃(新)| | | | | |\n| |Country_Nicaragua|尼加拉瓜| | | | | |\n| |Country_Portugal|葡萄牙| | | | | |\n| |Country_Palau|帕勞| | | | | |\n| |Country_Pitcairn|皮特凱恩島(英)| | | | | |\n| |Country_Japan|日本| | | | | |\n| |Country_Sweden|瑞典| | | | | |\n| |Country_Switzerland|瑞士| | | | | |\n| |Country_Sri|斯里蘭卡| | | | | |\n| |Country_Saudi|沙特阿拉伯| | | | | |\n| |Country_Cyprus|塞浦路斯| | | | | |\n| |Country_Slovakia|斯洛伐克| | | | | |\n| |Country_Serbia|塞爾維亞| | | | | |\n| |Country_Slovenia|斯洛文尼亞| | | | | |\n| |Country_San|聖馬力諾| | | | | |\n| |Country_Sudan|蘇丹| | | | | |\n| |Country_Somalia|索馬里| | | | | |\n| |Country_Seychelles|塞舌爾| | | | | |\n| |Country_Sao|聖多美及普林西比| | | | | |\n| |Country_Senegal|塞內加爾| | | | | |\n| |Country_Sierra|塞拉利昂| | | | | |\n| |Country_Kingdom|斯威士蘭| | | | | |\n| |Country_St|聖赫勒拿(英)| | | | | |\n| |Country_Solomon|所羅門群島| | | | | |\n| |Country_Samoa|薩摩亞| | | | | |\n| |Country_Caledonia|新克里多尼亞(法)| | | | | |\n| |Country_El|薩爾瓦多| | | | | |\n| |Country_Nevis|聖基茨和尼維斯| | | | | |\n| |Country_Grenadines|聖文森特和格林納丁斯| | | | | |\n| |Country_Suriname|蘇里南| | | | | |\n| |Country_Thailand|泰國| | | | | |\n| |Country_Taiwan|台灣| | | | | |\n| |Country_Tajikistan|塔吉克斯坦| | | | | |\n| |Country_Turkmenistan|土庫曼斯坦| | | | | |\n| |Country_Turkey|土耳其| | | | | |\n| |Country_Tunisia|突尼斯| | | | | |\n| |Country_Tanzania|坦桑尼亞| | | | | |\n| |Country_Tuvalu|圖瓦盧| | | | | |\n| |Country_Tonga|湯加| | | | | |\n| |Country_Tokelau|托克勞(新)| | | | | |\n| |Country_Trinidad|特立尼達和多巴哥| | | | | |\n| |Country_Turks|特克斯和凱科斯群島| | | | | |\n| |Country_Brunei|文萊| | | | | |\n| |Country_Uzbekistan|烏茲別克斯坦| | | | | |\n| |Country_Ukraine|烏克蘭| | | | | |\n| |Country_Uganda|烏干達| | | | | |\n| |Country_Vanuatu|瓦努阿圖| | | | | |\n| |Country_Wallis|瓦利斯與富圖納(法)| | | | | |\n| |Country_Guatemala|危地馬拉| | | | | |\n| |Country_Venezuela|委內瑞拉| | | | | |\n| |Country_Uruguay|烏拉圭| | | | | |\n| |Country_Singapore|新加坡| | | | | |\n| |Country_Syria|敘利亞| | | | | |\n| |Country_Hungary|匈牙利| | | | | |\n| |Country_Greece|希臘| | | | | |\n| |Country_Spain|西班牙| | | | | |\n| |Country_Sahara|西撒哈拉| | | | | |\n| |Country_Zealand|新西蘭| | | | | |\n| |Country_Vietnam|越南| | | | | |\n| |Country_WesternIndonesia|印度尼西亞西部| | | | | |\n| |Country_CentralIndonesia|印度尼西亞中部| | | | | |\n| |Country_EasternIndonesia|印度尼西亞東部| | | | | |\n| |Country_India|印度| | | | | |\n| |Country_Iraq|伊拉克| | | | | |\n| |Country_Jordan|約旦| | | | | |\n| |Country_Israel|以色列| | | | | |\n| |Country_Yemen|也門| | | | | |\n| |Country_Armenia|亞美尼亞| | | | | |\n| |Country_UK|英國| | | | | |\n| |Country_Italy|意大利| | | | | |\n| |Country_Azores|亞速爾群島(葡)| | | | | |\n| |Country_Jamaica|牙買加| | | | | |\n| |Country_British|英屬維爾京群島| | | | | |\n| |Country_China|中國| | | | | |\n| |Country_Chad|乍得| | | | | |\n| |Country_Central|中非| | | | | |\n| |Country_Zambia|讚比亞| | | | | |\n| |Country_Chile|智利| | | | | |\n",
  "sys.query": " ",
  "sys.files": [],
  "sys.conversation_id": "36bb1927-0f13-44e0-a2d0-66cf04fc0601",
  "sys.user_id": "test",
  "sys.dialogue_count": 1,
  "sys.app_id": "c2bef78a-b1c9-4322-afd7-f1e540b7a4a6",
  "sys.workflow_id": "8cd2df87-2b33-493a-b4a0-81cfb025d36e",
  "sys.workflow_run_id": "6f991f21-a888-447a-8bf0-7888bce80a88"
}
//#region 处理MD

function main({file_md}) {
  const array = file_md.toString().split(/\n|\\n/).filter(o => !!o?.trim() && o.trim().startsWith('|'))
  const head = array.slice(0, 2)
  const head_arr = String(head[0]).split('|').map(o => o.trim())
  const tw_index = String(head[0]).split('|').findIndex(o => o.trim() === 'zh-TW')
  const length = array.slice(2).length
  const obj = {}
  const obj_list = []
  const phrases = []
  const phrases_index = {}
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
    phrases.push(text)
    if (!phrases_index[text]) phrases_index[text] = []
    phrases_index[text].push(key)
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
  const check_request = JSON.stringify({
    phrases,
  })
  return {
    head,
    obj,
    request_list,
    length,
    check_request,
    phrases_index,
  }
}
//#endregion
//#region 整合数据

function main({body, head, phrases_index, obj}) {
  const head_arr = String(head[0]).split('|').map(o => o.trim())
  const lang_arr = head_arr.filter(o => !!o && !o.startsWith('Main') && !o.startsWith('i18') && !o.startsWith('History'))
  let unprocessed = {}
  let processed = {}
  const result = JSON.parse(String(body))
  const matched = Array.from(result?.matched ?? [])
  const unmatched = Array.from(result?.unmatched ?? [])
  matched.forEach(m => {
    const arr = Array.from(phrases_index[m['o']])
    arr.forEach(index => {
      const list = String(obj['i' + index]).split('|')
      const i18n_key = list[2]
      const func_key = list[1]
      if (!!m?.['t']?.['zh-TW'] && lang_arr.every(lang => Object.keys(Object(m['t'])).includes(String(lang)))) {
        processed[`i${index}`] = ['', func_key, i18n_key].concat(lang_arr.map(o => m['t'][o])).concat(['', '']).join('|')
      } else {
        unprocessed[`i${index}`] = ['', func_key, i18n_key].concat(lang_arr.map(o => {
          const idx = head_arr.findIndex(v => v === o)
          return m['t']?.[o] ?? (list?.[idx] ?? '')
        })).concat(['', '']).join('|')
      }
    })
  })
  unmatched.forEach(m => {
    const arr = Array.from(phrases_index[m['o']])
    arr.forEach(index => {
      const list = String(obj['i' + index]).split('|')
      const i18n_key = list[2]
      const func_key = list[1]
      unprocessed[`i${index}`] = ['', func_key, i18n_key].concat(lang_arr.map(o => {
        const idx = head_arr.findIndex(v => v === o)
        return m?.['t']?.[o] ?? (list?.[idx] ?? '')
      })).concat(['', '']).join('|')
    })
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
