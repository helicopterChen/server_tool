/*
 * @Description: 
 * @Author: cw
 * @LastEditors: cw
 * @Date: 2019-04-08 16:30:36
 * @LastEditTime: 2019-04-25 18:22:00
 */
let moment = require('moment');
let fs = require('fs');
let DataFetcher = require('./DataFetcher.js');
const STR_FORMAT = require('string-format');
let tNetworks = ["Admob","Facebook"];
function DataMgr() {
    this._T_CONF={};
    this._tFetchOkTable={};
    this._tTodayNoDataTable = {};
    this._bGoogleAuth=false;
    this._tDataFetchedOk=false;
    this._oTimer=null;
}

DataMgr.prototype.Init=function(tConfig){
    this._T_CONF=tConfig;
};

DataMgr.prototype.Start=function(){
    let self = this;
    setTimeout(() => {
        self.DoCheckAndFetech();
    }, 4000);
    this._oTimer=setInterval(()=>{
        self.DoCheckAndFetech();
    },18000);
};

DataMgr.prototype.Print=function(){
    console.log("PRINT");
};

DataMgr.prototype.SetGooglePlayAuthToken=function(sToken){
    this._sGoogleAuthToken = sToken;
}

DataMgr.prototype.GetNetworkDateData = function(sType,sDate,pCallback){ 
    let sFileName = STR_FORMAT("./saved_data/{}/{}.json",sDate,sType);
    if(fs.existsSync(sFileName)){
        fs.readFile(sFileName,"utf-8",(err,sData)=>{
            pCallback(JSON.parse(sData))
        });
    }
}

GetNetworkDateDataAsync = function(sType,sDate,pCallback){ 
    return new Promise(function (resolve, reject) {
        let sFileName = STR_FORMAT("./saved_data/{}/{}.json",sDate,sType);
        if(fs.existsSync(sFileName)){
            fs.readFile(sFileName,"utf-8",(err,sData)=>{
                resolve(JSON.parse(sData))
            });
        }else{
            reject();
        }
    });
}


DataMgr.prototype.GetDateAllNetworkData=async function(sDate,pCallback){
    let tData = {}
    for(let sNetworkName of tNetworks){
        tData[sNetworkName] = await GetNetworkDateDataAsync(sNetworkName,sDate);
    }
    pCallback(tData);
}

DataMgr.prototype.GetDateHalfNetworkData=async function(sDate,pCallback){
    let tData = {}
    for(let sNetworkName of tNetworks){
        if(sNetworkName!="AdMob"){
            tData[sNetworkName] = await GetNetworkDateDataAsync(sNetworkName,sDate);
        }
    }
    pCallback(tData);
}

DataMgr.prototype.GetDateSavedAllData = function(sDate,pCallback){
    let sDateDataFileName = "./saved_data/"+ sDate + "/All_Data.json";
    if(fs.existsSync(sDateDataFileName)){
        fs.readFile(sDateDataFileName,(err,data)=>{
            pCallback(JSON.parse(data));
        })
    }else{
        let sDateHalfDataFileName = "./saved_data/"+ sDate + "/Half_Data.json";
        if(fs.existsSync(sDateHalfDataFileName)){
            fs.readFile(sDateHalfDataFileName,(err,data)=>{
                pCallback(JSON.parse(data));
            })
        }else{
            pCallback()
        }
    }
}

DataMgr.prototype.DoCheckAndFetech=function(){
    let oBeginTime = moment();
    let self = this;
    for(let i=0;i<15;++i){
        let sDate = oBeginTime.subtract(1,"day").format("YYYY-MM-DD");
        if(!fs.existsSync("./saved_data/"+sDate)){
            fs.mkdirSync("./saved_data/"+sDate);
        }
        setTimeout(() => {
            self.DoCheckAndFetchAdmob(sDate);
            self.DoCheckAndFetchFacebook(sDate);
        },3500*i);
    }   
};

DataMgr.prototype.DoCheckAndFetchAdmob=function(sDate){
    let sFileName = "./saved_data/"+ sDate + "/Admob.json";
    if(!fs.existsSync(sFileName)){
        DataFetcher.RequestAdmobData(sDate,(tData)=>{
            this.SaveDataToFile(sFileName,tData,sDate);
        });   
    }
} 

