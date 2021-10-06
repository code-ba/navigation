const logger = require('hexo-log')()
const fs = require('fs')
const path=require('path')
const axios=require('axios')
const yaml=require('yamljs')

hexo.extend.filter.register('before_generate', async () => {
  // Get first two digits of the Hexo version number
  var hexoVer = hexo.version.replace(/(^.*\..*)\..*/, '$1')
  var listData=[];
  var defaultLang="cn"
  var languageArr=[];
  var languageKeyArr=[];
  var lang=defaultLang;
  var menuData=[];
  const listDataReg=/^source\/_data\//
  const listDataSource=hexo.theme.config.listDataSource||"source/_data/data.yml"
  const keywords=[];
  var data=[]
  if(listDataReg.test(listDataSource)){
    //source/_data/data.yml
    if (!hexo.locals.get) {
      data = hexo.locals.get('data')?.[listDataSource.replace(listDataReg,'').replace(/\.yml$/,'')||"data"]
      if(!data){
        logger.error(`配置路径未找到：${listDataSource}`)
        process.exit(-1)
      }
    }else{
      const url=path.join('.',listDataSource)
      const result = fs.readFileSync(url);
      try{
        data=yaml.parse(result.toString('utf-8'))
      }catch(err){
        logger.error(`文件格式不正确：${url}`)
        process.exit(-1)
      }
    }
    hexo.config.keywords=hexo.config.keywords||keywords.join(",");
    keywords.push(hexo.config.title);
    hexo.config.description=hexo.config.description||keywords.join(",");
  }else{
    var result=await axios.get(listDataSource)
    if(result.status===200){
      data=yaml.parse(result.data)
    }
  }
  
      // 初始化国际化配置，设置默认值
      if(data.language instanceof Object){
        languageKeyArr=Object.keys(data.language)
        if(!languageKeyArr.length){
          languageKeyArr=[defaultLang]
          languageArr=['中文'];
        }
        languageKeyArr.forEach(function(key,index){
          if(!index)defaultLang=key;
          languageArr.push(data.language[key])
        });
        lang=languageKeyArr[0]||defaultLang;
      }
      // 初始化列表数据
      if(Array.isArray(data.listdata)){
        menuData=data.listdata.map(item=>{
          item.title=item.title||item['title_'+lang];
          languageKeyArr.forEach(v=>{
            item['title_'+v]=item['title_'+v]||item.title;
          })
          keywords.push(item.title)
          if(Array.isArray(item.children)){
            item.children.forEach(child=>{
              child.title=child.title||child['title_'+lang];
              languageKeyArr.forEach(v=>{
                child['title_'+v]=child['title_'+v]||child.title;
              })
              if(!Array.isArray(child.link))child.link=[];
              child.link.forEach(linkItem=>{
                linkItem.name=linkItem.name||linkItem['name_'+lang];
                linkItem.description=linkItem.description||linkItem['description_'+lang];
                languageKeyArr.forEach(v=>{
                  linkItem['name_'+v]=linkItem['name_'+v]||linkItem.name;
                  linkItem['description_'+v]=linkItem['description_'+v]||linkItem.description;
                })
              })
            });
            listData.splice(listData.length,0,...item.children);
          }else{
            // 没有二级菜单，直接遍历
            if(!Array.isArray(item.link))item.link=[];
            item.link.forEach(linkItem=>{
              linkItem.name=linkItem.name||linkItem['name_'+lang];
              linkItem.description=linkItem.description||linkItem['description_'+lang];
              languageKeyArr.forEach(v=>{
                linkItem['name_'+v]=linkItem['name_'+v]||linkItem.name;
                linkItem['description_'+v]=linkItem['description_'+v]||linkItem.description;
              })
            });
            listData.push(item);
          }
          return item;
        })
      }

  if (hexoVer < 5) {
    logger.error('Please update Hexo to V5.0.0 or higher!')
    logger.error('請把 Hexo 升級到 V5.0.0 或更高的版本！')
    process.exit(-1)
  }

  const rootConfig = hexo.config
  if (hexo.locals.get) {
    const data = hexo.locals.get('data')
    data && data.webstack && (hexo.theme.config = data.webstack)
  }
  hexo.theme.config.rootConfig = rootConfig

  hexo.config.defaultLang=defaultLang;
  hexo.config.languageArr=languageArr;
  hexo.config.languageKeyArr=languageKeyArr;
  hexo.config.listData=listData;
  hexo.config.menuData=menuData;
  hexo.config.lang=lang;
})
