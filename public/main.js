/*
 * @Description: 
 * @Author: cw
 * @LastEditors: cw
 * @Date: 2019-04-03 09:39:30
 * @LastEditTime: 2019-05-06 14:33:15
 */
let sSelectedNetwork=null;
let sNetSelectedNetwork=null;
let sSelectedNation=null;
let sSelectedApp=null;
let sSelectedMode=null;
let sSelectedStMode=null;
let tCurSelectedData = null;
let tNetworkConfig = null;
let tLast30DaysAllData = {};
let bGet30DaysDataOk=false;
let T_WEEK_DAY=
{
    1:"Mon",
    2:"Tue",
    3:"Wed",
    4:"Thu",
    5:"Fri",
    6:"Sat",
    0:"Sun",
}
let T_NATION=
[
    "TW","HK","CN","US","GB","JP","SG","AU","CA","MY","PH","ID","TH","IN"
]

let T_NATION_NAME =
{
    TW:"台湾",HK:"香港",CN:"大陆",US:"美国",GB:"英国",JP:"日本",SG:"新加坡",AU:"澳大利亚",CA:"加拿大",MY:"马来西亚",PH:"菲律宾",ID:"印尼",TH:"泰国",IN:"印度"   
}

let T_COL_ATTRI_NAME ={
   Rev:"收入",Ecpm:"Ecpm",Request:"请求",Fill:"填充",FillRatio:"填充率",Views:"展示",ViewRatio:"展示率",Start:"开始",Finish:"结束",FinishRatio:"完成率",Click:"点击",ClickRatio:"点击率"
}

let T_NETWORKS=[
    "Admob","Facebook"
]

$('#networkTabs').w2tabs({
    name     : 'networkTabs',
    active     : 'tab1',
    tabs    : [
        { id: 'Admob', caption: 'Admob', style: 'border: 1px solid gray' },        
        { id: 'Facebook', caption: 'Facebook', style: 'border: 1px solid gray' },
    ],
    onClick: function (event) {
        var tTabs = w2ui["networkTabs"].tabs;
        w2ui.networkGrid.clear();
        for(let oTab of tTabs){
            if(oTab.id==event.target){
                oTab.style = 'border:2px solid red'
                sSelectedNetwork=event.target;
                DoQueryNetworkData();
            }else{
                oTab.style = 'border:1px solid gray'
            }
        }
        w2ui["networkTabs"].render()
    }
});

$('#netTabs').w2tabs({
    name     : 'netTabs',
    active     : 'Admob',
    tabs    : [
        { id: 'Admob', caption: 'Admob', style: 'border: 1px solid gray' },        
        { id: 'Facebook', caption: 'Facebook', style: 'border: 1px solid gray' },
    ],
    onClick: function (event) {
        var tTabs = w2ui["netTabs"].tabs;
        w2ui.networkGrid.clear();
        for(let oTab of tTabs){
            if(oTab.id==event.target){
                oTab.style = 'border:2px solid red'
                sNetSelectedNetwork=event.target;
                UpdateShowedNetworkData();
            }else{
                oTab.style = 'border:1px solid gray'
            }
        }
        w2ui["netTabs"].render()
    }
});

$('#statisticsTabs').w2tabs({
    name     : 'statisticsTabs',
    active     : 'tab1',
    tabs    : [
        { id: 'st_all',         caption: '回收总览', style: 'border: 1px solid gray' },
        { id: 'st_nation',      caption: '国家收入', style: 'border: 1px solid gray' },
        // { id: 'st_platform',    caption: '平台汇总', style: 'border: 1px solid gray' },
        // { id: 'st_network',     caption: '渠道汇总', style: 'border: 1px solid gray' },
    ],
    onClick: function (event) {
        var tTabs = w2ui["statisticsTabs"].tabs;
        for(let oTab of tTabs){
            if(oTab.id==event.target){
                oTab.style = 'border:2px solid red'
                sSelectedStMode=oTab.id;
                if(oTab.id == "st_all"){
                    DoDataFilterAndFillToRevenueGrid();
                }else if(oTab.id=="st_nation"){
                    DoDataFilterNationAndFillToRevenueGrid();
                }
            }else{
                oTab.style = 'border:1px solid gray'
            }
        }
        w2ui["statisticsTabs"].render()
    }
});

$('#query_form').w2form({ 
    name:  'query_form',
    url:   "query_form",
    msgSaving:"Querying...",
    fields : [
    ],
    actions: {
        submit:function (sType,sDate) {
            this.submit({Type:sType,Date:sDate},(tRet)=>{
                if(tRet.err){
                    console.log(tRet.err);
                }else{
                    // window.location.href="/main";
                }
            });
        }
    }
});

$('#networkToolBar').w2toolbar({
    name : 'networkToolBar',
    items: [
        { type: 'break' },
        { type: 'menu',   id: 'Platform', caption: 'All-Platform', img: 'icon-search-down',
            items: [
                { text: "All-Platform", img: 'icon-page' },
                { text: "Android", img: 'icon-page' },
                { text: "IOS", img: 'icon-page' },
            ]},
        { type: 'break' },
        { type: 'menu',   id: 'Nation', caption: 'All-Nation', img: 'icon-search-down', 
            items: [
                { text: "All-Nation", img: 'icon-page' },
                { text: "CN-大陆", img: 'icon-page' },
                { text: "TW-台湾", img: 'icon-page' },
                { text: "HK-香港", img: 'icon-page' },
                { text: "SG-新加坡", img: 'icon-page' },
                { text: "MY-马来", img: 'icon-page' },
                { text: "US-美国", img: 'icon-page' },
                { text: "GB-英国", img: 'icon-page' },
                { text: "AU-澳洲", img: 'icon-page' },
                { text: "CA-加拿大", img: 'icon-page' },
                { text: "JP-日本", img: 'icon-page' },
            ]
        },
        { type: 'break' },
        { type: 'menu',   id: 'Date', caption: moment().subtract(1,"day").format("YYYY-MM-DD"), img: 'icon-search-down',items: []},
        { type: 'break' },
        { type: 'menu',   id: 'AdUnit', caption: 'All-Type', img: 'icon-search-down',
            items: [
                { text: "All-Type", img: 'icon-page' },
                { text: "RewardVideo-视频", img: 'icon-page' },
                { text: "Interstitial-插屏", img: 'icon-page' },
                { text: "Banner-横幅", img: 'icon-page' },
                { text: "Medium-中矩形", img: 'icon-page' },
            ]},
        { type: 'break' },    
    ]
});

