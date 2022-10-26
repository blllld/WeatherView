# WeatherView
## 天气插件使用说明

1. 将本插件脚本放到当前工程的 `.obsidian/snippets` 目录下，如果没有可以新建目录，可以放在其他目录下，但是必须在当前仓库

2. 修改插件文件中 `const key = "和风天气Key"`后才可以使用
需要到[和风天气官网](https://www.qweather.com/ )申请个人码  

和风试用key：`dc0f31ac6f37484f88e3e7d45b84e403`，会有次数限制，建议个人申请自己的码最好

3. 在需要天气的md中添加`dataviewjs`代码块以及以下内容：

```js
// 脚本的位置
const plugin = '.obsidian/snippets/WeatherView.js'

let settings = {};

// 和风天气key，可以在WeatherView.js中配置固定key，也可以在此配置单次key
settings.key="dc0f31ac6f37484f88e3e7d45b84e403"

// 如果定位不准时可以填写指定城市
settings.city = "";

// 填写你关心的另一个城市，没有可以不填
settings.anotherCity = "";

// 这里填写你关心的日期，如果没有可不写该项
settings.schedule = ['元旦','2023-1-1']

settings.custom = {emoji:"很好"}

const WeatherView = await app.vault.adapter.read(plugin)

const fn = new Function("dv","input",WeatherView)

// 得到两个执行函数
const {genWeather,allWeather} = fn.call(this,this,settings);

// 输出天气表格和关照语
await genWeather();

// 输出缓存数据参照6说明
let weatherData = await allWeather("2022",["天气"])

// 打印输出的数据到页面上
// 配合dataview可以做更多的事情
dv.el('div',JSON.stringify(weatherData))
```

4. settings说明，配置全部为非必填

|   名称   |  说明    |
| ---- | ---- |
|   settings.isToday   |  是否当天，如果是则会保持当天，否则会按照文件创建时间    |
|   settings.cacheable   |  默认为true,不想缓存天气可以配置false   |
|   settings.key   |  指定和风key，否则使用内部提供的key值    |
|   settings.city   |  指定城市，默认当前定位城市    |
|   settings.anotherCity   |  指定另一个城市   |
|   settings.schedule   |  指定倒计时日，[名称，日期]   |
|   settings.custom   |  自定义存储数据  |


5. genWeather 生成天气表格

`await genWeather()`

6. allWeather 获取已经缓存的按天天气


`const weatherData = await allWeather(year,name,range)`


|   名称   |  说明    |
| ---- | ---- |
|year|默认当前年"2022"|
|name|表格的标题，如果不传代表所有项，可以从中选择多个["日期","天气","温度","云量","月相"]|
|range|时间区间，不传代表所有天，可以传指定天 ["2022-1-1","2022-5-10"]|


 
响应值参照：`{"2022-10-18":{"weather":["晴 ☀️","9~18℃"],"custom":{"emoji":"很好"}}}`



