import { load } from "cheerio";
import axios from "axios";
import { appendFile } from "fs";

// URL новостного сайта
const URL = 'https://stopgame.ru/blogs';
const REGEX_BLOG_ID = /^\/blogs\/topic\/(\d*)\//;
const NUMBER_18 = 40;

// [
//     0,   0,   0,   0,  32,  72,
//   102, 148, 207, 268, 333, 393,
//   447, 498, 544, 586, 625, 662,
//   695
// ]

const fetchNews = async (iter) => {
    try {
        const { data } = await axios.get(`${URL}/all/p${iter}`);
        const $ = load(data);

        const newsHeadlines = [];

        $('._title_1lcny_24').each((_, element) => {
            const link = $(element).attr('href');
            // Получаю только номера
            newsHeadlines.push(REGEX_BLOG_ID.exec(link)[1]);
        });
        return newsHeadlines;
    } catch (error) {
        console.error('Ошибка при загрузке страницы:', error.message);
        return [];
    }
};


const fetchOnePage = async (id) => {
    try {
        const { data } = await axios.get(`${URL}/topic/${id}`);
        const $ = load(data);

        const page = {
            id: id,
            title: "",
            date: "",
            author: "",
            upvote: "",
            number_of_comments: 0,
            number_of_views: 0,
            number_of_bookmarks: 0,
            pictures: [],
            content: ""
        }

        // заголовок
        $('h1').each((_, element) => {
            page["title"] = $(element).text();
        });

        // дата
        page["date"] = $('._date_5hrm4_596._date--full_5hrm4_1').first().text().trim();
        if (page["date"] == "Сегодня") {
            page["date"] = new Date().toLocaleString('ru-RU', { day: 'numeric', month: 'long' });
        }

        // автор
        page["author"] = $('._user-info__name_dhept_1165').first().text();

        // апвоуты
        page["upvote"] = $('span._rating-spinner__rating_1ljrf_95._rating-spinner__rating--positive_1ljrf_1').text()

        // число комментов
        if ($('div._top-info_5hrm4_552 a').first()) page["number_of_comments"] = parseInt($('._top-info_5hrm4_552 a').first().text());

        // число просмотров
        page["number_of_views"] = parseInt($('div._top-info_5hrm4_552 span').eq(2).text().trim())

        // число закладок
        if ($('button._bookmark_5hrm4_635 span').text() != "")
            page["number_of_bookmarks"] = parseInt($('button._bookmark_5hrm4_635 span').text().trim())

        // картинки
        $('div._image-wrapper_5hrm4_173._image-width_5hrm4_116 a').each((_, element) => {
            page["pictures"].push($(element).attr("href"));
        })

        // текст
        $('p._text_5hrm4_111._text-width_5hrm4_111').each((_, element) => {
            page["content"] += $(element).text()
        });
        page["content"] = page["content"].replaceAll("\n", " ");
        asynced.push(page);
        return page;
    } catch (error) {
        console.error('Ошибка при загрузке страницы:', error.message);
        return {};
    }
};

let asynced = [];
let comparison = [];

setInterval(() => {
    console.log("элементов в асинхронке: " + asynced.length);
    comparison.push(asynced.length);
}, 1000);

const asynchronously = async () => {
    const idPromises = []
    for (let iter = 1; iter < NUMBER_18; iter++) {
        idPromises.push(fetchNews(iter))
    }
    Promise.all(idPromises)
        .then(ids => {
            const promises = []
            for (const id of ids.flat()) {
                promises.push(fetchOnePage(id))
            }
            Promise.all(promises).then(result => {
                appendFile("result-async.json", JSON.stringify(result, null, 2), (err) => {
                    if (err) {
                        console.error('Ошибка при добавлении в файл:', err);
                    } else {
                        console.log('Асинхронный парсинг успешно выполнен за ' + (performance.now() - start));
                        console.log(comparison);
                        process.exit();
                    }
                });
            })
        })
};

const start = performance.now();
asynchronously();