// $('#netToolBar').w2toolbar({
//     name : 'netToolBar',
//     items: [
//         { type: 'break' },    
//         { type: 'menu',   id: 'AdUnit', caption: 'All-Type', img: 'icon-search-down',
//             items: [
//                 { text: "All-Type", img: 'icon-page' },
//                 { text: "RewardVideo-视频", img: 'icon-page' },
//                 { text: "Interstitial-插屏", img: 'icon-page' },
//                 { text: "Banner-横幅", img: 'icon-page' },
//                 { text: "Medium-中矩形", img: 'icon-page' },
//             ]},
//         { type: 'break' },    
//     ]
// });


let tNationTabs = [];
tNationTabs.push({ id: "ALL", caption: "总览", style: 'border: 1px solid gray' });
for(let sNation of T_NATION){
    tNationTabs.push({ id: sNation, caption: sNation+"_"+T_NATION_NAME[sNation], style: 'border: 1px solid gray' });
}

$('#nationTabs').w2tabs({
    name     : 'nationTabs',
    active     : 'TW',
    tabs    : tNationTabs,
    onClick: function (event) {
        var tTabs = w2ui["nationTabs"].tabs;
        for(let oTab of tTabs){
            if(oTab.id==event.target){
                oTab.style = 'border:2px solid red'
                sSelectedNation=event.target;
                UpdateShowedNetworkData();
            }else{
                oTab.style = 'border:1px solid gray'
            }
        }
        w2ui["nationTabs"].render()
    }
});

let oDate = moment().subtract(31,"day");
for(let i=0;i<30;i++){
    let sDay = oDate.add(1,"day").format("YYYY-MM-DD");
    w2ui.networkToolBar.get("Date").items.push({ text: sDay, img: 'icon-page' });
}

w2ui.networkToolBar.on('click', function(event) {
    let sSelect = event.target;
    if(sSelect == "Platform" || sSelect == "Nation" || sSelect == "Date" || sSelect == "AdUnit"){
        return;
    }
    let tToken = sSelect.split(':');
    w2ui.networkToolBar.get(tToken[0]).text=tToken[1];
    w2ui.networkToolBar.get(tToken[0]).caption=tToken[1];
    w2ui.networkToolBar.render();   
    if(tToken[0] == "Platform"){
        DoDataFilterAndFillToNetworkGrid();
    }else if(tToken[0] == "Nation"){
        DoDataFilterAndFillToNetworkGrid();
    }else if(tToken[0] == "Date"){
        w2ui.networkGrid.clear();
        w2ui.networkGrid.render();
        DoQueryNetworkData();
    }else if(tToken[0]=="AdUnit"){
        DoDataFilterAndFillToNetworkGrid();
    }
});


// $('#exportToolBar').w2toolbar({
//     name : 'exportToolBar',
//     items: [
//         { type: 'break' },
//         { type: 'menu',   id: 'Export', caption: '导出数据', img: 'icon-search-down',
//             items: [
//                 { id:"export_all", text: "导出数据", img: 'icon-page' },
//             ]},
//         { type: 'break' },
//     ],
//     onClick: function (event) {
//         let tToken = event.target.split(':');
//         if(!tToken[0]){
//             return;
//         }
//         let sOp = tToken[1];
//         if(sOp == "export_all" ){
//             ExportAllDatas();
//         }
//     }
// })

$('#networkGrid').w2grid({ 
    name   : 'networkGrid', 
    columns: [                
    ],
    records: [
    ],
    onCopy: function(event) {
        let sText = event.text;
        let tToken = sText.split('\n');
        if(tToken[1]){
            let sCopyStr = ""
            for(let idx in tToken){
                if(idx>0){
                    sCopyStr+=tToken[idx]+"\n";
                }
            }
            event.text=sCopyStr;
        }
    } 
});

$('#netGrid').w2grid({ 
    name   : 'netGrid', 
    columns: [                
    ],
    records: [
    ],
    onCopy: function(event) {
        let sText = event.text;
        let tToken = sText.split('\n');
        if(tToken[1]){
            let sCopyStr = ""
            for(let idx in tToken){
                if(idx>0){
                    sCopyStr+=tToken[idx]+"\n";
                }
            }
            event.text=sCopyStr;
        }
    }  
});

$('#statisticsGrid').w2grid({ 
    name   : 'statisticsGrid', 
    columns: [                
    ],
    records: [
    ]
});

$('#sidebar').w2sidebar({
    name: 'sidebar',
    nodes: [
        { id: 'data-', text: '变现报告', img: 'icon-folder', expanded: true, group: true, nodes: []},
        { id: 'config-', text: '配置管理', img: 'icon-folder', expanded: false, group: true,nodes: []}
    ],
    onClick: function (event) {
        let tToken = event.target.split('-');
        if(!tToken[0]){
            return;
        }
        if(tToken[0]=="data"){
            sSelectedMode=tToken[0];
            sSelectedApp=tToken[1];
            if(sSelectedStMode=="st_nation"){
                DoDataFilterNationAndFillToRevenueGrid();
            }else if(sSelectedStMode=="st_all"){
                DoDataFilterAndFillToRevenueGrid();
            }
            DoDataFilterAndFillToNetworkGrid();
            UpdateShowedNetworkData();
        }
    }
});

function DoQueryAppConfigData(){
    w2ui.query_form.submit({Type:"app_list",Date:""},(tRet)=>{
        if(tRet.status=="success"){
            let tData = tRet.data;
            tNetworkConfig=tData;
            for(let sAppId in tData){
                let tApp = tData[sAppId]
                if(tApp){
                    w2ui.sidebar.add('data-',{ id: 'data-'+sAppId, text: tApp.Name, icon: 'fa-star-empty' });
                    w2ui.sidebar.add('config-',{ id: 'config-'+sAppId, text: tApp.Name, icon: 'fa-star-empty' });
                }
            }
            w2ui.sidebar.render();
            DoQueryLast30DaysData();
        }
    });
}

function DoQueryNetworkData(){
    if(sSelectedNetwork==null){
        return;
    }
    let sDate = w2ui.networkToolBar.get("Date").caption; 
    let tOptions = 
    {
        url:"/query_network_data", 
        method: 'POST', 
        headers: { 
            'Content-Type': 'application/json',
            'Accept':'application/json'
        }
    };
    DoRequestAsync(tOptions,{Type:sSelectedNetwork,Date:sDate},(tRet)=>{
        if(tRet["status"]=="success"){
            tCurSelectedData=tRet.data;
            DoDataFilterAndFillToNetworkGrid();
        }
    });
}

