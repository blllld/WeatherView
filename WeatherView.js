/**
 * 天气dataviewjs插件
 * https://github.com/blllld/WeatherView
 * @author: 非思 
 */

// 替换成你的和风天气key
let key = "和风天气Key";

// 3天或者7天
// 新的和风key仅支持3天
// 如果修改成7天，需要替换支持的key
const days = 3

// 天气图标emoji
// 需要更多的天气可以在此配置
// https://www.emojiall.com/
const weatherICONs = {
    "晴": '☀️',
    "阴": '☁',
    "多云": '⛅',
    "风": '💨',
    "大风": "🍃",
    "台风": '🌀',
    "雨": '🌧️',
    "雪": '❄️',
    "雷": '⚡',
    "雾": '🌫️',
    "雷阵雨": "⛈️",
}

// 月相图标
const moonICONs = {
    "新月": "🌑",
    "朔月": "🌑",
    "娥眉月": "🌒",
    "上弦月": "🌓",
    "下弦月": "🌗",
    "盈凸月": "🌔",
    "亏凸月": "🌖",
    "满月": "🌕",
    "残月": "🌙",
    "默认": "🌙"
}

const weatherURL = (locationId) => `https://devapi.qweather.com/v7/weather/${days}d?key=${key}&location=${locationId}`

const searchCityURL = (city) => `https://geoapi.qweather.com/v2/city/lookup?key=${key}&number=1&location=${city}`

const postionLocateURL = () => "http://whois.pconline.com.cn/ipJson.jsp?json=true"


// .md 文件的创建日期
const fileCreateDate = moment(dv.current().file.ctime.ts);

let Year = fileCreateDate.format('YYYY');

let now = fileCreateDate;

// 文件创建当天年月日
let today = fileCreateDate.format('YYYY-MM-DD');

// 按年存储
const weatherStatesFile = (year = Year) => '.obsidian/.weather-stats-' + year;

// 天气数据
let WeatherData = {};

let weatherTableHead = ["日期", "天气", "温度", "云量", "月相"];
/**
 * 获取天气的缓存数据
 */
async function retrieveWeatherStates(year = Year, replace = true) {
    let stats = "{}"
    // 防止文件不存在
    if (await app.vault.adapter.exists(weatherStatesFile(year))) {
        stats = await app.vault.adapter.read(weatherStatesFile(year)) || "{}"
    }
    let data = JSON.parse(stats)
    if (replace) {
        WeatherData = data
    }
    return data;
}

// 添加新的天气缓存
async function appendWeather(locateCity, anotherCity, city, custom) {
    WeatherData[today] = {
        loc: locateCity,
        ano: anotherCity,
        city,
        custom
    }
    await app.vault.adapter.write(weatherStatesFile(), JSON.stringify(WeatherData))
}

/**
 * 获取指定的所有天气
 */
async function allWeather(year = Year, names = weatherTableHead, range = []) {
    if (!year) return []

    let headIndex = names.map((hName) => weatherTableHead.indexOf(hName)).filter(it => it != -1);

    let weathers = await retrieveWeatherStates(year, false);

    let weatherData = {};

    for (let date in weathers) {
        let [fromDate, toDate] = range;
        if (fromDate && moment(fromDate) > moment(date)) {
            continue;
        }
        if (toDate && moment(toDate) < moment(date)) {
            continue;
        }
        let { loc, custom = "" } = weathers[date];
        let datas = weatherTableData(loc)

        weatherData[date] = {
            weather: headIndex.map(index => datas.at(0).at(index)),
            custom: custom
        }
    }

    return weatherData;
}


/**
 * 网络请求
 */
async function urlGet(url) {
    let finalURL = new URL(url);
    const res = await requestUrl({
        url: finalURL.href,
        method: "GET",
    });
    let charset = res.headers['content-type'].match(/charset=(.+)/).at(1);
    let arrayBuffer = res.arrayBuffer;
    let str = new TextDecoder(charset).decode(new Uint8Array(arrayBuffer));
    return JSON.parse(str);
}

/**
 * 定位
 */
async function setLocation() {
    let { cityCode } = await urlGet(postionLocateURL())

    return cityCode
}

/**
 * 根据城市名获取天气查询条件
 */
async function retrieveLocationByCityName(cityName) {
    if (!cityName) {
        cityName = await setLocation();
    }
    let { code, location } = await urlGet(searchCityURL(cityName))
    if (code == '200') {
        return location[0]
    }
    return -1;
}

/**
 * 查询城市天气
 */
async function retrieveNewWeather(cityName) {
    let location = await retrieveLocationByCityName(cityName);
    let { daily: weather, code } = await urlGet(weatherURL(location.id));

    if (code != '200') {
        weather = []
    }

    return {
        weather: appendWeatherIcons(weather),
        cityName: location.name
    };
}