DataMgr.prototype.DoCheckAndFetchFacebook=function(sDate){
    let sFileName = "./saved_data/"+ sDate + "/Facebook.json";
    let tFacebookDateData = {}
    let tDataQueryFinished={};
    if(!fs.existsSync(sFileName)){
        let nCount = 0;
        for(let sAppName in this._T_CONF.Keys.Facebook){
            setTimeout( async()=>{ 
                let tConf = this._T_CONF.Keys.Facebook[sAppName];
                if(tConf){
                    nCount++;
                    DataFetcher.RequestFacebookData(sDate,tConf.Token,tConf.ID, (tData)=>{
                        tDataQueryFinished[sAppName]=true
                        if(tData){
                            tFacebookDateData["Android_"+tConf.ID] = tData.android;
                            tFacebookDateData["IOS_"+tConf.ID] = tData.ios;  
                        }
                        for(let sName in this._T_CONF.Keys.Facebook){
                            if(!tDataQueryFinished[sName]){
                                return;
                            }
                        }
                        this.SaveDataToFile(sFileName,tFacebookDateData,sDate);
                    });    
                }   
            },nCount*200);
        }
    }
}

DataMgr.prototype.DoCheckAndSaveDateData=function(sDate){
    for(let sNetworkName of tNetworks){
        let sFileName = "./saved_data/"+ sDate + "/" +sNetworkName+ ".json";
        if(!fs.existsSync(sFileName)){
            return;
        }
    }
    this.GetDateAllNetworkData(sDate,(tData)=>{
        let sDateDataFileName = "./saved_data/"+ sDate + "/All_Data.json";
        let sFileData = JSON.stringify(tData);
        if(!fs.existsSync(sDateDataFileName) && sFileData != "{}"){
            fs.writeFile(sDateDataFileName,sFileData,(err)=>{
                if(!err){
                    console.log("save:"+sDateDataFileName);
                }
            });
        }
    });
}

DataMgr.prototype.DoCheckAndSaveHalfDateData=function(sDate){
    for(let sNetworkName of tNetworks){
        if(sNetworkName != "Admob"){
            let sFileName = "./saved_data/"+ sDate + "/" +sNetworkName+ ".json";
            if(!fs.existsSync(sFileName)){
                return;
            }
        }
    }
    this.GetDateHalfNetworkData(sDate,(tData)=>{
        let sDateDataFileName = "./saved_data/"+ sDate + "/Half_Data.json";
        let sFileData = JSON.stringify(tData);
        if(!fs.existsSync(sDateDataFileName) && sFileData != "{}"){
            fs.writeFile(sDateDataFileName,sFileData,(err)=>{
                if(!err){
                    console.log("save:"+sDateDataFileName);
                }
            });
        }
    });
}

DataMgr.prototype.SaveDataToFile = function(sFileName,tData,sDate){
    if(!tData){
        return
    }
    let sFileData = JSON.stringify(tData);
    if(!fs.existsSync(sFileName) && sFileData != "{}"){
        fs.writeFile(sFileName,sFileData,(err)=>{
            if(!err){
                this.DoCheckAndSaveHalfDateData(sDate);
                this.DoCheckAndSaveDateData(sDate);
            }
        });
    }
}

DataMgr.prototype.refetchSevenDay = function(){
    let oBeginTime = moment();
    for(let i=0;i<7;++i){
        let sDate = oBeginTime.subtract(1,"day").format("YYYY-MM-DD");
        let sDirName = "./saved_data/"+sDate
        if(fs.existsSync(sDirName)){
            for(let sNetworkName of tNetworks){
                let sFileName = "./saved_data/"+sDate+"/"+sNetworkName+".json";
                if(fs.existsSync(sFileName)){
                    fs.unlinkSync(sFileName);
                }
            }
            let sHalfData =  "./saved_data/"+sDate+"/Half_Data.json";
            if(fs.existsSync(sHalfData)){
                fs.unlinkSync(sHalfData);
            }
            let sAllData =  "./saved_data/"+sDate+"/All_Data.json";
            if(fs.existsSync(sAllData)){
                fs.unlinkSync(sAllData);
            }
            fs.rmdirSync(sDirName);
        }
    }
    let self = this;
    let oFetchBeginTime = moment();
    for(let i=0;i<7;++i){
        let sDate = oFetchBeginTime.subtract(1,"day").format("YYYY-MM-DD");
        if(!fs.existsSync("./saved_data/"+sDate)){
            fs.mkdirSync("./saved_data/"+sDate);
        }
        setTimeout(() => {
            self.DoCheckAndFetchAdmob(sDate);
            self.DoCheckAndFetchFacebook(sDate);
        },3500*i);
    }
}

module.exports = {
    Instance: new DataMgr()
}