async function DoQueryLast30DaysData(){
    tLast30DaysAllData={};
    let oDate = moment();
    bGet30DaysDataOk=false;
    let nCount = 0;
    let tOptions = 
    {
        url:"/query_data", 
        method: 'POST', 
        headers: { 
            'Content-Type': 'application/json',
            'Accept':'application/json'
        }
    };
    for(let i=0;i<30;i++){
        let sDate = oDate.subtract(1,"day").format("YYYY-MM-DD");
        DoRequestAsync(tOptions,{Date:sDate},(tData)=>{
            if(tData.status=="success"){
                tLast30DaysAllData[sDate]=tData.data;
                nCount++;
                if(nCount>=30){
                    bGet30DaysDataOk=true;
                    console.log(tLast30DaysAllData);
                }
            }
        });
    }
}

function FillDataToGrid(tData,oGrid){
    oGrid.clear();
    oGrid.columns =
    [
        { field: 'recid', caption: 'recid', size: '80px', sortable: true, attr: 'align=center' },
        // { field: 'DATE', caption: 'DATE', size: '140px', sortable: true, resizable: true  },
        // { field: 'APP_ID', caption: 'APP_ID', size: '350px', sortable: true, resizable: true  },
        { field: 'PLATFORM', caption: '平台', size: '80px', sortable: true, resizable: true  },
        { field: 'COUNTRY', caption: '国家', size: '80px', sortable: true, resizable: true  },
        { field: 'REQUEST', caption: '请求', size: '80px', sortable: true, resizable: true  },
        { field: 'AVALABLE', caption: '成功', size: '80px', sortable: true, resizable: true  },
        { field: 'REVENUE', caption: '收入', size: '80px', sortable: true, resizable: true  },
        { field: 'ECPM', caption: 'ECPM', size: '80px', sortable: true, resizable: true  },
        { field: 'VIEWS', caption: '观看', size: '80px', sortable: true, resizable: true  },
        { field: 'COMPLETES', caption: '完成', size: '80px', sortable: true, resizable: true  },            
        { field: 'CLICKED', caption: '点击', size: '80px', sortable: true, resizable: true  },
    ];
    let nIdx = 1;
    for(let tLineData of tData){
        tLineData.recid = nIdx;
        tLineData.REVENUE=parseFloat(tLineData.REVENUE);
        tLineData.VIEWS=parseInt(tLineData.VIEWS);
        tLineData.REQUEST=parseInt(tLineData.REQUEST);
        tLineData.AVALABLE=parseInt(tLineData.AVALABLE);
        tLineData.CLICKED=parseInt(tLineData.CLICKED);
        tLineData.COMPLETES=parseInt(tLineData.COMPLETES);
        tLineData.ECPM=parseFloat(tLineData.ECPM);
        oGrid.records.push(tLineData);
        ++nIdx;
    }
    oGrid.render();
    oGrid.sort('recid', 'asc');
}