/**
 * 添加天气、月相图标
 * @param {{textDay:string,moonPhase,iconDay,moonPhaseIcon}[]} weather
 */
function appendWeatherIcons(weather) {
    return weather.map(w => {
        let textDay = w.textDay
        let iconDay = weatherICONs[textDay];
        if (!iconDay) {
            for (let icon in weatherICONs) {
                if (textDay.includes(icon)) {
                    iconDay = weatherICONs[icon]
                }
            }
        }
        w.iconDay = iconDay
        return w;
    }).map(w => {
        let moonPhase = w.moonPhase
        let moonPhaseIcon = moonICONs[moonPhase];
        if (!moonPhaseIcon) {
            moonPhaseIcon = moonICONs['默认'];
        }
        w.moonPhaseIcon = moonPhaseIcon
        return w;
    });
}
function weatherTableData(weather) {
    return weather.map(({ fxDate, textDay, iconDay, tempMin, tempMax, cloud, moonPhase, moonPhaseIcon }) => {
        return [
            fxDate,
            `${textDay} ${iconDay}`,
            `${tempMin}~${tempMax}℃`,
            `${cloud}%`,
            `${moonPhase} ${moonPhaseIcon}`
        ]
    })
}

/**
 * 设置日期备忘录
 */
function setupRemindSchedule([dateName, date]) {
    if (!dateName || !date) {
        return;
    }
    const pastDays = now.diff(now.format("YYYY-1-1"), "days");
    const remaindDays = moment(date).diff(now, "days");

    const hello = fileCreateDate.format("A好，今天是YYYY年MM月DD日 dddd")
    const pastDay = `今年已经过去${pastDays}天，距离${dateName}还有${remaindDays}天`

    dv.el('div', [hello, pastDay].join("，"))
    dv.el('br')
}

/**
 * 设置当前城市天气情况
 */
function setupCurrentWeather(weather, cityName) {
    let {
        tempMin, tempMax,
        cloud,
        textDay, iconDay,
        moonPhaseIcon,
        windDirDay, windScaleDay,
        sunrise: sunriseTime, sunset: sunsetTime
    } = weather.at(0);
    let days = weather.length;
    let tempRange = `今天白天${textDay}${iconDay}，🌡️${tempMin}~${tempMax}℃`
    let wind = `🍃${windDirDay}${windScaleDay}级`
    let cloudFill = `云朵充盈了${cloud}%的天空`
    let sunriseSunset = `早上${sunriseTime}🌄日出，晚上${sunsetTime}🌇日落`;
    let moonPhase = `今晚的月亮应该长这样${moonPhaseIcon}，记得看看`;
    let temperture = [tempRange, wind, cloudFill, sunriseSunset, moonPhase].join("，")

    dv.el('div', temperture);
    if (days > 1) {
        let weatherData = weatherTableData(weather)
        dv.el('div', `未来${days}天${cityName}的天气如下：`)
        dv.table(weatherTableHead, weatherData)
    }
}

/**
 * 设置另一个城市天气情况
 */
function setupAnotherWeather(weather) {
    if (!weather || weather.length == 0) return;
    let {
        textDay, iconDay,
        tempMin, tempMax
    } = weather.at(0);

    let cares = `（对了，你关心的那个城市今天白天${textDay}${iconDay}，🌡️${tempMin}~${tempMax}℃`
    dv.el("p", cares);
}

function resetDate(isToday) {
    if (isToday) {
        let m = moment();
        now = m;
        Year = m.format('YYYY')
        today = m.format('YYYY-MM-DD');
    }
}

/**
 * 程序入口
 */
async function genWeather(settings) {
    const {
        isToday = false,
        key: hefengKey,
        schedule = [],
        anotherCity = "",
        city: currentCity = "",
        custom = "",
    } = settings;

    if (hefengKey) {
        key = hefengKey;
    }

    if (!key) {
        dv.el('div', "WeatherView需要您先配置和风天气key再使用 https://www.qweather.com/")
        return;
    }

    resetDate(isToday);

    let data = await retrieveWeatherStates();

    let { loc = [], ano = [], city, custom: customData } = data[today] || {};
    let shouldUpdate = false;

    if (!loc.length) {
        let { weather: currentWeather, cityName } = await retrieveNewWeather(currentCity);
        city = cityName;
        loc = currentWeather;
        shouldUpdate = true
    }

    if (anotherCity && !ano.length) {
        let { weather: anotherWeather } = await retrieveNewWeather(anotherCity);
        ano = anotherWeather;
        shouldUpdate = true
    }

    if (custom != customData) {
        customData = custom;
        shouldUpdate = true
    }

    if (shouldUpdate) {
        await appendWeather(loc, ano, city, customData);
    }

    setupRemindSchedule(schedule);

    setupCurrentWeather(loc, city);

    setupAnotherWeather(ano);
}


return {
    genWeather: () => genWeather(input),
    allWeather: allWeather
}