function DoDataFilterAndFillToRevenueGrid(){
    if(!bGet30DaysDataOk){
        return;
    }
    let oGrid = w2ui.statisticsGrid;
    oGrid.clear();
    oGrid.columns =
    [
        { field: 'recid', caption: '日期', size: '90px', sortable: true, attr: 'align=center', frozen:true },
        // { field: 'DATE', caption: 'DATE', size: '140px', sortable: true, resizable: true  },
        // { field: 'APP_ID', caption: 'APP_ID', size: '350px', sortable: true, resizable: true  },
        { field: 'weekday', caption: '星期', size: '50px', sortable: true, resizable: true, frozen:true  },
        { field: 'Android_Admob_Rev', caption: 'A_A收', size: '60px', sortable: true, resizable: true, style:'border: 3px solid #FF9999;border-bottom-style: none;border-top-style: none;border-right-style: none;' },
        { field: 'Android_Admob_ECPM', caption: 'A_Acpm', size: '70px', sortable: true, resizable: true  },
        { field: 'Android_Admob_Request', caption: 'A_A请', size: '60px', sortable: true, resizable: true  },
        { field: 'Android_Admob_View', caption: 'A_A匹', size: '60px', sortable: true, resizable: true  },
        { field: 'Android_Admob_Ratio', caption: 'A_A匹', size: '60px', sortable: true, resizable: true},
        
        { field: 'IOS_Admob_Rev', caption: 'I_A收', size: '60px', sortable: true, resizable: true, style:'border: 2px solid #FF9999;border-bottom-style: none;border-top-style: none;border-right-style: none;' },
        { field: 'IOS_Admob_ECPM', caption: 'I_Acpm', size: '70px', sortable: true, resizable: true  },
        { field: 'IOS_Admob_Request', caption: 'I_A请', size: '60px', sortable: true, resizable: true  },
        { field: 'IOS_Admob_View', caption: 'I_A匹', size: '60px', sortable: true, resizable: true  },
        { field: 'IOS_Admob_Ratio', caption: 'I_A率', size: '60px', sortable: true, resizable: true, style:'border: 3px solid #FF9999;border-bottom-style: none;border-top-style: none;border-left-style: none;'  },
        
        { field: 'Android_Facebook_Rev', caption: 'A_F收', size: '60px', sortable: true, resizable: true  },
        { field: 'Android_Facebook_ECPM', caption: 'A_Fcpm', size: '70px', sortable: true, resizable: true  },
        { field: 'Android_Facebook_Request', caption: 'A_F请', size: '60px', sortable: true, resizable: true  },
        { field: 'Android_Facebook_Fill', caption: 'A_F填', size: '60px', sortable: true, resizable: true  },
        { field: 'Android_Facebook_FillRatio', caption: 'A_F率', size: '60px', sortable: true, resizable: true  },
        { field: 'Android_Facebook_View', caption: 'A_F展', size: '60px', sortable: true, resizable: true  },
        { field: 'Android_Facebook_ViewRatio', caption: 'A_F率', size: '60px', sortable: true, resizable: true  },
        { field: 'Android_Facebook_Clicked', caption: 'A_F点', size: '60px', sortable: true, resizable: true  },
        { field: 'Android_Facebook_ClickRatio', caption: 'A_F率', size: '60px', sortable: true, resizable: true  },

        { field: 'IOS_Facebook_Rev', caption: 'I_F收', size: '60px', sortable: true, resizable: true, style:'border: 2px solid #385899;border-bottom-style: none;border-top-style: none;border-right-style: none;'  },
        { field: 'IOS_Facebook_ECPM', caption: 'I_Fcpm', size: '70px', sortable: true, resizable: true  },
        { field: 'IOS_Facebook_Request', caption: 'I_F请', size: '60px', sortable: true, resizable: true  },
        { field: 'IOS_Facebook_Fill', caption: 'I_F填', size: '60px', sortable: true, resizable: true  },
        { field: 'IOS_Facebook_FillRatio', caption: 'I_F率', size: '60px', sortable: true, resizable: true  },
        { field: 'IOS_Facebook_View', caption: 'I_F展', size: '60px', sortable: true, resizable: true  },
        { field: 'IOS_Facebook_ViewRatio', caption: 'I_F率', size: '60px', sortable: true, resizable: true  },
        { field: 'IOS_Facebook_Clicked', caption: 'I_F点', size: '60px', sortable: true, resizable: true  },
        { field: 'IOS_Facebook_ClickRatio', caption: 'I_F率', size: '60px', sortable: true, resizable: true, style:'border: 3px solid #385899;border-bottom-style: none;border-top-style: none;border-left-style: none;'   },
        
        { field: 'Android_Mopub_Rev', caption: 'A_M收', size: '60px', sortable: true, resizable: true  },
        { field: 'Android_Mopub_ECPM', caption: 'A_Mcpm', size: '70px', sortable: true, resizable: true  },
        { field: 'Android_Mopub_View', caption: 'A_M展', size: '60px', sortable: true, resizable: true  },
        { field: 'Android_Mopub_Clicked', caption: 'A_M点', size: '60px', sortable: true, resizable: true  },
        { field: 'Android_Mopub_Ratio', caption: 'A_M率', size: '60px', sortable: true, resizable: true  },
    ];
    for(let sDate in tLast30DaysAllData){
        let tDateData = tLast30DaysAllData[sDate];
        if(tDateData){
            let tLineData = {}
            tLineData.recid = sDate;
            let nWeekDay=moment(sDate,"YYYY-MM-DD").weekday();
            tLineData.weekday = T_WEEK_DAY[nWeekDay];
            oGrid.records.push(tLineData);
            let tAdmobAdsDateData = GetDateAdsTypeData("Admob",tDateData);
            tLineData.Android_Admob_ECPM = 0
            if(tAdmobAdsDateData.Android.VIEWS >0 ){
                tLineData.Android_Admob_ECPM =((tAdmobAdsDateData.Android.REVENUE/tAdmobAdsDateData.Android.VIEWS)*1000).toFixed(2);
            }
            tLineData.Android_Admob_Rev = parseFloat((tAdmobAdsDateData.Android.REVENUE).toFixed(2));
            tLineData.Android_Admob_Request = tAdmobAdsDateData.Android.REQUEST;
            tLineData.Android_Admob_View = tAdmobAdsDateData.Android.VIEWS;
            tLineData.Android_Admob_Clicked = tAdmobAdsDateData.Android.CLICKED;
            if(tAdmobAdsDateData.Android.VIEWS>0){
                tLineData.Android_Admob_Ratio=((tAdmobAdsDateData.Android.CLICKED/tAdmobAdsDateData.Android.VIEWS)*100).toFixed(2)+"%";
            }else{
                tLineData.Android_Admob_Ratio="----";
            }

            tLineData.IOS_Admob_ECPM = 0;
            if(tAdmobAdsDateData.IOS.VIEWS >0 ){
                tLineData.IOS_Admob_ECPM = parseFloat(((tAdmobAdsDateData.IOS.REVENUE/tAdmobAdsDateData.IOS.VIEWS)*1000).toFixed(2));
            }
            tLineData.IOS_Admob_Request = tAdmobAdsDateData.IOS.REQUEST;
            tLineData.IOS_Admob_Rev = parseFloat((tAdmobAdsDateData.IOS.REVENUE).toFixed(2));
            tLineData.IOS_Admob_View = tAdmobAdsDateData.IOS.VIEWS;
            tLineData.IOS_Admob_Clicked = tAdmobAdsDateData.IOS.CLICKED;
            if(tAdmobAdsDateData.IOS.VIEWS>0){
                tLineData.IOS_Admob_Ratio=((tAdmobAdsDateData.IOS.CLICKED/tAdmobAdsDateData.IOS.VIEWS)*100).toFixed(2)+"%";
            }else{
                tLineData.IOS_Admob_Ratio="----";
            }
           
            let tFacebookDateData = GetDateAdsTypeData("Facebook",tDateData);
            tLineData.Android_Facebook_ECPM = 0
            if(tFacebookDateData.Android.VIEWS >0 ){
                tLineData.Android_Facebook_ECPM =((tFacebookDateData.Android.REVENUE/tFacebookDateData.Android.VIEWS)*1000).toFixed(2);
            }
            tLineData.Android_Facebook_Request = tFacebookDateData.Android.REQUEST;
            tLineData.Android_Facebook_Fill=tFacebookDateData.Android.AVALABLE;
            if(tFacebookDateData.Android.REQUEST>0){
                tLineData.Android_Facebook_FillRatio=((tFacebookDateData.Android.AVALABLE/tFacebookDateData.Android.REQUEST)*100).toFixed(2)+"%";
            }else{
                tLineData.Android_Facebook_FillRatio="----"
            }
            if(tFacebookDateData.Android.AVALABLE>0){
                tLineData.Android_Facebook_ViewRatio=((tFacebookDateData.Android.VIEWS/tFacebookDateData.Android.AVALABLE)*100).toFixed(2)+"%";
            }else{
                tLineData.Android_Facebook_ViewRatio="----"
            }
            if(tFacebookDateData.Android.VIEWS>0){
                tLineData.Android_Facebook_ClickRatio=((tFacebookDateData.Android.CLICKED/tFacebookDateData.Android.VIEWS)*100).toFixed(2)+"%";
            }else{
                tLineData.Android_Facebook_ClickRatio="----"
            }
            tLineData.Android_Facebook_Rev = parseFloat((tFacebookDateData.Android.REVENUE).toFixed(2));
            tLineData.Android_Facebook_View = tFacebookDateData.Android.VIEWS;
            tLineData.Android_Facebook_Clicked = tFacebookDateData.Android.CLICKED;
            if(tFacebookDateData.Android.VIEWS>0){
                tLineData.Android_Facebook_Ratio=((tFacebookDateData.Android.CLICKED/tFacebookDateData.Android.VIEWS)*100).toFixed(2)+"%";
            }else{
                tLineData.Android_Facebook_Ratio="----";
            }

            if(tFacebookDateData.IOS.VIEWS >0 ){
                tLineData.IOS_Facebook_ECPM =((tFacebookDateData.IOS.REVENUE/tFacebookDateData.IOS.VIEWS)*1000).toFixed(2);
            }
            tLineData.IOS_Facebook_Request = tFacebookDateData.IOS.REQUEST;
            tLineData.IOS_Facebook_Fill=tFacebookDateData.IOS.AVALABLE;
            if(tFacebookDateData.IOS.REQUEST>0){
                tLineData.IOS_Facebook_FillRatio=((tFacebookDateData.IOS.AVALABLE/tFacebookDateData.IOS.REQUEST)*100).toFixed(2)+"%";
            }else{
                tLineData.IOS_Facebook_FillRatio="----"
            }
            if(tFacebookDateData.IOS.AVALABLE>0){
                tLineData.IOS_Facebook_ViewRatio=((tFacebookDateData.IOS.VIEWS/tFacebookDateData.IOS.AVALABLE)*100).toFixed(2)+"%";
            }else{
                tLineData.IOS_Facebook_ViewRatio="----"
            }
            if(tFacebookDateData.IOS.VIEWS>0){
                tLineData.IOS_Facebook_ClickRatio=((tFacebookDateData.IOS.CLICKED/tFacebookDateData.IOS.VIEWS)*100).toFixed(2)+"%";
            }else{
                tLineData.IOS_Facebook_ClickRatio="----"
            }
            tLineData.IOS_Facebook_Rev = parseFloat((tFacebookDateData.IOS.REVENUE).toFixed(2));
            tLineData.IOS_Facebook_View = tFacebookDateData.IOS.VIEWS;
            tLineData.IOS_Facebook_Clicked = tFacebookDateData.IOS.CLICKED;
            if(tFacebookDateData.IOS.VIEWS>0){
                tLineData.IOS_Facebook_Ratio=((tFacebookDateData.IOS.CLICKED/tFacebookDateData.IOS.VIEWS)*100).toFixed(2)+"%";
            }else{
                tLineData.IOS_Facebook_Ratio="----";
            }
        }
    }
    oGrid.render();   
    oGrid.sort('recid', 'asc');
}

function GetDateAdsTypeData(sAdsType,tDateData){
    let sFilterApp = sSelectedApp;
    if(!sFilterApp){
        return;
    }
    let tAppConf = tNetworkConfig[sFilterApp];
    if(!tAppConf){
        return;
    }
    let tAllRevData = {Android:{REQUEST:0,AVALABLE:0,COMPLETES:0,VIEWS:0,REVENUE:0,CLICKED:0},
                        IOS:{REQUEST:0,AVALABLE:0,COMPLETES:0,VIEWS:0,REVENUE:0,CLICKED:0}}
    let tAppNetworkConfig = tAppConf[sAdsType];
    if(tAppNetworkConfig){
        for(let sAppId in tDateData[sAdsType]){
            if(tDateData[sAdsType]){
                let tAppData = tDateData[sAdsType][sAppId];
                let sPlatFormStr = null;
                if(sAppId.toString() == tAppNetworkConfig["Android"]){
                    sPlatFormStr="Android"
                }else if(sAppId.toString() == tAppNetworkConfig["IOS"]){
                    sPlatFormStr="IOS";
                }
                if(sPlatFormStr){
                    let tRevenueData = {REQUEST:0,AVALABLE:0,COMPLETES:0,VIEWS:0,REVENUE:0,CLICKED:0}
                    for(let sNationStr in tAppData){
                        let tNationData = tAppData[sNationStr];
                        for(let sAdUnit in tNationData){
                            let tAdUnitData = tNationData[sAdUnit];
                            tRevenueData.REQUEST += parseInt(tAdUnitData.REQUEST);
                            tRevenueData.AVALABLE += parseInt(tAdUnitData.AVALABLE);
                            tRevenueData.COMPLETES += parseInt(tAdUnitData.COMPLETES);
                            tRevenueData.CLICKED += parseInt(tAdUnitData.CLICKED);
                            tRevenueData.VIEWS += parseInt(tAdUnitData.VIEWS);
                            tRevenueData.REVENUE += parseFloat(tAdUnitData.REVENUE);
                        }
                    }
                    tAllRevData[sPlatFormStr] = tRevenueData;
                }
            }
        }
    }
    return tAllRevData;
}

function GetDateAdsNationData(tDateData)
{
    let sFilterApp = sSelectedApp;
    if(!sFilterApp){
        return;
    }
    let tAppConf = tNetworkConfig[sFilterApp];
    if(!tAppConf){
        return;
    }
    let tAllRevData = {}
    for(let sNation of T_NATION){
        tAllRevData[sNation] = {Android:{REQUEST:0,AVALABLE:0,COMPLETES:0,VIEWS:0,REVENUE:0,CLICKED:0},
                                IOS:{REQUEST:0,AVALABLE:0,COMPLETES:0,VIEWS:0,REVENUE:0,CLICKED:0}}
    }
    for(let sAdsType of T_NETWORKS){
        let tAppNetworkConfig = tAppConf[sAdsType];
        if(tAppNetworkConfig){
            let tPlatformRevData = {Android:{REQUEST:0,AVALABLE:0,COMPLETES:0,VIEWS:0,REVENUE:0,CLICKED:0},
                                    IOS:{REQUEST:0,AVALABLE:0,COMPLETES:0,VIEWS:0,REVENUE:0,CLICKED:0}}
            for(let sAppId in tDateData[sAdsType]){
                let tAppData = tDateData[sAdsType][sAppId];
                let sPlatFormStr = null;
                if(sAppId.toString() == tAppNetworkConfig["Android"]){
                    sPlatFormStr="Android"
                }else if(sAppId.toString() == tAppNetworkConfig["IOS"]){
                    sPlatFormStr="IOS";
                }
                if(sPlatFormStr){
                    for(let sNationStr in tAppData){
                        if(tAllRevData[sNationStr] && tAllRevData[sNationStr][sPlatFormStr]){
                            let tRevenueData = tAllRevData[sNationStr][sPlatFormStr];
                            let tNationData = tAppData[sNationStr];
                            for(let sAdUnit in tNationData){
                                let tAdUnitData = tNationData[sAdUnit];
                                tRevenueData.REQUEST += parseInt(tAdUnitData.REQUEST);
                                tRevenueData.AVALABLE += parseInt(tAdUnitData.AVALABLE);
                                tRevenueData.COMPLETES += parseInt(tAdUnitData.COMPLETES);
                                tRevenueData.CLICKED += parseInt(tAdUnitData.CLICKED);
                                tRevenueData.VIEWS += parseInt(tAdUnitData.VIEWS);
                                tRevenueData.REVENUE += parseFloat(tAdUnitData.REVENUE);
                            }
                        }
                    }
                }
            }
        }
    }
    return tAllRevData;
}

function GetDateAdsTypeNationData(sAdsType,sNation,sAdUnit,tDateData){
    let sFilterApp = sSelectedApp;
    if(!sFilterApp){
        return;
    }
    let tAppConf = tNetworkConfig[sFilterApp];
    if(!tAppConf){
        return;
    }
    let tAllRevData = {Android:{REQUEST:0,AVALABLE:0,COMPLETES:0,VIEWS:0,REVENUE:0,CLICKED:0},
                        IOS:{REQUEST:0,AVALABLE:0,COMPLETES:0,VIEWS:0,REVENUE:0,CLICKED:0}}
    let tAppNetworkConfig = tAppConf[sAdsType];
    let tAdUnits = tAppNetworkConfig[sAdUnit];
    let tAdUnitsMap = {};
    for(let sUnitId of tAdUnits){
        tAdUnitsMap[sUnitId.replace('/',':')]=true;
    }
    for(let sAppId in tDateData[sAdsType]){
        let tAppData = tDateData[sAdsType][sAppId];
        let sPlatFormStr = null;
        if(sAppId.toString() == tAppNetworkConfig["Android"]){
            sPlatFormStr="Android"
        }else if(sAppId.toString() == tAppNetworkConfig["IOS"]){
            sPlatFormStr="IOS";
        }
        if(sPlatFormStr){
            let tRevenueData = {REQUEST:0,AVALABLE:0,COMPLETES:0,VIEWS:0,REVENUE:0,CLICKED:0}
            for(let sNationStr in tAppData){
                if(sNation=="ALL"||sNation==sNationStr){
                    let tNationData = tAppData[sNationStr];
                    for(let sAdUnitId in tNationData){
                        if(tAdUnitsMap[sAdUnitId.toString()]){
                            let tAdUnitData = tNationData[sAdUnitId];
                            tRevenueData.REQUEST += parseInt(tAdUnitData.REQUEST);
                            tRevenueData.AVALABLE += parseInt(tAdUnitData.AVALABLE);
                            tRevenueData.COMPLETES += parseInt(tAdUnitData.COMPLETES);
                            tRevenueData.CLICKED += parseInt(tAdUnitData.CLICKED);
                            tRevenueData.VIEWS += parseInt(tAdUnitData.VIEWS);
                            tRevenueData.REVENUE += parseFloat(tAdUnitData.REVENUE);
                        }
                    }
                }
            }
            tAllRevData[sPlatFormStr] = tRevenueData;
        }
    }
    return tAllRevData;
}

function DoDataFilterAndFillToNetworkGrid(){
    let sFilterApp = sSelectedApp;
    let sFilterNetwork = sSelectedNetwork;
    if(!sFilterNetwork ||!sFilterApp ){
        return;
    }
    let sFilterPlatform = w2ui.networkToolBar.get("Platform").caption;
    let sFilterNation = w2ui.networkToolBar.get("Nation").caption;
    let sFilterAdUnit = w2ui.networkToolBar.get("AdUnit").caption;
    let tAppConf = tNetworkConfig[sFilterApp];
    if(!tAppConf){
        return;
    }
    let tFilteredData = [];
    let tAppNetworkConfig = tAppConf[sFilterNetwork];
    if(!tAppNetworkConfig){
        return;
    }
    sFilterNation = sFilterNation.split('-')[0];
    for(let sAppId in tCurSelectedData){
        let tAppData = tCurSelectedData[sAppId];
        let sPlatFormStr = null;
        if(sAppId.toString() == tAppNetworkConfig["Android"]){
            sPlatFormStr="Android"
        }else if(sAppId.toString() == tAppNetworkConfig["IOS"]){
            sPlatFormStr="IOS";
        }
        if(sPlatFormStr!=null && (sFilterPlatform=="All-Platform" || sFilterPlatform == sPlatFormStr) ){
            for(let sNationStr in tAppData){
                if(sFilterNation == "All" || sNationStr==sFilterNation){
                    let tNationData = tAppData[sNationStr];
                    let tRevenueData = {REQUEST:0,AVALABLE:0,COMPLETES:0,VIEWS:0,REVENUE:0,CLICKED:0}
                    for(let sAdUnit in tNationData){
                        let tAdUnitData = tNationData[sAdUnit];
                        tRevenueData.REQUEST += parseInt(tAdUnitData.REQUEST);
                        tRevenueData.AVALABLE += parseInt(tAdUnitData.AVALABLE);
                        tRevenueData.COMPLETES += parseInt(tAdUnitData.COMPLETES);
                        tRevenueData.CLICKED += parseInt(tAdUnitData.CLICKED);
                        tRevenueData.VIEWS += parseInt(tAdUnitData.VIEWS);
                        tRevenueData.REVENUE += parseFloat(tAdUnitData.REVENUE);
                    }
                    let tViewData = {
                        PLATFORM:sPlatFormStr,
                        COUNTRY:sNationStr,
                        REQUEST:tRevenueData.REQUEST,
                        AVALABLE:tRevenueData.AVALABLE,
                        VIEWS:tRevenueData.VIEWS,
                        CLICKED:tRevenueData.CLICKED,
                        COMPLETES:tRevenueData.COMPLETES,
                        REVENUE:tRevenueData.REVENUE.toFixed(2),
                        ECPM:0
                    };
                    if(tRevenueData.VIEWS>0){
                        tViewData.ECPM=((tRevenueData.REVENUE/tRevenueData.VIEWS)*1000).toFixed(2);
                    }
                    tFilteredData.push(tViewData);
               }
            }
        }
    }
    FillDataToGrid(tFilteredData,w2ui.networkGrid);
}

function unicode2Chr(str) {
    return unescape(str.replace(/\\/g, "%"))
}

function DoRequest(tOptions,tBody){
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        if(tOptions.method=="POST"){
            xhr.open("POST",encodeURI(tOptions.url), true);
        }else{
            xhr.open("GET",encodeURI(tOptions.url), true);
        }

        // xhr.setRequestHeader("access-control-allow-origin",'*');
        // xhr.setRequestHeader("Access-Control-Allow-Credentials",'true');
        // xhr.setRequestHeader("Access-Control-Allow-Headers",'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type');
        if( tOptions.headers ){
            for(let sHeader in tOptions.headers){
                xhr.setRequestHeader(sHeader,tOptions.headers[sHeader]);
            }
        }
        xhr.onreadystatechange = function(){
            let XMLHttpReq = xhr;
            if (XMLHttpReq.readyState == 4) {
                if (XMLHttpReq.status == 200) {                
                    let data = XMLHttpReq.responseText;
                    let sData = unicode2Chr(data);
                    resolve(sData);
                }else{
                    reject();
                }
            }
        };
        if(!tBody){
            tBody={};
        }
        xhr.send(JSON.stringify(tBody));
    });
}

function DoDataFilterNationAndFillToRevenueGrid(){
    if(!bGet30DaysDataOk){
        return;
    }
    let oGrid = w2ui.statisticsGrid;
    oGrid.clear();
    oGrid.columns =
    [
        { field: 'recid', caption: '日期', size: '90px', sortable: true, attr: 'align=center', frozen:true },
        { field: 'weekday', caption: '星期', size: '50px', sortable: true, resizable: true, frozen:true  },
        { field: 'total_Android', caption: '总GP', size: '60px', sortable: true, resizable: true, frozen:true  },
        { field: 'total_IOS', caption: '总IOS', size: '60px', sortable: true, resizable: true, frozen:true  },
    ];
    for(let sNation of T_NATION){
        let nSize = T_NATION_NAME[sNation].length;
        let sSize = "65px"
        if(nSize==4){
            sSize="80px"
        }
        oGrid.columns.push({ field: sNation+"_Android", caption: T_NATION_NAME[sNation]+"GP", size: sSize, sortable: true,style:"border: 2px solid #880088;border-bottom-style: none;border-top-style: none;border-right-style: none;" });
        oGrid.columns.push({ field: sNation+"_IOS", caption: T_NATION_NAME[sNation]+"IOS", size: sSize, sortable: true,style:"border: 2px solid #880088;border-bottom-style: none;border-top-style: none;border-left-style: none;"  });
    }
    for(let sDate in tLast30DaysAllData){
        let tDateData = tLast30DaysAllData[sDate];
        if(tDateData){
            let tLineData = {}
            tLineData.recid = sDate;
            let nWeekDay=moment(sDate,"YYYY-MM-DD").weekday();
            tLineData.weekday = T_WEEK_DAY[nWeekDay];
            oGrid.records.push(tLineData);
            let tRevenueData = GetDateAdsNationData(tDateData)
            if(tRevenueData){
                let nTotalGP = 0
                let nTotalIOS =0
                for(let sNation of T_NATION){
                    tLineData[sNation+"_Android"] = parseFloat(tRevenueData[sNation].Android.REVENUE).toFixed(2);
                    tLineData[sNation+"_IOS"] = parseFloat(tRevenueData[sNation].IOS.REVENUE).toFixed(2);
                    nTotalGP+=tRevenueData[sNation].Android.REVENUE;
                    nTotalIOS+=tRevenueData[sNation].IOS.REVENUE;
                }
                tLineData["total_Android"]=parseFloat(nTotalGP).toFixed(2);
                tLineData["total_IOS"]=parseFloat(nTotalIOS).toFixed(2);
            }
        }
    }
    oGrid.render();   
    oGrid.sort('recid', 'asc');
}

function DoRequestAsync(tOptions,tBody,pCallback){
    let xhr = new XMLHttpRequest();
    if(tOptions.method=="POST"){
        xhr.open("POST",encodeURI(tOptions.url), true);
    }else{
        xhr.open("GET",encodeURI(tOptions.url), true);
    }

    // xhr.setRequestHeader("access-control-allow-origin",'*');
    // xhr.setRequestHeader("Access-Control-Allow-Credentials",'true');
    // xhr.setRequestHeader("Access-Control-Allow-Headers",'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type');
    if( tOptions.headers ){
        for(let sHeader in tOptions.headers){
            xhr.setRequestHeader(sHeader,tOptions.headers[sHeader]);
        }
    }
    xhr.onreadystatechange = function(){
        let XMLHttpReq = xhr;
        if (XMLHttpReq.readyState == 4) {
            if (XMLHttpReq.status == 200) {                
                let data = XMLHttpReq.responseText;
                let sData = unicode2Chr(data);
                pCallback(JSON.parse(sData));
            }else{
                pCallback();
            }
        }
    };
    if(!tBody){
        tBody={};
    }
    xhr.send(JSON.stringify(tBody));
}

function ExportAllDatas(){
    if(!bGet30DaysDataOk){
        return;
    }
    let sContent = "Date,WeekDay,Rev($),ECPM($),Requst,Fill,FillRatio,Show,ShowRatio,Start,End,ViewRatio,Click,ClickRatio\n"
    for(let sDate in tLast30DaysAllData){
        let tDateData = tLast30DaysAllData[sDate];
        if(tDateData){
            let oNow = moment(sDate,"YYYY-MM-DD");
            let tData = GetDateAdsTypeNationData("Admob","US","",tDateData);
            let sLineData=oNow.format("YYYY/MM/DD")+","+T_WEEK_DAY[oNow.weekday()]+","+tData.Android.REVENUE;
            console.log(tData);
            sContent+=sLineData+"\n";
        }
    }
    download("./data/hello.csv",sContent);
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function UpdateShowedNetworkData(){
    let oGrid = w2ui.netGrid;
    if(!bGet30DaysDataOk||!sSelectedNation||!sSelectedApp||!sNetSelectedNetwork||!oGrid){
        return;
    }
    oGrid.clear();
    if(sNetSelectedNetwork=="Admob"){
        UpdateShowNetworkData("Admob",
        [
            ["Reward",["Rev","Ecpm","Request","Fill","FillRatio","Views","ViewRatio","Start","Finish","FinishRatio","Click","ClickRatio"]],
            ["Banner",["Rev","Ecpm","Request","Fill","FillRatio","Views","ViewRatio","Click","ClickRatio"]],
            ["Interstitial",["Rev","Ecpm","Request","Fill","FillRatio","Views","ViewRatio","Click","ClickRatio"]],
            ["Medium",["Rev","Ecpm","Request","Fill","FillRatio","Views","ViewRatio","Click","ClickRatio"]]
        ]);
    }else if(sNetSelectedNetwork=="Facebook"){
        UpdateShowNetworkData("Facebook",[
            ["Reward",["Rev","Ecpm","Request","Fill","FillRatio","Views","ViewRatio","Click","ClickRatio"]],
            ["Banner",["Rev","Ecpm","Request","Fill","FillRatio","Views","ViewRatio","Click","ClickRatio"]],
            ["Interstitial",["Rev","Ecpm","Request","Fill","FillRatio","Views","ViewRatio","Click","ClickRatio"]],
            ["Medium",["Rev","Ecpm","Request","Fill","FillRatio","Views","ViewRatio","Click","ClickRatio"]]
        ]);
    }
}

function UpdateShowNetworkData(sNetwork,tAttris){
    let sFilterApp = sSelectedApp;
    let tAppConf = tNetworkConfig[sFilterApp];
    if(!tAppConf){
        return;
    }
    let tAppNetworkConfig = tAppConf[sNetwork];
    if(!tAppNetworkConfig){
        return;
    }
    let oGrid = w2ui.netGrid;
    oGrid.columns =
    [
        { field: 'recid', caption: '日期', size: '90px', sortable: true, attr: 'align=center', frozen:true },
        { field: 'weekday', caption: '星期', size: '50px', sortable: true, resizable: true, frozen:true  },
    ];
    InitGridAttris(oGrid,tAttris[0][0],tAttris[0][1],"#FF0000");
    oGrid.columns.push({ field: "space1", caption: "", size: '30px', sortable: false, resizable: false,style:`border: 2px solid #FF0000;border-bottom-style: none;border-top-style: none;border-right-style: none;`  });
    InitGridAttris(oGrid,tAttris[1][0],tAttris[1][1],"#00FF00");
    oGrid.columns.push({ field: "space2", caption: "", size: '30px', sortable: false, resizable: false,style:`border: 2px solid #00FF00;border-bottom-style: none;border-top-style: none;border-right-style: none;`  });
    if(tAttris[2]){
        InitGridAttris(oGrid,tAttris[2][0],tAttris[2][1],"#FF00FF");
        oGrid.columns.push({ field: "space3", caption: "", size: '30px', sortable: false, resizable: false,style:`border: 2px solid #FF00FF;border-bottom-style: none;border-top-style: none;border-right-style: none;`  });
    }
    if(tAttris[3]){
        InitGridAttris(oGrid,tAttris[3][0],tAttris[3][1],"#00FFFF");
    }
    for(let sDate in tLast30DaysAllData){
        let tDateData = tLast30DaysAllData[sDate];
        if(tDateData){
            let tLineData = {}
            tLineData.recid = sDate;
            let nWeekDay=moment(sDate,"YYYY-MM-DD").weekday();
            tLineData.weekday = T_WEEK_DAY[nWeekDay];
            FillGridByAttris(oGrid,"Reward",tLineData,GetDateAdsTypeNationData(sNetwork,sSelectedNation,"Reward",tDateData));
            FillGridByAttris(oGrid,"Banner",tLineData,GetDateAdsTypeNationData(sNetwork,sSelectedNation,"Banner",tDateData));
            FillGridByAttris(oGrid,"Interstitial",tLineData,GetDateAdsTypeNationData(sNetwork,sSelectedNation,"Interstitial",tDateData));
            FillGridByAttris(oGrid,"Medium",tLineData,GetDateAdsTypeNationData(sNetwork,sSelectedNation,"Medium",tDateData));
            oGrid.records.push(tLineData);
        }
    }
    oGrid.render();
    oGrid.sort('recid', 'asc');
}

function InitGridAttris(oGrid,sNetwork,tAttris,sColor){
    let tColumns = oGrid.columns;
    let nCount = 0;
    for(let sAttr of tAttris){
        let sAttriName = "Android_"+sAttr;
        if(sNetwork!=""){
            sAttriName = "Android_"+sNetwork+"_"+sAttr;
        }
        if(nCount==0){
            tColumns.push({ field: sAttriName, caption: T_COL_ATTRI_NAME[sAttr], size: '60px', sortable: true, resizable: true,style:`border: 2px solid ${sColor};border-bottom-style: none;border-top-style: none;border-right-style: none;`});
        }else{
            tColumns.push({ field: sAttriName, caption: T_COL_ATTRI_NAME[sAttr], size: '60px', sortable: true, resizable: true });
        }
        nCount++;
    }
    nCount = 0;
    let nLength = tAttris.nLength;
    for(let sAttr of tAttris){
        let sAttriName = "IOS_"+sAttr;
        if(sNetwork!=""){
            sAttriName = "IOS_"+sNetwork+"_"+sAttr;
        }
        if(nCount==0){
            tColumns.push({ field: sAttriName, caption: T_COL_ATTRI_NAME[sAttr], size: '60px', sortable: true, resizable: true,style:`border: 2px solid ${sColor};border-bottom-style: none;border-top-style: none;border-right-style: none;`});
        }else{
            tColumns.push({ field: sAttriName, caption: T_COL_ATTRI_NAME[sAttr], size: '60px', sortable: true, resizable: true });
        }
        nCount++;
    }
}

function FillGridByAttris(oGrid,sType,tLineData,tDateData){
    FillDataOfPlatform("Android",sType,tLineData,tDateData)
    FillDataOfPlatform("IOS",sType,tLineData,tDateData)
}

function FillDataOfPlatform(sPlatform,sType,tLineData,tDateData){
    FillAttriFieild(tLineData,tDateData,sPlatform,sType,"Rev","REVENUE",undefined,true)
    FillAttriFieild(tLineData,tDateData,sPlatform,sType,"Fill","AVALABLE")
    FillAttriFieild(tLineData,tDateData,sPlatform,sType,"FillRatio","REQUEST","AVALABLE",false,true)
    FillAttriFieild(tLineData,tDateData,sPlatform,sType,"Views","VIEWS")
    FillAttriFieild(tLineData,tDateData,sPlatform,sType,"ViewRatio","AVALABLE","VIEWS",false,true)
    FillAttriFieild(tLineData,tDateData,sPlatform,sType,"Request","REQUEST")
    FillAttriFieild(tLineData,tDateData,sPlatform,sType,"Click","CLICKED")
    FillAttriFieild(tLineData,tDateData,sPlatform,sType,"ClickRatio","VIEWS","CLICKED",false,true)
    FillAttriFieild(tLineData,tDateData,sPlatform,sType,"Start","VIEWS")
    FillAttriFieild(tLineData,tDateData,sPlatform,sType,"Finish","COMPLETES")
    FillAttriFieild(tLineData,tDateData,sPlatform,sType,"FinishRatio","VIEWS","COMPLETES",false,true)
    FillAttriFieild(tLineData,tDateData,sPlatform,sType,"Ecpm","VIEWS","REVENUE")
}

function FillAttriFieild(tLineData,tDateData,sPlatform,sNetwork,sAttr,sAttriName1,sAttriName2,bFloat,bRatio){
    let sAttriName = sPlatform+"_"+sAttr;
    if(sNetwork!=""){
        sAttriName = sPlatform+"_"+sNetwork+"_"+sAttr;
    }
    let nValue = GetDataFieldValByAttris(tDateData,sPlatform,sAttriName1,sAttriName2);
    if(sAttr=="Ecpm"){
        nValue = (nValue*1000).toFixed(2);
    }
    if(bFloat){
        nValue=nValue.toFixed(2)
    }
    if(bRatio){
        tLineData[sAttriName] = (nValue*100).toFixed(2)+"%";
    }else{
        tLineData[sAttriName] = nValue;      
    }
}

function GetDataFieldValByAttris(tData,sPlatform,sAttriName1,sAttriName2){
    if(!sAttriName2){
        return (tData[sPlatform][sAttriName1]) || 0;
    }
    let nAttriVal1 = tData[sPlatform][sAttriName1];
    let nAttriVal2 = tData[sPlatform][sAttriName2];
    if(nAttriVal1.toString()=="NaN"){
        nAttriVal1=0
    }
    if(nAttriVal2.toString()=="NaN"){
        nAttriVal2=0
    }
    if(nAttriVal1>0){
        return (nAttriVal2/nAttriVal1);
    }
    return 0
}

DoQueryAppConfigData()